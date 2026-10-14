"use client";

import * as React from "react";
import { useActionState } from "react";
import { BriefcaseBusiness, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { JobDescriptionEditor } from "@/components/jobs/job-description-editor";
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
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  UNSPECIFIED_OPTION,
  WORK_MODE_LABELS,
  WORK_MODES,
  toDateInputValue,
  type JobPostingFields,
} from "@/features/jobs/posting";
import type { JobListItem } from "@/features/jobs/queries";

type JobFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Pick<JobListItem, "id" | "title" | "description" | "status"> & JobPostingFields;
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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

        <form ref={formRef} onSubmit={submitWithoutReset(formAction)} className="space-y-4">
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
            <JobDescriptionEditor
              id={isEdit ? "edit-description" : "create-description"}
              name="description"
              placeholder="Describe the role, responsibilities, skills, and hiring expectations."
              defaultValue={job?.description ?? ""}
              required
              ariaInvalid={Boolean(state.errors.description)}
            />
            {state.errors.description ? (
              <p className="text-xs text-destructive">{state.errors.description}</p>
            ) : null}
          </div>

          <JobPostingFieldsSection
            idPrefix={isEdit ? "edit" : "create"}
            job={job}
            errors={state.errors}
          />

          {isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="job-status">Status</Label>
              <Select
                name="status"
                defaultValue={job?.status ?? "open"}
                items={{ open: "Open", closed: "Closed" }}
              >
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

// Submitting through onSubmit (not the form `action` prop) keeps typed values on validation errors;
// React resets uncontrolled fields after a form action completes.
function submitWithoutReset(dispatch: (formData: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    React.startTransition(() => dispatch(formData));
  };
}

async function noopAction(_previous: UpdateJobState): Promise<UpdateJobState> {
  return _previous;
}

type PostingErrors = Partial<Record<keyof JobPostingFields, string>>;

function JobPostingFieldsSection({
  idPrefix,
  job,
  errors,
}: {
  idPrefix: string;
  job?: JobPostingFields;
  errors: PostingErrors;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Posting details (shown on the careers page)</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <PostingField label="Location" htmlFor={id("location")} error={errors.location}>
          <Input
            id={id("location")}
            name="location"
            placeholder="Bengaluru"
            maxLength={120}
            defaultValue={job?.location ?? ""}
            aria-invalid={Boolean(errors.location) || undefined}
          />
        </PostingField>
        <PostingField label="Department" htmlFor={id("department")} error={errors.department}>
          <Input
            id={id("department")}
            name="department"
            placeholder="Engineering"
            maxLength={80}
            defaultValue={job?.department ?? ""}
            aria-invalid={Boolean(errors.department) || undefined}
          />
        </PostingField>
        <PostingField label="Work mode" htmlFor={id("work-mode")} error={errors.workMode}>
          <Select
            name="workMode"
            defaultValue={job?.workMode ?? UNSPECIFIED_OPTION}
            items={{ [UNSPECIFIED_OPTION]: "Not specified", ...WORK_MODE_LABELS }}
          >
            <SelectTrigger id={id("work-mode")} className="h-9 w-full">
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSPECIFIED_OPTION}>Not specified</SelectItem>
              {WORK_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PostingField>
        <PostingField
          label="Employment type"
          htmlFor={id("employment-type")}
          error={errors.employmentType}
        >
          <Select
            name="employmentType"
            defaultValue={job?.employmentType ?? UNSPECIFIED_OPTION}
            items={{ [UNSPECIFIED_OPTION]: "Not specified", ...EMPLOYMENT_TYPE_LABELS }}
          >
            <SelectTrigger id={id("employment-type")} className="h-9 w-full">
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSPECIFIED_OPTION}>Not specified</SelectItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PostingField>
        <PostingField
          label="Min experience (years)"
          htmlFor={id("min-experience")}
          error={errors.minExperience}
        >
          <Input
            id={id("min-experience")}
            name="minExperience"
            type="number"
            min={0}
            max={50}
            defaultValue={job?.minExperience ?? ""}
            aria-invalid={Boolean(errors.minExperience) || undefined}
          />
        </PostingField>
        <PostingField
          label="Max experience (years)"
          htmlFor={id("max-experience")}
          error={errors.maxExperience}
        >
          <Input
            id={id("max-experience")}
            name="maxExperience"
            type="number"
            min={0}
            max={50}
            defaultValue={job?.maxExperience ?? ""}
            aria-invalid={Boolean(errors.maxExperience) || undefined}
          />
        </PostingField>
        <PostingField label="Openings" htmlFor={id("openings")} error={errors.openings}>
          <Input
            id={id("openings")}
            name="openings"
            type="number"
            min={1}
            max={999}
            defaultValue={job?.openings ?? ""}
            aria-invalid={Boolean(errors.openings) || undefined}
          />
        </PostingField>
        <PostingField label="Apply by" htmlFor={id("apply-by")} error={errors.applyBy}>
          <Input
            id={id("apply-by")}
            name="applyBy"
            type="date"
            defaultValue={toDateInputValue(job?.applyBy ?? null)}
            aria-invalid={Boolean(errors.applyBy) || undefined}
          />
        </PostingField>
      </div>
      <p className="text-xs text-muted-foreground">
        All fields are optional. After the apply-by date the job stops accepting applications and
        drops off the careers page.
      </p>
    </fieldset>
  );
}

function PostingField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
