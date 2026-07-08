import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications, listNotifications } from "@/features/notifications/queries";
import { APP_NAME } from "@/lib/app-config";
import { requireUser } from "@/server/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(user.id, 15),
    countUnreadNotifications(user.id),
  ]);

  return (
    <AppShell
      appName={APP_NAME}
      user={user}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
