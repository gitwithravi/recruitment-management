import Link from "next/link";
import { BriefcaseBusiness, LayoutDashboard, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/users", label: "Users", icon: UsersRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
            <span>Recruitment</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Phase 0</Badge>
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 md:grid-cols-[14rem_1fr]">
        <aside className="border-b px-4 py-3 md:border-r md:border-b-0 md:px-3 md:py-5">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Separator className="my-4 hidden md:block" />
          <p className="hidden px-2 text-xs leading-5 text-muted-foreground md:block">
            Internal recruitment workflow bootstrap.
          </p>
        </aside>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
