"use client";

import * as React from "react";
import {
  Copy,
  ExternalLink,
  Globe,
  GlobeLock,
  MoreHorizontal,
  Pencil,
  XCircle,
} from "lucide-react";

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
import { closeJobAction, setJobPublishedAction } from "@/features/jobs/actions";
import type { JobListItem } from "@/features/jobs/queries";

type JobActionsProps = {
  job: Pick<JobListItem, "id" | "title" | "description" | "status" | "isPublished">;
  align?: "start" | "end";
};

export function JobActions({ job, align = "end" }: JobActionsProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const handleClose = React.useCallback(async () => {
    const result = await closeJobAction(job.id);
    if (result.error) {
      throw new Error(result.error);
    }
  }, [job.id]);

  const handlePublish = React.useCallback(
    (isPublished: boolean) => {
      startTransition(async () => {
        const result = await setJobPublishedAction(job.id, isPublished);
        if (result.error) {
          throw new Error(result.error);
        }
      });
    },
    [job.id],
  );

  const copyPublicLink = React.useCallback(async () => {
    const url = `${window.location.origin}/careers/${job.id}`;
    await navigator.clipboard.writeText(url);
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
        <DropdownMenuContent align={align} className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Job actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit details
          </DropdownMenuItem>
          {job.isPublished ? (
            <DropdownMenuItem disabled={pending} onClick={() => handlePublish(false)}>
              <GlobeLock className="size-4" aria-hidden="true" />
              Unlist from careers
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={pending || job.status === "closed"}
              onClick={() => handlePublish(true)}
            >
              <Globe className="size-4" aria-hidden="true" />
              List on careers
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={!job.isPublished}
            onClick={() => window.open(`/careers/${job.id}`, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            View careers page
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!job.isPublished} onClick={() => void copyPublicLink()}>
            <Copy className="size-4" aria-hidden="true" />
            Copy public link
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
