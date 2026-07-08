import type { Metadata } from "next";

import { NotificationsPage } from "@/components/notifications/notifications-page";
import { listNotifications } from "@/features/notifications/queries";
import { formatAppTitle } from "@/lib/app-config";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: formatAppTitle("Notifications"),
};

export default async function NotificationsRoute() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);

  return <NotificationsPage initialNotifications={notifications} />;
}
