import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAgingReport,
  getAssignedPerUserReport,
  getCandidatesPerStageReport,
  getSourceCountsReport,
  listReportableJobsForUser,
  reportKinds,
  type ReportKind,
} from "@/features/reports/queries";
import { requireUser } from "@/server/auth/session";
import { cn } from "@/lib/utils";

type ReportsPageProps = {
  searchParams: Promise<{ report?: string | string[]; jobId?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Reports · Recruitment",
};

const ALL_JOBS = "all";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseReportKind(value: string | undefined): ReportKind {
  const candidate = reportKinds.find((kind) => kind.value === value);
  return candidate ? candidate.value : "candidates-per-stage";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await requireUser();
  const query = await searchParams;
  const reportKind = parseReportKind(firstParam(query.report));
  const selectedJobId = firstParam(query.jobId) ?? ALL_JOBS;
  const isAdmin = user.role === "admin";

  const jobs = await listReportableJobsForUser(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Hiring metrics across all jobs. Job access is enforced per report."
              : "Hiring metrics for the jobs you are attached to."}
          </p>
        </div>
        <Badge variant={isAdmin ? "default" : "secondary"} className="w-fit capitalize">
          {user.role} view
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {reportKinds.map((kind) => {
          const active = kind.value === reportKind;
          return (
            <Link
              key={kind.value}
              href={`/reports?report=${kind.value}&jobId=${encodeURIComponent(selectedJobId)}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <BarChart3 className="size-3.5" aria-hidden="true" />
              {kind.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {reportKinds.find((kind) => kind.value === reportKind)?.label}
              </CardTitle>
              <CardDescription>
                {reportKinds.find((kind) => kind.value === reportKind)?.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <JobSelector jobs={jobs} selectedJobId={selectedJobId} reportKind={reportKind} />
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/reports/${reportKind}/export?jobId=${encodeURIComponent(selectedJobId)}`} />
                }
              >
                <Download className="size-4" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <ReportBody
            user={user}
            reportKind={reportKind}
            selectedJobId={selectedJobId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function JobSelector({
  jobs,
  selectedJobId,
  reportKind,
}: {
  jobs: { id: string; title: string }[];
  selectedJobId: string;
  reportKind: ReportKind;
}) {
  return (
    <form className="flex items-center gap-2" key={`${reportKind}-${selectedJobId}`}>
      <label htmlFor="report-job" className="text-xs font-medium text-muted-foreground">
        Job
      </label>
      <select
        id="report-job"
        name="jobId"
        defaultValue={selectedJobId}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value={ALL_JOBS}>All accessible jobs</option>
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.title}
          </option>
        ))}
      </select>
      <input type="hidden" name="report" value={reportKind} />
      <Button type="submit" variant="outline" size="sm">
        Apply
      </Button>
    </form>
  );
}

async function ReportBody({
  user,
  reportKind,
  selectedJobId,
}: {
  user: Awaited<ReturnType<typeof requireUser>>;
  reportKind: ReportKind;
  selectedJobId: string;
}) {
  if (reportKind === "candidates-per-stage") {
    const rows = await getCandidatesPerStageReport(user, selectedJobId);
    return (
      <ReportTable
        headers={["Job", "Stage", "Candidates"]}
        rows={rows.map((row) => [
          row.job.title,
          row.stage.name,
          String(row.candidateCount),
        ])}
        empty="No stages with candidates yet."
      />
    );
  }

  if (reportKind === "assigned-per-user") {
    const rows = await getAssignedPerUserReport(user, selectedJobId);
    return (
      <ReportTable
        headers={["Assignee", "Job", "Assigned"]}
        rows={rows.map((row) => [
          row.user ? `${row.user.name} (@${row.user.username})` : "Unassigned",
          row.job.title,
          String(row.candidateCount),
        ])}
        empty="No assignments yet."
      />
    );
  }

  if (reportKind === "source-counts") {
    const rows = await getSourceCountsReport(user, selectedJobId);
    return (
      <ReportTable
        headers={["Source", "Candidates"]}
        rows={rows.map((row) => [row.source, String(row.candidateCount)])}
        empty="No candidates yet."
      />
    );
  }

  const rows = await getAgingReport(user, selectedJobId);
  return (
    <ReportTable
      headers={["Candidate", "Job", "Stage", "Days in stage", "Since"]}
      rows={rows.map((row) => [
        row.candidate.name,
        row.job.title,
        row.stage.name,
        String(row.daysInStage),
        formatDate(row.updatedAt),
      ])}
      empty="No candidates yet."
    />
  );
}

function ReportTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell) => (
              <TableCell key={cell}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}