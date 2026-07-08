"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  replaceCandidateResumeAction,
  type ResumeReplaceState,
} from "@/features/candidates/actions";

const initialState: ResumeReplaceState = {};

export function ResumeReplaceForm({ jobId, candidateId }: { jobId: string; candidateId: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const action = React.useMemo(
    () => replaceCandidateResumeAction.bind(null, jobId, candidateId),
    [candidateId, jobId],
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  React.useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="replace-resume">Replace resume</Label>
        <Input id="replace-resume" name="resume" type="file" accept=".pdf,.doc,.docx" required />
      </div>
      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" aria-hidden="true" />
            Replace resume
          </>
        )}
      </Button>
    </form>
  );
}
