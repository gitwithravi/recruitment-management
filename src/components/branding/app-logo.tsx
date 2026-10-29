import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shows the uploaded logo at 220px wide (height follows the image's aspect ratio) when one is set,
 * otherwise the given fallback (usually an icon badge plus the app name).
 * A plain <img> is used because the logo is served by our own route with a version query.
 */
export function AppLogo({
  logoUrl,
  alt,
  className,
  fallback,
}: {
  logoUrl: string | null;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  if (!logoUrl) return fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={alt}
      className={cn("block h-auto w-[220px] max-w-full shrink-0", className)}
    />
  );
}
