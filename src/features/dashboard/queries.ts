import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type DashboardStageBreakdown = {
  jobId: string;
  jobTitle: string;
  stageId: string;
  stageName: string;
  position: number;
  candidateCount: number;
};

export async function getAdminStageBreakdown(): Promise<DashboardStageBreakdown[]> {
  const stages = await prisma.jobStage.findMany({
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
    jobId: stage.job.id,
    jobTitle: stage.job.title,
    stageId: stage.id,
    stageName: stage.name,
    position: stage.position,
    candidateCount: stage._count.candidates,
  }));
}

export type DashboardAssignmentRow = {
  userId: string;
  userName: string;
  username: string;
  candidateCount: number;
};

export async function getAdminAssignmentsPerUser(): Promise<DashboardAssignmentRow[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      _count: { select: { assignedCandidates: true } },
    },
  });

  return users
    .map((user) => ({
      userId: user.id,
      userName: user.name,
      username: user.username,
      candidateCount: user._count.assignedCandidates,
    }))
    .filter((row) => row.candidateCount > 0);
}

export type DashboardActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: { id: string; name: string; username: string } | null;
};

export async function getRecentActivity(limit = 10): Promise<DashboardActivityItem[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, name: true, username: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt,
    actor: log.actor,
  }));
}

export type DashboardMyCandidate = {
  id: string;
  name: string;
  jobId: string;
  jobTitle: string;
  stageName: string;
  updatedAt: Date;
};

export async function getMyAssignedCandidates(
  user: CurrentUser,
  limit = 10,
): Promise<DashboardMyCandidate[]> {
  const candidates = await prisma.candidate.findMany({
    where: { assignedUserId: user.id },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      job: { select: { id: true, title: true } },
      currentStage: { select: { name: true } },
    },
  });

  return candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    jobId: candidate.job.id,
    jobTitle: candidate.job.title,
    stageName: candidate.currentStage.name,
    updatedAt: candidate.updatedAt,
  }));
}

export type DashboardMyJobRow = {
  id: string;
  title: string;
  status: "open" | "closed";
  candidateCount: number;
  updatedAt: Date;
};

export async function getMyJobs(
  user: CurrentUser,
): Promise<DashboardMyJobRow[]> {
  const memberships = await prisma.jobUser.findMany({
    where: { userId: user.id },
    orderBy: { job: { updatedAt: "desc" } },
    select: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          _count: { select: { candidates: true } },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    id: membership.job.id,
    title: membership.job.title,
    status: membership.job.status,
    candidateCount: membership.job._count.candidates,
    updatedAt: membership.job.updatedAt,
  }));
}