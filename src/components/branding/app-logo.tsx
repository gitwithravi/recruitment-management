import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shows the uploaded logo when one is set, otherwise the given fallback (usually an icon badge).
 * A plain <img> is used because the logo is served by our own route with a version query.
 */
export function AppLogo({
  logoUrl,
  className,
  fallback,
}: {
  logoUrl: string | null;
  className?: string;
  fallback: React.ReactNode;
}) {
  if (!logoUrl) return fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="" className={cn("shrink-0 object-contain", className)} />
  );
}
