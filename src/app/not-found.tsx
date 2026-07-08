import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <SearchX className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The page or record you requested does not exist, or it may have been removed.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          Go to dashboard
        </Button>
      </div>
    </main>
  );
}
