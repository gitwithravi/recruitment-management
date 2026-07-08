"use client";

import * as React from "react";
import { Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignCandidateAction } from "@/features/candidates/actions";

type AssignableUser = {
  id: string;
  name: string;
  username: string;
  email: string;
};

type CurrentAssignee = {
  id: string;
  name: string;
  username: string;
} | null;

type CandidateAssignmentPanelProps = {
  jobId: string;
  candidateId: string;
  currentAssignee: CurrentAssignee;
  assignableUsers: AssignableUser[];
};

const UNASSIGNED = "__unassigned__";

export function CandidateAssignmentPanel({
  jobId,
  candidateId,
  currentAssignee,
  assignableUsers,
}: CandidateAssignmentPanelProps) {
  const [selectedAssigneeId, setSelectedAssigneeId] = React.useState(
    currentAssignee?.id ?? UNASSIGNED,
  );
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const newAssigneeId = selectedAssigneeId === UNASSIGNED ? null : selectedAssigneeId;

    startTransition(async () => {
      const result = await assignCandidateAction(jobId, candidateId, newAssigneeId, comment);
      if (result.error) {
        setError(result.error);
        return;
      }

      setComment("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="candidate-assignee">Assign to</Label>
        <select
          id="candidate-assignee"
          value={selectedAssigneeId}
          disabled={isPending}
          onChange={(event) => setSelectedAssigneeId(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value={UNASSIGNED}>Unassigned</option>
          {assignableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} (@{user.username})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-comment">Comment</Label>
        <textarea
          id="assignment-comment"
          value={comment}
          disabled={isPending}
          rows={3}
          maxLength={5000}
          placeholder="Optional assignment note"
          onChange={(event) => setComment(event.target.value)}
          className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Updating...
          </>
        ) : (
          <>
            <UserCheck className="size-4" aria-hidden="true" />
            Update assignment
          </>
        )}
      </Button>
    </form>
  );
}
