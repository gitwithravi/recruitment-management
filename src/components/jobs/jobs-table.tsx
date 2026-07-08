"use client";

import Link from "next/link";
import { CalendarDays, MoreHorizontal, UsersRound } from "lucide-react";

import { JobActions } from "@/components/jobs/job-actions";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobListItem } from "@/features/jobs/queries";
import { cn } from "@/lib/utils";

type JobsTableProps = {
  jobs: JobListItem[];
  canManageJobs: boolean;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function truncateDescription(description: string) {
  return description.length > 150 ? `${description.slice(0, 147)}...` : description;
}

export function JobsTable({ jobs, canManageJobs }: JobsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Job</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Access</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id} className={cn(job.status === "closed" && "opacity-70")}>
            <TableCell className="max-w-md pl-4">
              <div className="space-y-1">
                <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                  {job.title}
                </Link>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {truncateDescription(job.description)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <JobStatusBadge status={job.status} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{job.stageCount} stages</Badge>
                <Badge variant="secondary">{job.candidateCount} candidates</Badge>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <UsersRound className="size-3.5" aria-hidden="true" />
                {job.attachedUserCount} users
              </span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(job.updatedAt)}
              </span>
            </TableCell>
            <TableCell className="pr-4 text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" render={<Link href={`/jobs/${job.id}`} />}>
                  View
                </Button>
                {canManageJobs ? (
                  <JobActions job={job} />
                ) : (
                  <Button variant="ghost" size="icon-sm" disabled aria-label="No job actions">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
