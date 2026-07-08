"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import {
  parseMentions,
  buildMentionReplacements,
  getMentionNotificationRecipientIds,
} from "@/features/comments/mentions";
import { writeAuditLog, writeCandidateHistory } from "@/server/audit";
import { dispatchMentionNotification } from "@/server/notifications/dispatch";
import { getCurrentUser, requireJobAccess } from "@/server/auth/session";
import { saveAttachmentFile } from "@/server/storage";
import { validateAttachmentFile } from "@/server/upload-validation";

export type CommentFormState = {
  error?: string;
  commentId?: string;
};

export type AttachmentUploadState = {
  error?: string;
};

async function userCanAccessJob(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  jobId: string,
) {
  if (user.role === "admin") {
    return true;
  }

  const membership = await prisma.jobUser.findUnique({
    where: {
      jobId_userId: {
        jobId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function createCommentAction(
  jobId: string,
  candidateId: string,
  _previousState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await requireJobAccess(jobId);
  const body = String(formData.get("body") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "job") as "job" | "admin";

  if (!body) {
    return { error: "Comment body is required." };
  }

  if (body.length > 10000) {
    return { error: "Comment must be 10,000 characters or fewer." };
  }

  if (visibility !== "job" && visibility !== "admin") {
    return { error: "Invalid visibility." };
  }

  if (visibility === "admin" && user.role !== "admin") {
    return { error: "Only admins can create admin-only comments." };
  }

  const commentId = randomUUID();

  try {
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, jobId },
      select: { id: true, name: true, job: { select: { title: true } } },
    });

    if (!candidate) {
      return { error: "This candidate no longer exists." };
    }

    const jobUsers = await prisma.jobUser.findMany({
      where: { jobId },
      select: {
        user: { select: { id: true, username: true, name: true, email: true } },
      },
    });

    const validUsernames = new Map<string, string>();
    const userMap = new Map<string, { username: string; email: string }>();

    for (const ju of jobUsers) {
      const uname = ju.user.username.toLowerCase();
      validUsernames.set(uname, ju.user.id);
      userMap.set(ju.user.id, { username: ju.user.username, email: ju.user.email });
    }

    const mentionedUserIds = getMentionNotificationRecipientIds(
      parseMentions(body, validUsernames),
      user.id,
    );

    const normalizedBody = buildMentionReplacements(body, mentionedUserIds, userMap);

    await prisma.$transaction(async (tx) => {
      await tx.candidateComment.create({
        data: {
          id: commentId,
          candidateId,
          authorId: user.id,
          body: normalizedBody,
          visibility,
          ...(mentionedUserIds.length > 0
            ? {
                mentions: {
                  create: mentionedUserIds.map((mentionedUserId) => ({
                    mentionedUserId,
                  })),
                },
              }
            : {}),
        },
      });

      for (const mentionedUserId of mentionedUserIds) {
        const mentionedUser = userMap.get(mentionedUserId);

        if (mentionedUser) {
          await dispatchMentionNotification(tx, {
            recipientUserId: mentionedUserId,
            recipientEmail: mentionedUser.email,
            actorName: user.name,
            candidateName: candidate.name,
            jobTitle: candidate.job.title,
            jobId,
            candidateId,
            commentExcerpt: normalizedBody,
          });

          const notification = await tx.notification.findFirst({
            where: {
              recipientUserId: mentionedUserId,
              relatedCandidateId: candidateId,
              type: "comment_mention",
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });

          if (notification) {
            await writeAuditLog(tx, {
              actorId: user.id,
              action: "notification_created",
              entityType: "notification",
              entityId: notification.id,
              metadata: {
                jobId,
                candidateId,
                recipientUserId: mentionedUserId,
                type: "comment_mention",
              },
            });
          }
        }
      }

      await writeCandidateHistory(tx, {
        actorId: user.id,
        action: "comment_created",
        candidateId,
        entityType: "comment",
        entityId: commentId,
        metadata: {
          jobId,
          candidateId,
          visibility,
          mentionCount: mentionedUserIds.length,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}/candidates/${candidateId}`);
    return { commentId };
  } catch (error) {
    console.error("createCommentAction failed", error);
    return { error: "Could not save the comment. Please try again." };
  }
}

export async function updateCommentAction(
  commentId: string,
  _previousState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return { error: "Comment body is required." };
  }

  if (body.length > 10000) {
    return { error: "Comment must be 10,000 characters or fewer." };
  }

  try {
    const comment = await prisma.candidateComment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        authorId: true,
        candidateId: true,
        candidate: { select: { jobId: true, name: true, job: { select: { title: true } } } },
      },
    });

    if (!comment) {
      return { error: "This comment no longer exists." };
    }

    if (comment.authorId !== user.id) {
      return { error: "You can only edit your own comments." };
    }

    if (!(await userCanAccessJob(user, comment.candidate.jobId))) {
      return { error: "You no longer have access to this job." };
    }

    const jobUsers = await prisma.jobUser.findMany({
      where: { jobId: comment.candidate.jobId },
      select: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    const validUsernames = new Map<string, string>();
    const userMap = new Map<string, { username: string; email: string }>();

    for (const ju of jobUsers) {
      validUsernames.set(ju.user.username.toLowerCase(), ju.user.id);
      userMap.set(ju.user.id, { username: ju.user.username, email: ju.user.email });
    }

    const mentionedUserIds = getMentionNotificationRecipientIds(
      parseMentions(body, validUsernames),
      user.id,
    );

    const normalizedBody = buildMentionReplacements(body, mentionedUserIds, userMap);

    await prisma.$transaction(async (tx) => {
      await tx.commentMention.deleteMany({ where: { commentId } });

      await tx.candidateComment.update({
        where: { id: commentId },
        data: {
          body: normalizedBody,
          ...(mentionedUserIds.length > 0
            ? {
                mentions: {
                  create: mentionedUserIds.map((mentionedUserId) => ({
                    mentionedUserId,
                  })),
                },
              }
            : {}),
        },
      });

      for (const mentionedUserId of mentionedUserIds) {
        const mentionedUser = userMap.get(mentionedUserId);

        if (mentionedUser) {
          await dispatchMentionNotification(tx, {
            recipientUserId: mentionedUserId,
            recipientEmail: mentionedUser.email,
            actorName: user.name,
            candidateName: comment.candidate.name,
            jobTitle: comment.candidate.job.title,
            jobId: comment.candidate.jobId,
            candidateId: comment.candidateId,
            commentExcerpt: normalizedBody,
          });

          const notification = await tx.notification.findFirst({
            where: {
              recipientUserId: mentionedUserId,
              relatedCandidateId: comment.candidateId,
              type: "comment_mention",
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });

          if (notification) {
            await writeAuditLog(tx, {
              actorId: user.id,
              action: "notification_created",
              entityType: "notification",
              entityId: notification.id,
              metadata: {
                jobId: comment.candidate.jobId,
                candidateId: comment.candidateId,
                recipientUserId: mentionedUserId,
                type: "comment_mention",
              },
            });
          }
        }
      }

      await writeCandidateHistory(tx, {
        actorId: user.id,
        action: "comment_updated",
        candidateId: comment.candidateId,
        entityType: "comment",
        entityId: commentId,
        metadata: {
          jobId: comment.candidate.jobId,
          candidateId: comment.candidateId,
        },
      });
    });

    revalidatePath(`/jobs/${comment.candidate.jobId}/candidates/${comment.candidateId}`);
    return {};
  } catch (error) {
    console.error("updateCommentAction failed", error);
    return { error: "Could not update the comment. Please try again." };
  }
}

export async function deleteCommentAction(commentId: string): Promise<CommentFormState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  try {
    const comment = await prisma.candidateComment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        authorId: true,
        candidateId: true,
        candidate: { select: { jobId: true } },
      },
    });

    if (!comment) {
      return { error: "This comment no longer exists." };
    }

    if (comment.authorId !== user.id && user.role !== "admin") {
      return { error: "Only the author or an admin can delete this comment." };
    }

    if (!(await userCanAccessJob(user, comment.candidate.jobId))) {
      return { error: "You no longer have access to this job." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.candidateComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() },
      });

      await writeCandidateHistory(tx, {
        actorId: user.id,
        action: "comment_deleted",
        candidateId: comment.candidateId,
        entityType: "comment",
        entityId: commentId,
        metadata: {
          jobId: comment.candidate.jobId,
          candidateId: comment.candidateId,
        },
      });
    });

    revalidatePath(`/jobs/${comment.candidate.jobId}/candidates/${comment.candidateId}`);
    return {};
  } catch (error) {
    console.error("deleteCommentAction failed", error);
    return { error: "Could not delete the comment. Please try again." };
  }
}

function getAttachmentFromForm(formData: FormData) {
  const file = formData.get("file");
  return file instanceof File && file.size > 0 ? file : null;
}

export async function uploadAttachmentAction(
  commentId: string,
  _previousState: AttachmentUploadState,
  formData: FormData,
): Promise<AttachmentUploadState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const file = getAttachmentFromForm(formData);

  if (!file) {
    return { error: "Select a file to upload." };
  }

  const fileError = validateAttachmentFile(file, { required: true });

  if (fileError) {
    return { error: fileError };
  }

  try {
    const comment = await prisma.candidateComment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        authorId: true,
        candidateId: true,
        candidate: { select: { jobId: true } },
      },
    });

    if (!comment) {
      return { error: "This comment no longer exists." };
    }

    if (comment.authorId !== user.id) {
      return { error: "You can only attach files to your own comments." };
    }

    if (!(await userCanAccessJob(user, comment.candidate.jobId))) {
      return { error: "You no longer have access to this job." };
    }

    const saved = await saveAttachmentFile({
      jobId: comment.candidate.jobId,
      commentId: comment.id,
      file,
    });

    await prisma.$transaction(async (tx) => {
      await tx.commentAttachment.create({
        data: {
          commentId: comment.id,
          fileName: saved.fileName,
          filePath: saved.relativePath,
          mimeType: saved.mimeType,
          fileSize: BigInt(saved.size),
          uploadedById: user.id,
        },
      });
    });

    revalidatePath(`/jobs/${comment.candidate.jobId}/candidates/${comment.candidateId}`);
    return {};
  } catch (error) {
    console.error("uploadAttachmentAction failed", error);
    return { error: "Could not upload the file. Please try again." };
  }
}
