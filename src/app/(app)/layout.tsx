import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications, listNotifications } from "@/features/notifications/queries";
import { getBranding } from "@/features/settings/queries";
import { requireUser } from "@/server/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [notifications, unreadCount, branding] = await Promise.all([
    listNotifications(user.id, 15),
    countUnreadNotifications(user.id),
    getBranding(),
  ]);

  return (
    <AppShell
      appName={branding.appName}
      logoUrl={branding.logoUrl}
      user={user}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
