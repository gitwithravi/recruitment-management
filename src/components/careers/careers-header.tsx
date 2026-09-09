import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/app-config";

export function CareersHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
        >
          <BriefcaseBusiness className="size-5" aria-hidden="true" />
          <span>{APP_NAME}</span>
          <span className="text-sm font-medium text-muted-foreground">Careers</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
