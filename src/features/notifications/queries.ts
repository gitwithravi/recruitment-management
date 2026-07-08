import "server-only";

import { prisma } from "@/db/client";

export type NotificationItem = {
  id: string;
  type: "resume_assignment" | "comment_mention";
  title: string;
  body: string;
  relatedJobId: string | null;
  relatedCandidateId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationItem[]> {
  return prisma.notification.findMany({
    where: { recipientUserId: userId },
    orderBy: [{ readAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      relatedJobId: true,
      relatedCandidateId: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { recipientUserId: userId, readAt: null },
  });
}
