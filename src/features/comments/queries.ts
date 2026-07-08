import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type CommentAuthor = {
  id: string;
  name: string;
  username: string;
};

export type CommentAttachment = {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: string;
};

export type MentionedUser = {
  id: string;
  username: string;
};

export type CommentItem = {
  id: string;
  body: string;
  visibility: "job" | "admin";
  author: CommentAuthor;
  attachments: CommentAttachment[];
  mentions: MentionedUser[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type MentionableUser = {
  id: string;
  name: string;
  username: string;
};

export async function listCommentsForCandidate(
  user: CurrentUser,
  candidateId: string,
): Promise<CommentItem[]> {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId },
    select: { id: true, jobId: true },
  });

  if (!candidate) {
    return [];
  }

  const comments = await prisma.candidateComment.findMany({
    where: {
      candidateId,
      ...(user.role !== "admin"
        ? { visibility: "job", deletedAt: null }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          filePath: true,
          mimeType: true,
          fileSize: true,
        },
      },
      mentions: {
        select: {
          id: true,
          mentionedUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    visibility: c.visibility,
    author: c.author,
    attachments: c.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      mimeType: a.mimeType,
      fileSize: a.fileSize.toString(),
    })),
    mentions: c.mentions.map((m) => ({
      id: m.mentionedUser.id,
      username: m.mentionedUser.username,
    })),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    deletedAt: c.deletedAt,
  }));
}

export async function listMentionableUsersForJob(
  jobId: string,
): Promise<MentionableUser[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      jobMemberships: { some: { jobId } },
    },
    orderBy: { username: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  return users;
}
