import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type ReportableJob = {
  id: string;
  title: string;
};

const ALL_JOBS = "all";

function isAllJobs(jobId: string) {
  return jobId === ALL_JOBS;
}

export async function listReportableJobsForUser(user: CurrentUser): Promise<ReportableJob[]> {
  if (user.role === "admin") {
    const jobs = await prisma.job.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true },
    });
    return jobs;
  }

  const memberships = await prisma.jobUser.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      job: { select: { id: true, title: true } },
    },
  });

  return memberships.map((membership) => membership.job);
}

function accessibleJobFilter(user: CurrentUser) {
  return user.role === "admin"
    ? {}
    : { job: { users: { some: { userId: user.id } } } };
}

function accessibleJobStageFilter(user: CurrentUser) {
  return user.role === "admin"
    ? {}
    : { job: { users: { some: { userId: user.id } } } };
}

export async function assertReportJobAccess(user: CurrentUser, jobId: string): Promise<void> {
  if (isAllJobs(jobId)) {
    return;
  }

  if (user.role === "admin") {
    return;
  }

  const membership = await prisma.jobUser.findUnique({
    where: { jobId_userId: { jobId, userId: user.id } },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("REPORT_ACCESS_DENIED");
  }
}

export type CandidatesPerStageRow = {
  job: { id: string; title: string };
  stage: { id: string; name: string; position: number };
  candidateCount: number;
};

export async function getCandidatesPerStageReport(
  user: CurrentUser,
  jobId: string,
): Promise<CandidatesPerStageRow[]> {
  await assertReportJobAccess(user, jobId);

  const stages = await prisma.jobStage.findMany({
    where: {
      ...(isAllJobs(jobId) ? accessibleJobStageFilter(user) : { jobId }),
    },
    orderBy: [{ jobId: "asc" }, { position: "asc" }],
    select: {
      id: true,
      name: true,
      position: true,
      jobId: true,
      job: { select: { id: true, title: true } },
      _count: { select: { candidates: true } },
    },
  });

  return stages.map((stage) => ({
    job: { id: stage.job.id, title: stage.job.title },
    stage: { id: stage.id, name: stage.name, position: stage.position },
    candidateCount: stage._count.candidates,
  }));
}

export type AssignedPerUserRow = {
  user: { id: string; name: string; username: string } | null;
  job: { id: string; title: string };
  candidateCount: number;
};

export async function getAssignedPerUserReport(
  user: CurrentUser,
  jobId: string,
): Promise<AssignedPerUserRow[]> {
  await assertReportJobAccess(user, jobId);

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(isAllJobs(jobId) ? accessibleJobFilter(user) : { jobId }),
    },
    select: {
      id: true,
      assignedUser: { select: { id: true, name: true, username: true } },
      job: { select: { id: true, title: true } },
    },
  });

  const map = new Map<string, AssignedPerUserRow>();

  for (const candidate of candidates) {
    const assignee = candidate.assignedUser;
    const key = `${assignee?.id ?? "unassigned"}|${candidate.job.id}`;
    const existing = map.get(key);

    if (existing) {
      existing.candidateCount += 1;
    } else {
      map.set(key, {
        user: assignee
          ? { id: assignee.id, name: assignee.name, username: assignee.username }
          : null,
        job: { id: candidate.job.id, title: candidate.job.title },
        candidateCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const nameA = a.user?.name ?? "Unassigned";
    const nameB = b.user?.name ?? "Unassigned";
    if (nameA === nameB) {
      return a.job.title.localeCompare(b.job.title);
    }
    return nameA.localeCompare(nameB);
  });
}

export type SourceCountRow = {
  source: string;
  candidateCount: number;
};

export async function getSourceCountsReport(
  user: CurrentUser,
  jobId: string,
): Promise<SourceCountRow[]> {
  await assertReportJobAccess(user, jobId);

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(isAllJobs(jobId) ? accessibleJobFilter(user) : { jobId }),
    },
    select: { id: true, source: true },
  });

  const map = new Map<string, SourceCountRow>();

  for (const candidate of candidates) {
    const existing = map.get(candidate.source);
    if (existing) {
      existing.candidateCount += 1;
    } else {
      map.set(candidate.source, { source: candidate.source, candidateCount: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.candidateCount - a.candidateCount);
}

export type AgingRow = {
  candidate: { id: string; name: string };
  job: { id: string; title: string };
  stage: { id: string; name: string; position: number };
  daysInStage: number;
  updatedAt: Date;
};

export async function getAgingReport(
  user: CurrentUser,
  jobId: string,
): Promise<AgingRow[]> {
  await assertReportJobAccess(user, jobId);

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(isAllJobs(jobId) ? accessibleJobFilter(user) : { jobId }),
    },
    orderBy: [{ updatedAt: "asc" }],
    select: {
      id: true,
      name: true,
      updatedAt: true,
      job: { select: { id: true, title: true } },
      currentStage: { select: { id: true, name: true, position: true } },
    },
  });

  const now = Date.now();

  return candidates.map((candidate) => ({
    candidate: { id: candidate.id, name: candidate.name },
    job: { id: candidate.job.id, title: candidate.job.title },
    stage: candidate.currentStage,
    daysInStage: Math.max(0, Math.floor((now - candidate.updatedAt.getTime()) / 86_400_000)),
    updatedAt: candidate.updatedAt,
  }));
}

export type ReportKind = "candidates-per-stage" | "assigned-per-user" | "source-counts" | "aging";

export const reportKinds: { value: ReportKind; label: string; description: string }[] = [
  {
    value: "candidates-per-stage",
    label: "Candidates per stage",
    description: "Candidate counts grouped by stage for each job.",
  },
  {
    value: "assigned-per-user",
    label: "Assigned per user",
    description: "Resumes assigned to each user, split by job.",
  },
  {
    value: "source-counts",
    label: "Source counts",
    description: "Candidate counts grouped by source.",
  },
  {
    value: "aging",
    label: "Aging report",
    description: "How long candidates have been in their current stage.",
  },
];