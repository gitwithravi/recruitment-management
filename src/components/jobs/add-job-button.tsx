"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";

export function AddJobButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <JobFormDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Create job
        </Button>
      }
    />
  );
}
