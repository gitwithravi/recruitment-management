"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { CandidateFormDialog } from "@/components/candidates/candidate-form-dialog";
import { Button } from "@/components/ui/button";
import type { CandidateDetail } from "@/features/candidates/queries";

export function EditCandidateButton({
  jobId,
  candidate,
}: {
  jobId: string;
  candidate: CandidateDetail;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <CandidateFormDialog
      mode="edit"
      jobId={jobId}
      candidate={candidate}
      canEditFeedback={candidate.canEditFeedback}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Pencil className="size-4" aria-hidden="true" />
          Edit candidate
        </Button>
      }
    />
  );
}
