import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";

import { AddJobButton } from "@/components/jobs/add-job-button";
import { JobsTable } from "@/components/jobs/jobs-table";
import { JobStatusFilter } from "@/components/jobs/job-status-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listJobsForUser,
  type JobStatusFilter as JobStatusFilterValue,
} from "@/features/jobs/queries";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Jobs · Recruitment",
};

function parseStatusFilter(value: string | string[] | undefined): JobStatusFilterValue {
  const status = Array.isArray(value) ? value[0] : value;
  if (status === "open" || status === "closed") {
    return status;
  }
  return "all";
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const status = parseStatusFilter(query.status);
  const jobs = await listJobsForUser(user, status);
  const openCount = jobs.filter((job) => job.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "admin"
              ? "Manage recruitment jobs and their job-specific Kanban boards."
              : "View jobs you are attached to and continue candidate work from there."}
          </p>
        </div>
        {user.role === "admin" ? <AddJobButton /> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <JobStatusFilter active={status} />
        <p className="text-sm text-muted-foreground">
          {jobs.length} shown · {openCount} open
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {status === "all"
              ? "All visible jobs"
              : `${status[0].toUpperCase()}${status.slice(1)} jobs`}
          </CardTitle>
          <CardDescription>
            {user.role === "admin"
              ? "Admins can see open and closed jobs across the workspace."
              : "Your list is limited to jobs an admin attached you to."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No jobs found</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {user.role === "admin"
                  ? "Create a job to seed the default stages and start building the hiring board."
                  : "An admin needs to attach you to a job before it appears here."}
              </p>
            </div>
          ) : (
            <JobsTable jobs={jobs} canManageJobs={user.role === "admin"} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
