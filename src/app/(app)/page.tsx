import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  History,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getAdminAssignmentsPerUser,
  getAdminStageBreakdown,
  getMyAssignedCandidates,
  getMyJobs,
  getRecentActivity,
  type DashboardStageBreakdown,
} from "@/features/dashboard/queries";
import { countUnreadNotifications, listNotifications } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/db/client";

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(date);
}

function humanizeAction(action: string) {
  return action.replace(/_/g, " ");
}

function groupStagesByJob(rows: DashboardStageBreakdown[]) {
  const map = new Map<
    string,
    { jobId: string; jobTitle: string; stages: { stageName: string; candidateCount: number }[] }
  >();
  for (const row of rows) {
    let group = map.get(row.jobId);
    if (!group) {
      group = { jobId: row.jobId, jobTitle: row.jobTitle, stages: [] };
      map.set(row.jobId, group);
    }
    group.stages.push({ stageName: row.stageName, candidateCount: row.candidateCount });
  }
  return Array.from(map.values());
}

export default async function Home() {
  const user = await getCurrentUser();
  const now = new Date();
  const isAdmin = user?.role === "admin";

  if (!user) {
    return null;
  }

  const unreadNotifications = await countUnreadNotifications(user.id);

  if (isAdmin) {
    const [userCount, jobCount, candidateCount, stageBreakdown, assignments, activity] =
      await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.job.count(),
        prisma.candidate.count(),
        getAdminStageBreakdown(),
        getAdminAssignmentsPerUser(),
        getRecentActivity(8),
      ]);

    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatDate(now)}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {greeting(now)}, {user.name.split(" ")[0]}.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Manage users, jobs, and monitor hiring activity across the team.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="capitalize">
                {user.role} role
              </Badge>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell className="size-3.5" aria-hidden="true" />
                {unreadNotifications > 0 ? `${unreadNotifications} new` : "Inbox"}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active users" value={userCount} hint="Across all roles" icon={Users} tone="primary" />
          <StatCard label="Jobs" value={jobCount} hint="Open and closed" icon={Briefcase} tone="default" />
          <StatCard
            label="Candidates"
            value={candidateCount}
            hint="Across all jobs"
            icon={ClipboardList}
            tone="default"
          />
          <StatCard
            label="Unread alerts"
            value={unreadNotifications}
            hint={unreadNotifications === 0 ? "You're all caught up" : "Awaiting review"}
            icon={Bell}
            tone="accent"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" aria-hidden="true" />
                Candidates per stage
              </CardTitle>
              <CardDescription>Distribution across all job pipelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stageBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stages or candidates yet.</p>
              ) : (
                groupStagesByJob(stageBreakdown)
                  .slice(0, 3)
                  .map((group) => {
                    const total = group.stages.reduce(
                      (sum, stage) => sum + stage.candidateCount,
                      0,
                    );
                    return (
                      <div key={group.jobId} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/jobs/${group.jobId}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {group.jobTitle}
                          </Link>
                          <Badge variant="secondary">{total} candidates</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.stages.map((stage) => (
                            <span
                              key={stage.stageName}
                              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {stage.stageName}
                              <span className="font-medium text-foreground tabular-nums">
                                {stage.candidateCount}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="size-4" aria-hidden="true" />
                Assignments per user
              </CardTitle>
              <CardDescription>Who&apos;s holding candidates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : (
                assignments.slice(0, 6).map((row) => (
                  <div
                    key={row.userId}
                    className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {row.userName}{" "}
                      <span className="text-muted-foreground">@{row.username}</span>
                    </span>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {row.candidateCount}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4" aria-hidden="true" />
                Recent activity
              </CardTitle>
              <CardDescription>Latest audit events across the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="capitalize">{humanizeAction(item.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.actor ? `by @${item.actor.username} · ` : ""}
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick links</CardTitle>
              <CardDescription>Jump to a workspace area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink href="/jobs" icon={Briefcase} label="Jobs" />
              <QuickLink href="/reports" icon={ClipboardList} label="Reports" />
              <QuickLink href="/admin/users" icon={UsersRound} label="Manage users" />
              <QuickLink href="/notifications" icon={Bell} label="Notifications" />
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const [myJobs, assignedCandidates, notifications] = await Promise.all([
    getMyJobs(user),
    getMyAssignedCandidates(user, 8),
    listNotifications(user.id, 6),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(now)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting(now)}, {user.name.split(" ")[0]}.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Track candidates assigned to you and stay on top of updates across your jobs.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit capitalize">
            {user.role} role
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="My jobs" value={myJobs.length} hint="You're attached to" icon={Briefcase} tone="primary" />
        <StatCard
          label="Assigned to me"
          value={assignedCandidates.length}
          hint="Active candidates"
          icon={UserCheck}
          tone="default"
        />
        <StatCard
          label="Unread alerts"
          value={unreadNotifications}
          hint={unreadNotifications === 0 ? "You're all caught up" : "Awaiting review"}
          icon={Bell}
          tone="accent"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" aria-hidden="true" />
              Candidates assigned to me
            </CardTitle>
            <CardDescription>Pick up where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {assignedCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing in your queue yet. Ask an admin to assign a candidate.
              </p>
            ) : (
              assignedCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/jobs/${candidate.jobId}/candidates/${candidate.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-medium hover:underline">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.jobTitle} · {candidate.stageName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(candidate.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" aria-hidden="true" />
              Recent notifications
            </CardTitle>
            <CardDescription>Assignments and mentions.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((notification) => {
                const linkHref =
                  notification.relatedJobId && notification.relatedCandidateId
                    ? `/jobs/${notification.relatedJobId}/candidates/${notification.relatedCandidateId}`
                    : null;
                const body = (
                  <>
                    <p
                      className={
                        notification.readAt
                          ? "text-sm"
                          : "text-sm font-medium"
                      }
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </>
                );
                return linkHref ? (
                  <Link key={notification.id} href={linkHref} className="block py-2.5 hover:underline">
                    {body}
                  </Link>
                ) : (
                  <div key={notification.id} className="py-2.5">
                    {body}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4" aria-hidden="true" />
              Your jobs
            </CardTitle>
            <CardDescription>Jobs you&apos;re attached to.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {myJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No jobs yet. An admin will attach you to the jobs you should work on.
              </p>
            ) : (
              myJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-medium hover:underline">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.candidateCount} candidates · updated {formatRelative(job.updatedAt)}
                    </p>
                  </div>
                  <Badge variant={job.status === "open" ? "secondary" : "outline"} className="capitalize">
                    {job.status}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </span>
      <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}