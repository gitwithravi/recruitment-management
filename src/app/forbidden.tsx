import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            You do not have permission to view this page or perform this action.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          Go to dashboard
        </Button>
      </div>
    </main>
  );
}
