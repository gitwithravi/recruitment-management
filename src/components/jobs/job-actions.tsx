"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloseJobDialog } from "@/components/jobs/close-job-dialog";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";
import { closeJobAction } from "@/features/jobs/actions";
import type { JobListItem } from "@/features/jobs/queries";

type JobActionsProps = {
  job: Pick<JobListItem, "id" | "title" | "description" | "status">;
  align?: "start" | "end";
};

export function JobActions({ job, align = "end" }: JobActionsProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);

  const handleClose = React.useCallback(async () => {
    const result = await closeJobAction(job.id);
    if (result.error) {
      throw new Error(result.error);
    }
  }, [job.id]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${job.title}`}>
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align={align} className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Job actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setCloseOpen(true)}
            disabled={job.status === "closed"}
            variant="destructive"
          >
            <XCircle className="size-4" aria-hidden="true" />
            Close job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <JobFormDialog mode="edit" open={editOpen} onOpenChange={setEditOpen} job={job} />
      <CloseJobDialog
        title={job.title}
        open={closeOpen}
        onOpenChange={setCloseOpen}
        onConfirm={handleClose}
      />
    </>
  );
}
