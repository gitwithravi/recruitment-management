"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ListChecks, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  createJobQuestionAction,
  deleteJobQuestionAction,
  moveJobQuestionAction,
  updateJobQuestionAction,
  type QuestionFormState,
} from "@/features/questions/actions";
import {
  MAX_QUESTIONS_PER_JOB,
  QUESTION_LABEL_MAX,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type ApplicationQuestion,
  type QuestionType,
} from "@/features/questions/rules";

type JobQuestionsPanelProps = {
  jobId: string;
  questions: ApplicationQuestion[];
  canManageJobs: boolean;
};

const emptyState: QuestionFormState = { errors: {} };

const fieldClassName =
  "w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

export function JobQuestionsPanel({ jobId, questions, canManageJobs }: JobQuestionsPanelProps) {
  const [editing, setEditing] = React.useState<ApplicationQuestion | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<ApplicationQuestion | null>(null);
  const [mutationError, setMutationError] = React.useState<string | null>(null);
  const [isMutating, startMutation] = React.useTransition();

  const handleMove = (question: ApplicationQuestion, direction: "up" | "down") => {
    setMutationError(null);
    startMutation(async () => {
      const result = await moveJobQuestionAction(jobId, question.id, direction);
      if (result.error) setMutationError(result.error);
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    setMutationError(null);
    startMutation(async () => {
      const result = await deleteJobQuestionAction(jobId, deleting.id);
      if (result.error) {
        setMutationError(result.error);
      }
      setDeleting(null);
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Application questions</CardTitle>
              <CardDescription>
                {canManageJobs
                  ? "Extra questions candidates answer when applying from the careers page."
                  : "Questions candidates answer when applying from the careers page."}
              </CardDescription>
            </div>
            {canManageJobs ? (
              <Button
                onClick={() => setEditing("new")}
                disabled={questions.length >= MAX_QUESTIONS_PER_JOB}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add question
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mutationError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutationError}
            </p>
          ) : null}

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ListChecks className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No questions yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Candidates only fill in the standard application form.
              </p>
            </div>
          ) : (
            <ol className="space-y-2">
              {questions.map((question, index) => (
                <li
                  key={question.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-medium break-words">
                      {index + 1}. {question.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{QUESTION_TYPE_LABELS[question.type]}</Badge>
                      <Badge variant={question.required ? "default" : "outline"}>
                        {question.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    {question.type === "single_choice" ? (
                      <p className="text-xs text-muted-foreground">
                        Options: {question.options.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  {canManageJobs ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move up"
                        disabled={isMutating || index === 0}
                        onClick={() => handleMove(question, "up")}
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move down"
                        disabled={isMutating || index === questions.length - 1}
                        onClick={() => handleMove(question, "down")}
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit question"
                        onClick={() => setEditing(question)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete question"
                        onClick={() => setDeleting(question)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {canManageJobs ? (
        <QuestionFormDialog
          key={editing === "new" ? "new" : (editing?.id ?? "closed")}
          jobId={jobId}
          question={editing === "new" ? null : editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete question</DialogTitle>
            <DialogDescription>
              New applicants will no longer see this question. Answers already submitted stay on
              each candidate.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium break-words">{deleting?.label}</p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuestionFormDialog({
  jobId,
  question,
  open,
  onClose,
}: {
  jobId: string;
  question: ApplicationQuestion | null;
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = React.useState<QuestionFormState>(emptyState);
  const [type, setType] = React.useState<QuestionType>(question?.type ?? "short_text");
  const [isSaving, startSaving] = React.useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      const result = question
        ? await updateJobQuestionAction(jobId, question.id, emptyState, formData)
        : await createJobQuestionAction(jobId, emptyState, formData);
      setState(result);
      if (!result.generic && Object.keys(result.errors).length === 0) {
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question ? "Edit question" : "Add question"}</DialogTitle>
          <DialogDescription>
            Shown on the careers apply form for this job, in the order listed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-label">Question</Label>
            <Input
              id="question-label"
              name="label"
              defaultValue={question?.label ?? ""}
              placeholder="Are you willing to relocate?"
              maxLength={QUESTION_LABEL_MAX}
              required
              aria-invalid={Boolean(state.errors.label) || undefined}
            />
            {state.errors.label ? (
              <p className="text-xs text-destructive">{state.errors.label}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-type">Answer type</Label>
            <select
              id="question-type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as QuestionType)}
              className={`h-8 ${fieldClassName}`}
            >
              {QUESTION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {QUESTION_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            {state.errors.type ? (
              <p className="text-xs text-destructive">{state.errors.type}</p>
            ) : null}
          </div>

          {type === "single_choice" ? (
            <div className="space-y-2">
              <Label htmlFor="question-options">Options (one per line)</Label>
              <textarea
                id="question-options"
                name="options"
                rows={4}
                defaultValue={question?.options.join("\n") ?? ""}
                aria-invalid={Boolean(state.errors.options) || undefined}
                className={`min-h-24 py-2 ${fieldClassName}`}
              />
              {state.errors.options ? (
                <p className="text-xs text-destructive">{state.errors.options}</p>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="required"
              defaultChecked={question?.required ?? false}
              className="size-4 accent-primary"
            />
            Required
          </label>

          {state.generic ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.generic}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {question ? "Save question" : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
