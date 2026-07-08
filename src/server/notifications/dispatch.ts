import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { sendEmail } from "@/server/notifications/email";

type Tx = PrismaClient | Prisma.TransactionClient;

type DispatchAssignmentInput = {
  recipientUserId: string;
  recipientEmail: string;
  actorName: string;
  candidateName: string;
  jobTitle: string;
  comment?: string;
};

type DispatchMentionInput = {
  recipientUserId: string;
  recipientEmail: string;
  actorName: string;
  candidateName: string;
  jobTitle: string;
  commentExcerpt: string;
};

async function createInAppNotification(
  tx: Tx,
  input: {
    recipientUserId: string;
    type: "resume_assignment" | "comment_mention";
    title: string;
    body: string;
    jobId: string;
    candidateId: string;
  },
) {
  return tx.notification.create({
    data: {
      recipientUserId: input.recipientUserId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedJobId: input.jobId,
      relatedCandidateId: input.candidateId,
    },
    select: { id: true },
  });
}

async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    return await sendEmail(input);
  } catch {
    return false;
  }
}

export async function dispatchAssignmentNotification(
  tx: Tx,
  input: DispatchAssignmentInput & { jobId: string; candidateId: string },
) {
  const inAppBody = `${input.actorName} assigned ${input.candidateName} to you for ${input.jobTitle}.${
    input.comment ? ` Comment: ${input.comment}` : ""
  }`;

  await createInAppNotification(tx, {
    recipientUserId: input.recipientUserId,
    type: "resume_assignment",
    title: "Resume assigned to you",
    body: inAppBody,
    jobId: input.jobId,
    candidateId: input.candidateId,
  });

  const emailBody = [
    `Hi,`,
    ``,
    `${input.actorName} assigned ${input.candidateName} to you for "${input.jobTitle}".`,
    input.comment ? `` : null,
    input.comment ? `Comment from ${input.actorName}:` : null,
    input.comment ? input.comment : null,
    ``,
    `You can view this candidate in the recruitment management system.`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendNotificationEmail({
    to: input.recipientEmail,
    subject: `[Recruitment] ${input.actorName} assigned ${input.candidateName} to you`,
    body: emailBody,
  });
}

export async function dispatchMentionNotification(
  tx: Tx,
  input: DispatchMentionInput & { jobId: string; candidateId: string },
) {
  const excerpt =
    input.commentExcerpt.length > 200
      ? `${input.commentExcerpt.slice(0, 200)}...`
      : input.commentExcerpt;

  const inAppBody = `${input.actorName} mentioned you in a comment on ${input.candidateName} (${input.jobTitle}): "${excerpt}"`;

  await createInAppNotification(tx, {
    recipientUserId: input.recipientUserId,
    type: "comment_mention",
    title: "You were mentioned in a comment",
    body: inAppBody,
    jobId: input.jobId,
    candidateId: input.candidateId,
  });

  const emailBody = [
    `Hi,`,
    ``,
    `${input.actorName} mentioned you in a comment on ${input.candidateName} (${input.jobTitle}).`,
    ``,
    `"${excerpt}"`,
    ``,
    `You can view this candidate in the recruitment management system.`,
  ].join("\n");

  await sendNotificationEmail({
    to: input.recipientEmail,
    subject: `[Recruitment] ${input.actorName} mentioned you in a comment`,
    body: emailBody,
  });
}
