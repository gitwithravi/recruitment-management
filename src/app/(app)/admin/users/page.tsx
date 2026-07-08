import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { AddUserButton } from "@/components/admin/users/add-user-button";
import { UsersTable } from "@/components/admin/users/users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAppTitle } from "@/lib/app-config";
import { requireAdmin } from "@/server/auth/session";
import { listUsersForAdmin } from "@/features/users/queries";

export const metadata: Metadata = {
  title: formatAppTitle("Users"),
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await listUsersForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage internal accounts. Deactivated users lose access immediately.
          </p>
        </div>
        <AddUserButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal users</CardTitle>
          <CardDescription>
            {users.length} total · {users.filter((u) => u.isActive).length} active
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ShieldAlert className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No users yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first internal user to get started.
              </p>
            </div>
          ) : (
            <UsersTable users={users} currentUserId={admin.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
