"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserAction,
  updateUserAction,
  type CreateUserState,
  type UpdateUserState,
} from "@/features/users/actions";
import type { AdminUserListItem } from "@/features/users/queries";
import type { UserFieldErrors } from "@/features/users/validation";

type Mode = "create" | "edit";

type UserFormDialogProps = {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUserListItem;
  trigger?: React.ReactElement;
};

const initialCreateState: CreateUserState = { errors: {} };
const initialUpdateState: UpdateUserState = { errors: {} };

export function UserFormDialog({ mode, open, onOpenChange, user, trigger }: UserFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(user);
  const formRef = React.useRef<HTMLFormElement>(null);

  const boundUpdateAction = React.useMemo(
    () => (user ? updateUserAction.bind(null, user.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const [createState, createFormAction, createPending] = useActionState(
    createUserAction,
    initialCreateState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    boundUpdateAction ?? noopAction,
    initialUpdateState,
  );

  const state = isEdit ? updateState : createState;
  const pending = isEdit ? updatePending : createPending;
  const formAction = isEdit ? updateFormAction : createFormAction;
  const fieldErrors = state.errors as UserFieldErrors;

  React.useEffect(() => {
    const isSuccess = open && !pending && Object.keys(state.errors).length === 0 && !state.generic;
    if (isSuccess && formRef.current) {
      onOpenChange(false);
    }
  }, [state.errors, state.generic, pending, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <span>Edit user</span>
            ) : (
              <>
                <UserPlus className="size-4" aria-hidden="true" />
                <span>Add user</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update name, email, and role. Username cannot be changed after creation."
              : "Create an internal account with an initial password."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Jane Doe"
              defaultValue={user?.name ?? ""}
              required
              aria-invalid={Boolean(fieldErrors.name) || undefined}
              maxLength={80}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="jane_doe"
              defaultValue={user?.username ?? ""}
              required
              disabled={isEdit}
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(fieldErrors.username) || undefined}
            />
            {fieldErrors.username ? (
              <p className="text-xs text-destructive">{fieldErrors.username}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores. 3-32 characters.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@company.com"
              defaultValue={user?.email ?? ""}
              required
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
            />
            {fieldErrors.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={user?.role ?? "user"}>
              <SelectTrigger
                id="role"
                className="h-9 w-full"
                aria-invalid={Boolean(fieldErrors.role) || undefined}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.role ? (
              <p className="text-xs text-destructive">{fieldErrors.role}</p>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="password">Initial password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password) || undefined}
              />
              {fieldErrors.password ? (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Must include letters and numbers.</p>
              )}
            </div>
          ) : null}

          {state.generic ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.generic}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create user"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function noopAction(_previous: UpdateUserState): Promise<UpdateUserState> {
  return _previous;
}
