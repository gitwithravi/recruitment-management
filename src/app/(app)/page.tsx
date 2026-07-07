import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  KanbanSquare,
  Sparkles,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";

const roadmap = [
  {
    phase: "Phase 3",
    title: "User management",
    description: "Admins create and manage internal users with role and access control.",
    icon: UsersRound,
    status: "Next up",
  },
  {
    phase: "Phase 4",
    title: "Job management",
    description: "Create jobs, seed default stages, and control visibility per user.",
    icon: Briefcase,
    status: "Planned",
  },
  {
    phase: "Phase 8",
    title: "Kanban board",
    description: "Drag-and-drop candidates across stages with filters and search.",
    icon: KanbanSquare,
    status: "Planned",
  },
] as const;

const statusTone: Record<(typeof roadmap)[number]["status"], "default" | "secondary" | "outline"> =
  {
    "Next up": "default",
    Planned: "outline",
  };

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function Home() {
  const user = await getCurrentUser();
  const now = new Date();
  const isAdmin = user?.role === "admin";

  const [userCount, jobCount, candidateCount, unreadNotifications, myJobCount, assignedCount] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.job.count(),
      prisma.candidate.count(),
      prisma.notification.count({
        where: { recipientUserId: user?.id ?? "", readAt: null },
      }),
      prisma.jobUser.count({ where: { userId: user?.id ?? "" } }),
      prisma.candidate.count({ where: { assignedUserId: user?.id ?? "" } }),
    ]);

  const stats = isAdmin
    ? [
        {
          label: "Active users",
          value: userCount,
          hint: "Across all roles",
          icon: Users,
          tone: "primary" as const,
        },
        {
          label: "Jobs",
          value: jobCount,
          hint: jobCount === 0 ? "No jobs yet" : "Open and closed",
          icon: Briefcase,
          tone: "default" as const,
        },
        {
          label: "Candidates",
          value: candidateCount,
          hint: candidateCount === 0 ? "Add jobs to begin" : "Across all jobs",
          icon: ClipboardList,
          tone: "default" as const,
        },
        {
          label: "Unread alerts",
          value: unreadNotifications,
          hint: unreadNotifications === 0 ? "You're all caught up" : "Awaiting review",
          icon: Bell,
          tone: "accent" as const,
        },
      ]
    : [
        {
          label: "My jobs",
          value: myJobCount,
          hint: myJobCount === 0 ? "None assigned yet" : "You're attached to",
          icon: Briefcase,
          tone: "primary" as const,
        },
        {
          label: "Assigned to me",
          value: assignedCount,
          hint: assignedCount === 0 ? "Nothing in your queue" : "Active candidates",
          icon: UserCheck,
          tone: "default" as const,
        },
        {
          label: "Unread alerts",
          value: unreadNotifications,
          hint: unreadNotifications === 0 ? "You're all caught up" : "Awaiting review",
          icon: Bell,
          tone: "accent" as const,
        },
      ];

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
              {greeting(now)}, {user?.name?.split(" ")[0] ?? "there"}.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {isAdmin
                ? "Manage users, jobs, and monitor hiring activity across the team."
                : "Track candidates assigned to you and stay on top of updates across your jobs."}
            </p>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"} className="w-fit capitalize">
            {user?.role} role
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" aria-hidden="true" />
              Getting started
            </CardTitle>
            <CardDescription>
              The workspace is live. Here&apos;s what you can do next based on your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin ? (
              <>
                <QuickAction
                  step="1"
                  title="Manage internal users"
                  description="Create accounts, set roles, and deactivate access."
                  badge="Phase 3"
                />
                <QuickAction
                  step="2"
                  title="Create your first job"
                  description="Add a job and we'll seed the default Kanban stages."
                  badge="Phase 4"
                />
                <QuickAction
                  step="3"
                  title="Attach team members to jobs"
                  description="Control which users can see and work on each job."
                  badge="Phase 5"
                />
              </>
            ) : (
              <>
                <QuickAction
                  step="1"
                  title="Wait for job access"
                  description="An admin will attach you to the jobs you should work on."
                  badge="Pending"
                />
                <QuickAction
                  step="2"
                  title="Review assigned candidates"
                  description="Once assigned, move candidates across stages with comments."
                  badge="Phase 9"
                />
                <QuickAction
                  step="3"
                  title="Collaborate in comments"
                  description="Mention teammates and keep feedback in one thread."
                  badge="Phase 11"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Platform status
            </CardTitle>
            <CardDescription>What&apos;s live and what&apos;s coming.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow icon={CheckCircle2} label="Authentication & sessions" done />
            <StatusRow icon={CheckCircle2} label="Role-aware server guards" done />
            <StatusRow icon={CircleDot} label="User management" />
            <StatusRow icon={CircleDot} label="Jobs & Kanban boards" />
            <StatusRow icon={CircleDot} label="Notifications" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">What&apos;s next</h2>
            <p className="text-sm text-muted-foreground">Upcoming milestones on the roadmap.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {roadmap.map((item) => (
            <Card key={item.phase} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <Badge variant={statusTone[item.status]}>{item.status}</Badge>
                </div>
                <CardTitle className="text-base">
                  <span className="text-xs font-medium text-muted-foreground">{item.phase}</span>
                  <span className="block">{item.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  step,
  title,
  description,
  badge,
}: {
  step: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted-foreground ring-1 ring-border">
        {step}
      </span>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          <Badge variant="outline" className="text-[0.65rem]">
            {badge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  done,
}: {
  icon: typeof CheckCircle2;
  label: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        className={done ? "size-4 text-primary" : "size-4 text-muted-foreground"}
        aria-hidden="true"
      />
      <span className={done ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      {done ? (
        <Badge variant="secondary" className="ml-auto text-[0.65rem]">
          Live
        </Badge>
      ) : (
        <span className="ml-auto text-xs text-muted-foreground">Soon</span>
      )}
    </div>
  );
}
