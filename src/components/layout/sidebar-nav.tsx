"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, LayoutDashboard, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/users", label: "Users", icon: UsersRound, adminOnly: true },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function SidebarNav({
  className,
  onNavigate,
  role,
}: {
  className?: string;
  onNavigate?: () => void;
  role: "admin" | "user";
}) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || role === "admin");

  return (
    <nav className={cn("flex gap-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-muted hover:text-foreground",
              active ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground transition-opacity md:block",
                active ? "opacity-100" : "opacity-0",
              )}
              aria-hidden="true"
            />
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
