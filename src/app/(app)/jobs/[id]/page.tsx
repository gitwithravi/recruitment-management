import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BarChart3, Columns3, ListChecks, UsersRound, Workflow } from "lucide-react";

import { JobActions } from "@/components/jobs/job-actions";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JobUsersPanel } from "@/components/jobs/job-users-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobForUser, listAssignableUsersForJob } from "@/features/jobs/queries";
import { cn } from "@/lib/utils";
import { requireJobAccess } from "@/server/auth/session";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

const tabs = [
  { value: "board", label: "Board", icon: Columns3 },
  { value: "candidates", label: "Candidates", icon: ListChecks },
  { value: "stages", label: "Stages", icon: Workflow },
  { value: "users", label: "Users", icon: UsersRound },
  { value: "reports", label: "Reports", icon: BarChart3 },
] as const;

type TabValue = (typeof tabs)[number]["value"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const job = await getJobForUser(user, id);

  return {
    title: job ? `${job.title} · Recruitment` : "Job · Recruitment",
  };
}

function parseTab(value: string | string[] | undefined): TabValue {
  const tab = Array.isArray(value) ? value[0] : value;
  return tabs.some((item) => item.value === tab) ? (tab as TabValue) : "board";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const query = await searchParams;
  const activeTab = parseTab(query.tab);
  const job = await getJobForUser(user, id);

  if (!job) {
    notFound();
  }

  const canManageJobs = user.role === "admin";
  const assignableUsers =
    canManageJobs && activeTab === "users" ? await listAssignableUsersForJob(job.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/jobs" />}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Jobs
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {job.description}
            </p>
          </div>
          {canManageJobs ? <JobActions job={job} /> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Stages" value={job.stageCount} />
        <Metric label="Candidates" value={job.candidateCount} />
        <Metric label="Attached users" value={job.attachedUserCount} />
        <Metric label="Updated" value={formatDate(job.updatedAt)} />
      </div>

      <div className="overflow-x-auto border-b">
        <nav className="flex min-w-max gap-1" aria-label="Job sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;

            return (
              <Link
                key={tab.value}
                href={
                  tab.value === "board" ? `/jobs/${job.id}` : `/jobs/${job.id}?tab=${tab.value}`
                }
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {activeTab === "board" ? <BoardTab job={job} /> : null}
      {activeTab === "candidates" ? (
        <PlaceholderTab
          title="Candidates"
          description="Candidate list and creation workflow are scheduled for Phase 7."
        />
      ) : null}
      {activeTab === "stages" ? <StagesTab job={job} canManageJobs={canManageJobs} /> : null}
      {activeTab === "users" ? (
        <JobUsersPanel
          jobId={job.id}
          attachedUsers={job.attachedUsers}
          assignableUsers={assignableUsers}
          canManageJobs={canManageJobs}
        />
      ) : null}
      {activeTab === "reports" ? (
        <PlaceholderTab
          title="Reports"
          description="Job-aware reports are scheduled for Phase 15."
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function BoardTab({ job }: { job: NonNullable<Awaited<ReturnType<typeof getJobForUser>>> }) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {job.stages.map((stage) => (
        <section key={stage.id} className="min-h-40 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-sm font-medium">{stage.name}</h2>
            <Badge variant="secondary">{stage.candidateCount}</Badge>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground">Candidate cards will appear here.</p>
          </div>
        </section>
      ))}
    </div>
  );
}

function StagesTab({
  job,
  canManageJobs,
}: {
  job: NonNullable<Awaited<ReturnType<typeof getJobForUser>>>;
  canManageJobs: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stages</CardTitle>
        <CardDescription>
          {canManageJobs
            ? "Stage configuration controls arrive in Phase 6. The seeded stages are listed below."
            : "Users can view the job workflow but cannot configure stages."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">
                {stage.position}. {stage.name}
              </p>
              <p className="text-xs text-muted-foreground">{stage.candidateCount} candidates</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
