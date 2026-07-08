"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CandidateFormDialog } from "@/components/candidates/candidate-form-dialog";

export function AddCandidateButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <CandidateFormDialog
      mode="create"
      jobId={jobId}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Add candidate
        </Button>
      }
    />
  );
}
