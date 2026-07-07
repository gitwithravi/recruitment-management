"use client";

import * as React from "react";
import Link from "next/link";
import { BriefcaseBusiness, Menu, PanelLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/server/auth/session";

const SIDEBAR_WIDTH = "15rem";

export function AppShell({ children, user }: { children: React.ReactNode; user: CurrentUser }) {
  const [desktopOpen, setDesktopOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setDesktopOpen((value) => !value)}
            aria-label="Toggle sidebar"
            aria-expanded={desktopOpen}
            aria-controls="desktop-sidebar"
          >
            <PanelLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
            </span>
            <span>Recruitment</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside
          id="desktop-sidebar"
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out md:block",
            desktopOpen && "border-r",
          )}
          style={{ width: desktopOpen ? SIDEBAR_WIDTH : "0rem" }}
          aria-hidden={!desktopOpen}
          aria-label="Primary navigation"
        >
          <div
            className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <SidebarNav className="flex-col overflow-visible pb-0" role={user.role} />
            <Separator className="my-4" />
            <div className="space-y-1 px-3">
              <p className="text-xs leading-5 text-muted-foreground">
                Signed in as
                <br />
                <span className="font-medium text-foreground">@{user.username}</span>
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 animate-in fade-in-0 bg-black/50 backdrop-blur-sm duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute top-0 left-0 h-full w-72 animate-in slide-in-from-left-full border-r bg-background shadow-xl duration-200"
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-semibold tracking-tight">Menu</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="p-3">
              <SidebarNav
                className="flex-col overflow-visible pb-0"
                onNavigate={() => setMobileOpen(false)}
                role={user.role}
              />
              <Separator className="my-4" />
              <div className="space-y-1 px-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  Signed in as
                  <br />
                  <span className="font-medium text-foreground">@{user.username}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
