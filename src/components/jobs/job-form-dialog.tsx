"use client";

import * as React from "react";
import { useActionState } from "react";
import { BriefcaseBusiness, Loader2 } from "lucide-react";

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
  createJobAction,
  updateJobAction,
  type CreateJobState,
  type UpdateJobState,
} from "@/features/jobs/actions";
import type { JobListItem } from "@/features/jobs/queries";

type JobFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Pick<JobListItem, "id" | "title" | "description" | "status">;
  trigger?: React.ReactElement;
};

const initialCreateState: CreateJobState = { errors: {} };
const initialUpdateState: UpdateJobState = { errors: {} };

export function JobFormDialog({ mode, open, onOpenChange, job, trigger }: JobFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(job);
  const formRef = React.useRef<HTMLFormElement>(null);

  const boundUpdateAction = React.useMemo(
    () => (job ? updateJobAction.bind(null, job.id) : null),
    [job],
  );

  const [createState, createFormAction, createPending] = useActionState(
    createJobAction,
    initialCreateState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    boundUpdateAction ?? noopAction,
    initialUpdateState,
  );

  const state = isEdit ? updateState : createState;
  const pending = isEdit ? updatePending : createPending;
  const formAction = isEdit ? updateFormAction : createFormAction;

  React.useEffect(() => {
    const isSuccess =
      open && isEdit && !pending && Object.keys(state.errors).length === 0 && !state.generic;
    if (isSuccess && formRef.current) {
      onOpenChange(false);
    }
  }, [isEdit, onOpenChange, open, pending, state.errors, state.generic]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
            <span>{isEdit ? "Edit job" : "Create job"}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the posting details or change the job status."
              : "Add a job posting. The default Kanban stages will be created automatically."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-title" : "create-title"}>Job title</Label>
            <Input
              id={isEdit ? "edit-title" : "create-title"}
              name="title"
              placeholder="Senior Software Engineer"
              defaultValue={job?.title ?? ""}
              required
              maxLength={120}
              aria-invalid={Boolean(state.errors.title) || undefined}
            />
            {state.errors.title ? (
              <p className="text-xs text-destructive">{state.errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-description" : "create-description"}>
              Job description / JD
            </Label>
            <textarea
              id={isEdit ? "edit-description" : "create-description"}
              name="description"
              placeholder="Describe the role, responsibilities, skills, and hiring expectations."
              defaultValue={job?.description ?? ""}
              required
              rows={8}
              maxLength={10000}
              aria-invalid={Boolean(state.errors.description) || undefined}
              className="flex min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
            />
            {state.errors.description ? (
              <p className="text-xs text-destructive">{state.errors.description}</p>
            ) : null}
          </div>

          {isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="job-status">Status</Label>
              <Select name="status" defaultValue={job?.status ?? "open"}>
                <SelectTrigger
                  id="job-status"
                  className="h-9 w-full"
                  aria-invalid={Boolean(state.errors.status) || undefined}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {state.errors.status ? (
                <p className="text-xs text-destructive">{state.errors.status}</p>
              ) : null}
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
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create job"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function noopAction(_previous: UpdateJobState): Promise<UpdateJobState> {
  return _previous;
}
