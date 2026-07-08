"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Plus, UserMinus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  attachJobUserAction,
  detachJobUserAction,
  type AttachJobUserState,
} from "@/features/jobs/actions";
import type { AssignableJobUser, JobDetail } from "@/features/jobs/queries";

type JobUsersPanelProps = {
  jobId: string;
  attachedUsers: JobDetail["attachedUsers"];
  assignableUsers: AssignableJobUser[];
  canManageJobs: boolean;
};

const initialAttachState: AttachJobUserState = {};

export function JobUsersPanel({
  jobId,
  attachedUsers,
  assignableUsers,
  canManageJobs,
}: JobUsersPanelProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const boundAttachAction = React.useMemo(() => attachJobUserAction.bind(null, jobId), [jobId]);
  const [attachState, attachFormAction, attachPending] = useActionState(
    boundAttachAction,
    initialAttachState,
  );
  const [detachPendingId, setDetachPendingId] = React.useState<string | null>(null);
  const [detachError, setDetachError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!attachPending && !attachState.error) {
      formRef.current?.reset();
    }
  }, [attachPending, attachState.error]);

  const handleDetach = React.useCallback(
    async (userId: string) => {
      setDetachError(null);
      setDetachPendingId(userId);

      try {
        const result = await detachJobUserAction(jobId, userId);
        if (result.error) {
          setDetachError(result.error);
        }
      } finally {
        setDetachPendingId(null);
      }
    },
    [jobId],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Attached users</CardTitle>
            <CardDescription>
              {canManageJobs
                ? "Attach active users to grant job access. Detaching removes access immediately."
                : "These are the users currently attached to this job."}
            </CardDescription>
          </div>
          <Badge variant="secondary">{attachedUsers.length} attached</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManageJobs ? (
          <form ref={formRef} action={attachFormAction} className="rounded-lg border p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="attach-user">Attach user</Label>
                <Select name="userId" disabled={assignableUsers.length === 0 || attachPending}>
                  <SelectTrigger id="attach-user" className="h-9 w-full">
                    <SelectValue
                      placeholder={
                        assignableUsers.length === 0
                          ? "All active users are attached"
                          : "Select an active user"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span>{user.name}</span>
                        <span className="text-muted-foreground">@{user.username}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={assignableUsers.length === 0 || attachPending}>
                {attachPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Attaching...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden="true" />
                    Attach
                  </>
                )}
              </Button>
            </div>
            {attachState.error ? (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {attachState.error}
              </p>
            ) : null}
          </form>
        ) : null}

        {detachError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {detachError}
          </p>
        ) : null}

        {attachedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UsersRound className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">No users are attached yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Attach users here so they can see this job and work on its candidates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachedUsers.map((attachedUser, index) => (
              <div key={attachedUser.id}>
                {index > 0 ? <Separator className="mb-3" /> : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{attachedUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{attachedUser.username} · {attachedUser.email}
                    </p>
                  </div>
                  {canManageJobs ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={detachPendingId === attachedUser.id}
                      onClick={() => {
                        void handleDetach(attachedUser.id);
                      }}
                    >
                      {detachPendingId === attachedUser.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Detaching...
                        </>
                      ) : (
                        <>
                          <UserMinus className="size-4" aria-hidden="true" />
                          Detach
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
