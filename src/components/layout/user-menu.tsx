"use client";

import * as React from "react";
import { LogOut, UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/auth/actions";
import type { CurrentUser } from "@/server/auth/session";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const [pending, startTransition] = React.useTransition();

  const handleLogout = React.useCallback(() => {
    startTransition(async () => {
      await logoutAction();
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="h-9 gap-2 px-1.5">
            <Avatar size="sm">
              <AvatarFallback className="bg-transparent text-xs font-medium">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 pt-2">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">@{user.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-1.5 py-1 text-xs text-muted-foreground">
          <UserCircle2 className="size-4" aria-hidden="true" />
          <span className="capitalize">{user.role}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={pending}>
          <LogOut className="size-4" aria-hidden="true" />
          {pending ? "Logging out…" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
