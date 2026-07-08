import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in required</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Your session is missing or expired. Sign in to continue.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/login" />}>
          Go to login
        </Button>
      </div>
    </main>
  );
}
