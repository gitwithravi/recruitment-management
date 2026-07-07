"use client";

import * as React from "react";
import { useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

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

type ToggleActiveDialogProps = {
  username: string;
  currentlyActive: boolean;
  isSelfTarget: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function ToggleActiveDialog({
  username,
  currentlyActive,
  isSelfTarget,
  open,
  onOpenChange,
  onConfirm,
}: ToggleActiveDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | undefined>(undefined);

  const deactivate = currentlyActive;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(undefined);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        await onConfirm();
      } catch {
        setError("Could not update this user. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={deactivate ? "size-4 text-destructive" : "size-4 text-primary"}
              aria-hidden="true"
            />
            {deactivate ? "Deactivate user" : "Activate user"}
          </DialogTitle>
          <DialogDescription>
            {deactivate ? (
              <>
                <span className="font-medium text-foreground">@{username}</span> will be signed out
                immediately and unable to sign in until reactivated.
              </>
            ) : (
              <>
                Reactivate <span className="font-medium text-foreground">@{username}</span> so they
                can sign in again.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isSelfTarget && deactivate ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            You cannot deactivate your own account.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
          <Button
            variant={deactivate ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending || (isSelfTarget && deactivate)}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {deactivate ? "Deactivating…" : "Activating…"}
              </>
            ) : deactivate ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useToggleActiveDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    userId?: string;
    username?: string;
    currentlyActive?: boolean;
    isSelfTarget?: boolean;
  }>({ open: false });

  const open = React.useCallback(
    (input: {
      userId: string;
      username: string;
      currentlyActive: boolean;
      isSelfTarget: boolean;
    }) => {
      setState({ open: true, ...input });
    },
    [],
  );

  const close = React.useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  return { state, open, close };
}
