"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Power, RotateCcw } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleUserActiveAction } from "@/features/users/actions";
import type { AdminUserListItem } from "@/features/users/queries";
import { cn } from "@/lib/utils";

import { ResetPasswordDialog } from "@/components/admin/users/reset-password-dialog";
import {
  ToggleActiveDialog,
  useToggleActiveDialog,
} from "@/components/admin/users/toggle-active-dialog";
import { UserFormDialog } from "@/components/admin/users/user-form-dialog";

type UsersTableProps = {
  users: AdminUserListItem[];
  currentUserId: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [editTarget, setEditTarget] = React.useState<AdminUserListItem | null>(null);
  const [resetTarget, setResetTarget] = React.useState<AdminUserListItem | null>(null);
  const toggle = useToggleActiveDialog();

  const handleToggleConfirm = React.useCallback(
    async (userId: string) => {
      const result = await toggleUserActiveAction(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      toggle.close();
    },
    [toggle],
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelfUser = user.id === currentUserId;
            const isInactive = !user.isActive;

            return (
              <TableRow key={user.id} className={cn(isInactive && "opacity-60")}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-muted text-[0.65rem] font-medium">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Added {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">@{user.username}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge
                      variant="outline"
                      className="gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full bg-muted-foreground"
                        aria-hidden="true"
                      />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${user.name}`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{isSelfUser ? "You" : user.name}</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditTarget(user)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetTarget(user)}>
                          <RotateCcw className="size-4" aria-hidden="true" />
                          Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            toggle.open({
                              userId: user.id,
                              username: user.username,
                              currentlyActive: user.isActive,
                              isSelfTarget: isSelfUser,
                            })
                          }
                          disabled={isSelfUser && user.isActive}
                          variant={user.isActive ? "destructive" : "default"}
                        >
                          <Power className="size-4" aria-hidden="true" />
                          {user.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editTarget ? (
        <UserFormDialog
          mode="edit"
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          user={editTarget}
        />
      ) : null}

      {resetTarget ? (
        <ResetPasswordDialog
          userId={resetTarget.id}
          username={resetTarget.username}
          open={Boolean(resetTarget)}
          onOpenChange={(open) => {
            if (!open) setResetTarget(null);
          }}
        />
      ) : null}

      <ToggleActiveDialog
        username={toggle.state.username ?? ""}
        currentlyActive={toggle.state.currentlyActive ?? false}
        isSelfTarget={toggle.state.isSelfTarget ?? false}
        open={toggle.state.open}
        onOpenChange={(open) => {
          if (!open) toggle.close();
        }}
        onConfirm={() => handleToggleConfirm(toggle.state.userId ?? "")}
      />
    </>
  );
}
