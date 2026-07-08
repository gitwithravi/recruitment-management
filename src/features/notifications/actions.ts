"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import { requireUser } from "@/server/auth/session";

export type NotificationActionState = {
  error?: string;
};

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionState> {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientUserId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/notifications");
    return {};
  } catch {
    return { error: "Could not mark the notification as read." };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: {
        recipientUserId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/notifications");
    return {};
  } catch {
    return { error: "Could not mark all notifications as read." };
  }
}
