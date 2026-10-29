import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getBranding } from "@/features/settings/queries";

export async function CareersHeader() {
  const { appName, logoUrl } = await getBranding();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
        >
          <AppLogo
            logoUrl={logoUrl}
            className="size-7 rounded-md"
            fallback={<BriefcaseBusiness className="size-5" aria-hidden="true" />}
          />
          <span>{appName}</span>
          <span className="text-sm font-medium text-muted-foreground">Careers</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
