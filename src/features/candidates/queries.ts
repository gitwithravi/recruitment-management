import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type CandidateFilters = {
  search?: string;
  stageId?: string;
};

export type CandidateListItem = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentCity: string;
  noticePeriod: string;
  source: string;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentStage: {
    id: string;
    name: string;
    position: number;
  };
  assignedUser: {
    id: string;
    name: string;
    username: string;
  } | null;
};

export type CandidateDetail = CandidateListItem & {
  currentCtc: string | null;
  expectedCtc: string | null;
  resumeFilePath: string;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  canEditFeedback: boolean;
};

function decimalToString(value: { toString(): string } | null) {
  return value ? value.toString() : null;
}

function toCandidateListItem(candidate: {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  totalExperience: { toString(): string };
  relevantExperience: { toString(): string };
  currentCity: string;
  noticePeriod: string;
  source: string;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentStage: {
    id: string;
    name: string;
    position: number;
  };
  assignedUser: {
    id: string;
    name: string;
    username: string;
  } | null;
}): CandidateListItem {
  return {
    id: candidate.id,
    jobId: candidate.jobId,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    totalExperience: candidate.totalExperience.toString(),
    relevantExperience: candidate.relevantExperience.toString(),
    currentCity: candidate.currentCity,
    noticePeriod: candidate.noticePeriod,
    source: candidate.source,
    feedback: candidate.feedback,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    currentStage: candidate.currentStage,
    assignedUser: candidate.assignedUser,
  };
}

export async function listCandidatesForJob(
  jobId: string,
  filters: CandidateFilters = {},
): Promise<CandidateListItem[]> {
  const search = filters.search?.trim();

  const candidates = await prisma.candidate.findMany({
    where: {
      jobId,
      ...(filters.stageId ? { currentStageId: filters.stageId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { currentCity: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      jobId: true,
      name: true,
      email: true,
      phone: true,
      totalExperience: true,
      relevantExperience: true,
      currentCity: true,
      noticePeriod: true,
      source: true,
      feedback: true,
      createdAt: true,
      updatedAt: true,
      currentStage: {
        select: {
          id: true,
          name: true,
          position: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  return candidates.map(toCandidateListItem);
}

export async function getCandidateForJob(
  user: CurrentUser,
  jobId: string,
  candidateId: string,
): Promise<CandidateDetail | null> {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId },
    select: {
      id: true,
      jobId: true,
      name: true,
      email: true,
      phone: true,
      totalExperience: true,
      relevantExperience: true,
      currentCity: true,
      currentCtc: true,
      expectedCtc: true,
      noticePeriod: true,
      resumeFilePath: true,
      source: true,
      feedback: true,
      createdAt: true,
      updatedAt: true,
      currentStage: {
        select: {
          id: true,
          name: true,
          position: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  if (!candidate) {
    return null;
  }

  return {
    ...toCandidateListItem(candidate),
    currentCtc: decimalToString(candidate.currentCtc),
    expectedCtc: decimalToString(candidate.expectedCtc),
    resumeFilePath: candidate.resumeFilePath,
    createdBy: candidate.createdBy,
    canEditFeedback: user.role === "admin" || candidate.assignedUser?.id === user.id,
  };
}
