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
  createCandidateAction,
  updateCandidateAction,
  type CandidateFormState,
} from "@/features/candidates/actions";
import type { CandidateDetail } from "@/features/candidates/queries";
import type { CandidateFieldErrors } from "@/features/candidates/validation";

type CandidateFormDialogProps = {
  mode: "create" | "edit";
  jobId: string;
  candidate?: CandidateDetail;
  canEditFeedback?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

const initialState: CandidateFormState = { errors: {} };

export function CandidateFormDialog({
  mode,
  jobId,
  candidate,
  canEditFeedback = false,
  open,
  onOpenChange,
  trigger,
}: CandidateFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(candidate);
  const formRef = React.useRef<HTMLFormElement>(null);
  const boundCreateAction = React.useMemo(() => createCandidateAction.bind(null, jobId), [jobId]);
  const boundUpdateAction = React.useMemo(
    () => (candidate ? updateCandidateAction.bind(null, jobId, candidate.id) : null),
    [candidate, jobId],
  );
  const [createState, createFormAction, createPending] = useActionState(
    boundCreateAction,
    initialState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    boundUpdateAction ?? noopAction,
    initialState,
  );

  const state = isEdit ? updateState : createState;
  const pending = isEdit ? updatePending : createPending;
  const formAction = isEdit ? updateFormAction : createFormAction;
  const fieldErrors = state.errors as CandidateFieldErrors;

  React.useEffect(() => {
    const success =
      open && isEdit && !pending && Object.keys(state.errors).length === 0 && !state.generic;
    if (success) {
      onOpenChange(false);
    }
  }, [isEdit, onOpenChange, open, pending, state.errors, state.generic]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" aria-hidden="true" />
            {isEdit ? "Edit candidate" : "Add candidate"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update candidate details. Resume replacement is handled separately."
              : "Create a candidate and upload their resume. The candidate starts in the first stage."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" id="candidate-name" error={fieldErrors.name}>
              <Input name="name" defaultValue={candidate?.name ?? ""} required maxLength={120} />
            </Field>
            <Field label="Email" id="candidate-email" error={fieldErrors.email}>
              <Input
                name="email"
                type="email"
                defaultValue={candidate?.email ?? ""}
                required
                autoCapitalize="none"
              />
            </Field>
            <Field label="Phone" id="candidate-phone" error={fieldErrors.phone}>
              <Input name="phone" defaultValue={candidate?.phone ?? ""} required />
            </Field>
            <Field label="Current city" id="candidate-current-city" error={fieldErrors.currentCity}>
              <Input
                name="currentCity"
                defaultValue={candidate?.currentCity ?? ""}
                required
                maxLength={80}
              />
            </Field>
            <Field
              label="Total experience"
              id="candidate-total-experience"
              error={fieldErrors.totalExperience}
            >
              <Input
                name="totalExperience"
                inputMode="decimal"
                defaultValue={candidate?.totalExperience ?? ""}
                required
              />
            </Field>
            <Field
              label="Relevant experience"
              id="candidate-relevant-experience"
              error={fieldErrors.relevantExperience}
            >
              <Input
                name="relevantExperience"
                inputMode="decimal"
                defaultValue={candidate?.relevantExperience ?? ""}
                required
              />
            </Field>
            <Field label="Current CTC" id="candidate-current-ctc" error={fieldErrors.currentCtc}>
              <Input
                name="currentCtc"
                inputMode="decimal"
                defaultValue={candidate?.currentCtc ?? ""}
              />
            </Field>
            <Field label="Expected CTC" id="candidate-expected-ctc" error={fieldErrors.expectedCtc}>
              <Input
                name="expectedCtc"
                inputMode="decimal"
                defaultValue={candidate?.expectedCtc ?? ""}
              />
            </Field>
            <Field
              label="Notice period"
              id="candidate-notice-period"
              error={fieldErrors.noticePeriod}
            >
              <Input
                name="noticePeriod"
                defaultValue={candidate?.noticePeriod ?? ""}
                required
                maxLength={80}
              />
            </Field>
            <Field label="Source" id="candidate-source" error={fieldErrors.source}>
              <Input name="source" defaultValue={candidate?.source ?? ""} required maxLength={80} />
            </Field>
          </div>

          {!isEdit ? (
            <Field label="Resume" id="candidate-resume" error={fieldErrors.resume}>
              <Input name="resume" type="file" required accept=".pdf,.doc,.docx" />
            </Field>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="candidate-feedback">Feedback</Label>
            <textarea
              id="candidate-feedback"
              name="feedback"
              defaultValue={candidate?.feedback ?? ""}
              rows={5}
              maxLength={5000}
              disabled={isEdit && !canEditFeedback}
              aria-invalid={Boolean(fieldErrors.feedback) || undefined}
              className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
            />
            {fieldErrors.feedback ? (
              <p className="text-xs text-destructive">{fieldErrors.feedback}</p>
            ) : isEdit && !canEditFeedback ? (
              <p className="text-xs text-muted-foreground">
                Feedback can be edited by admins or the assigned user.
              </p>
            ) : null}
          </div>

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
                "Create candidate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": Boolean(error) || undefined,
      })}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

async function noopAction(_previous: CandidateFormState): Promise<CandidateFormState> {
  return _previous;
}
