"use client";

import * as React from "react";
import { useActionState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetUserPasswordAction, type ResetPasswordState } from "@/features/users/actions";

type ResetPasswordDialogProps = {
  userId: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: ResetPasswordState = {};

export function ResetPasswordDialog({
  userId,
  username,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const boundAction = React.useMemo(() => resetUserPasswordAction.bind(null, userId), [userId]);

  const [state, formAction, pending] = useActionState(boundAction, initialState);

  React.useEffect(() => {
    if (open && !pending && !state.error && formRef.current) {
      onOpenChange(false);
    }
  }, [state.error, pending, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" aria-hidden="true" />
            Reset password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium text-foreground">@{username}</span>.
            The user will need to sign in with this password.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                className="h-9 pr-9"
                aria-invalid={Boolean(state.error) || undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Must include letters and numbers.</p>
          </div>

          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Resetting…
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
