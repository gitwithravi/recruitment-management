import type { Metadata } from "next";

import { NotificationsPage } from "@/components/notifications/notifications-page";
import { listNotifications } from "@/features/notifications/queries";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Notifications · Recruitment",
};

export default async function NotificationsRoute() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);

  return <NotificationsPage initialNotifications={notifications} />;
}
