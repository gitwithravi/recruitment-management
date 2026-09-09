import "server-only";

import { prisma } from "@/db/client";
import type { AuditAction } from "@/generated/prisma/client";
import type { CurrentUser } from "@/server/auth/session";
import { requireJobAccess } from "@/server/auth/session";

export type CandidateFilters = {
  search?: string;
  stageId?: string;
  assignedUserId?: string;
  source?: string;
  currentCity?: string;
  minExperience?: number | null;
  maxExperience?: number | null;
  noticePeriod?: string;
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
  } | null;
  canEditFeedback: boolean;
};

export type BoardCandidate = {
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
  updatedAt: Date;
  currentStageId: string;
  assignedUser: {
    id: string;
    name: string;
    username: string;
  } | null;
};

export type BoardStage = {
  id: string;
  name: string;
  position: number;
};

export type BoardFilters = {
  assignedUsers: {
    id: string;
    name: string;
    username: string;
  }[];
  sources: string[];
  cities: string[];
  noticePeriods: string[];
};

export type CandidateStageTimelineItem = {
  id: string;
  fromStage: {
    id: string;
    name: string;
  } | null;
  toStage: {
    id: string;
    name: string;
  };
  movedBy: {
    id: string;
    name: string;
    username: string;
  } | null;
  comment: string | null;
  createdAt: Date;
};

export type CandidateAssignmentTimelineItem = {
  id: string;
  previousAssignee: {
    id: string;
    name: string;
    username: string;
  } | null;
  newAssignee: {
    id: string;
    name: string;
    username: string;
  } | null;
  assignedBy: {
    id: string;
    name: string;
    username: string;
  };
  comment: string | null;
  createdAt: Date;
};

export type CandidateHistoryTimelineItem = {
  id: string;
  action: AuditAction | "stage_history" | "assignment_history";
  badge: string;
  title: string;
  description: string | null;
  actor: {
    id: string;
    name: string;
    username: string;
  } | null;
  createdAt: Date;
  visibility: "public" | "admin";
  metadata: Record<string, unknown> | null;
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
  const minExperience =
    typeof filters.minExperience === "number" && !Number.isNaN(filters.minExperience)
      ? filters.minExperience
      : null;
  const maxExperience =
    typeof filters.maxExperience === "number" && !Number.isNaN(filters.maxExperience)
      ? filters.maxExperience
      : null;

  const candidates = await prisma.candidate.findMany({
    where: {
      jobId,
      ...(filters.stageId ? { currentStageId: filters.stageId } : {}),
      ...(filters.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.currentCity ? { currentCity: filters.currentCity } : {}),
      ...(filters.noticePeriod ? { noticePeriod: filters.noticePeriod } : {}),
      ...(minExperience !== null ? { totalExperience: { gte: minExperience } } : {}),
      ...(maxExperience !== null ? { totalExperience: { lte: maxExperience } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
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

export type CandidateFilterOptions = {
  stages: { id: string; name: string; position: number }[];
  assignedUsers: { id: string; name: string; username: string }[];
  sources: string[];
  cities: string[];
  noticePeriods: string[];
};

export async function getCandidateFilterOptions(jobId: string): Promise<CandidateFilterOptions> {
  const [stages, candidates, assignedUsers] = await Promise.all([
    prisma.jobStage.findMany({
      where: { jobId },
      orderBy: { position: "asc" },
      select: { id: true, name: true, position: true },
    }),
    prisma.candidate.findMany({
      where: { jobId },
      select: { source: true, currentCity: true, noticePeriod: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ assignedCandidates: { some: { jobId } } }, { jobMemberships: { some: { jobId } } }],
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true },
    }),
  ]);

  return {
    stages: stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
    })),
    assignedUsers,
    sources: [...new Set(candidates.map((candidate) => candidate.source))].sort(),
    cities: [...new Set(candidates.map((candidate) => candidate.currentCity))].sort(),
    noticePeriods: [...new Set(candidates.map((candidate) => candidate.noticePeriod))].sort(),
  };
}

export async function queryCandidates(
  jobId: string,
  filters: CandidateFilters = {},
): Promise<CandidateListItem[]> {
  await requireJobAccess(jobId);
  return listCandidatesForJob(jobId, filters);
}

export async function getCandidateBoardForJob(jobId: string): Promise<{
  stages: BoardStage[];
  candidates: BoardCandidate[];
  filters: BoardFilters;
}> {
  const [stageOptions, candidates, assignedUsers] = await Promise.all([
    prisma.jobStage.findMany({
      where: { jobId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        position: true,
      },
    }),
    prisma.candidate.findMany({
      where: { jobId },
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
        updatedAt: true,
        currentStageId: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ assignedCandidates: { some: { jobId } } }, { jobMemberships: { some: { jobId } } }],
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
      },
    }),
  ]);

  const boardCandidates = candidates.map((candidate) => ({
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
    updatedAt: candidate.updatedAt,
    currentStageId: candidate.currentStageId,
    assignedUser: candidate.assignedUser,
  }));

  return {
    stages: stageOptions,
    candidates: boardCandidates,
    filters: {
      assignedUsers,
      sources: [...new Set(boardCandidates.map((candidate) => candidate.source))].sort(),
      cities: [...new Set(boardCandidates.map((candidate) => candidate.currentCity))].sort(),
      noticePeriods: [
        ...new Set(boardCandidates.map((candidate) => candidate.noticePeriod)),
      ].sort(),
    },
  };
}

export async function listCandidateStageTimeline(
  jobId: string,
  candidateId: string,
): Promise<CandidateStageTimelineItem[]> {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId },
    select: { id: true },
  });

  if (!candidate) {
    return [];
  }

  return prisma.candidateStageHistory.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fromStage: {
        select: {
          id: true,
          name: true,
        },
      },
      toStage: {
        select: {
          id: true,
          name: true,
        },
      },
      movedBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      comment: true,
      createdAt: true,
    },
  });
}

export async function listCandidateAssignmentTimeline(
  jobId: string,
  candidateId: string,
): Promise<CandidateAssignmentTimelineItem[]> {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId },
    select: { id: true },
  });

  if (!candidate) {
    return [];
  }

  return prisma.candidateAssignmentHistory.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      previousAssignee: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      newAssignee: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      comment: true,
      createdAt: true,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function compactMetadata(metadata: Record<string, unknown> | null, isAdmin: boolean) {
  if (!metadata) {
    return null;
  }

  const hiddenKeys = new Set(["offeredCtc", "offerDate", "joiningDate", "previousResumeFilePath"]);

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => isAdmin || !hiddenKeys.has(key)),
  );
}

function formatAssignee(assignee: { username: string } | null) {
  return assignee ? `@${assignee.username}` : "Unassigned";
}

function summarizeAuditAction(
  action: AuditAction,
  metadata: Record<string, unknown> | null,
  isAdmin: boolean,
) {
  switch (action) {
    case "candidate_created":
      return {
        badge: "Created",
        title: "Candidate created",
        description: stringValue(metadata?.initialStage)
          ? `Initial stage: ${metadata?.initialStage}`
          : null,
      };
    case "candidate_applied":
      return {
        badge: "Applied",
        title: "Candidate applied via careers page",
        description: stringValue(metadata?.initialStage)
          ? `Initial stage: ${metadata?.initialStage}`
          : null,
      };
    case "candidate_updated":
      return { badge: "Updated", title: "Candidate details updated", description: null };
    case "candidate_resume_replaced":
      return {
        badge: "Resume",
        title: "Resume replaced",
        description: isAdmin ? stringValue(metadata?.resumeFileName) : null,
      };
    case "candidate_feedback_updated":
      return { badge: "Feedback", title: "Feedback updated", description: null };
    case "comment_created":
      return { badge: "Comment", title: "Comment added", description: null };
    case "comment_updated":
      return { badge: "Comment", title: "Comment updated", description: null };
    case "comment_deleted":
      return { badge: "Comment", title: "Comment deleted", description: null };
    case "offer_created":
      return {
        badge: "Offer",
        title: "Offer details added",
        description: isAdmin ? stringValue(metadata?.offerStatus) : null,
      };
    case "offer_updated":
      return {
        badge: "Offer",
        title: "Offer details updated",
        description: isAdmin ? stringValue(metadata?.offerStatus) : null,
      };
    default:
      return {
        badge: action.split("_")[0] ?? "Audit",
        title: action.replaceAll("_", " "),
        description: null,
      };
  }
}

export async function listCandidateHistoryTimeline(
  user: CurrentUser,
  jobId: string,
  candidateId: string,
): Promise<CandidateHistoryTimelineItem[]> {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId },
    select: { id: true, createdAt: true },
  });

  if (!candidate) {
    return [];
  }

  const [stageHistory, assignmentHistory, auditLogs] = await Promise.all([
    prisma.candidateStageHistory.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fromStage: { select: { name: true } },
        toStage: { select: { name: true } },
        movedBy: { select: { id: true, name: true, username: true } },
        comment: true,
        createdAt: true,
      },
    }),
    prisma.candidateAssignmentHistory.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        previousAssignee: { select: { id: true, name: true, username: true } },
        newAssignee: { select: { id: true, name: true, username: true } },
        assignedBy: { select: { id: true, name: true, username: true } },
        comment: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: "candidate", entityId: candidateId },
          { metadata: { path: ["candidateId"], equals: candidateId } },
        ],
        action: {
          notIn: ["candidate_stage_moved", "candidate_assigned", "notification_created"],
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, name: true, username: true } },
      },
    }),
  ]);

  const commentIds = auditLogs
    .filter((log) => log.entityType === "comment")
    .map((log) => log.entityId);

  const comments = commentIds.length
    ? await prisma.candidateComment.findMany({
        where: { id: { in: commentIds }, candidateId },
        select: {
          id: true,
          body: true,
          visibility: true,
          deletedAt: true,
        },
      })
    : [];

  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const isAdmin = user.role === "admin";

  const stageItems: CandidateHistoryTimelineItem[] = stageHistory.map((item) => ({
    id: `stage-${item.id}`,
    action: "stage_history",
    badge: "Stage",
    title: item.fromStage
      ? `${item.fromStage.name} -> ${item.toStage.name}`
      : `Created in ${item.toStage.name}`,
    description: item.comment,
    actor: item.movedBy,
    createdAt: item.createdAt,
    visibility: "public",
    metadata: null,
  }));

  const assignmentItems: CandidateHistoryTimelineItem[] = assignmentHistory.map((item) => ({
    id: `assignment-${item.id}`,
    action: "assignment_history",
    badge: "Assignment",
    title: `${formatAssignee(item.previousAssignee)} -> ${formatAssignee(item.newAssignee)}`,
    description: item.comment,
    actor: item.assignedBy,
    createdAt: item.createdAt,
    visibility: "public",
    metadata: null,
  }));

  const auditItems: CandidateHistoryTimelineItem[] = auditLogs
    .map((log) => {
      const metadata = isRecord(log.metadata) ? log.metadata : null;
      const summary = summarizeAuditAction(log.action, metadata, isAdmin);
      const comment = commentsById.get(log.entityId);
      const isAdminOnlyComment = comment?.visibility === "admin";
      const visibility: CandidateHistoryTimelineItem["visibility"] = isAdminOnlyComment
        ? "admin"
        : "public";
      const description =
        comment && !comment.deletedAt
          ? isAdmin || !isAdminOnlyComment
            ? comment.body
            : "Admin-only comment content hidden."
          : summary.description;

      if (!isAdmin && isAdminOnlyComment) {
        return {
          id: `audit-${log.id}`,
          action: log.action,
          badge: summary.badge,
          title: summary.title,
          description: "Admin-only comment content hidden.",
          actor: log.actor,
          createdAt: log.createdAt,
          visibility,
          metadata: compactMetadata(metadata, false),
        };
      }

      return {
        id: `audit-${log.id}`,
        action: log.action,
        badge: summary.badge,
        title: summary.title,
        description,
        actor: log.actor,
        createdAt: log.createdAt,
        visibility,
        metadata: compactMetadata(metadata, isAdmin),
      };
    })
    .filter((item) => isAdmin || item.action !== "offer_created" || item.description === null);

  return [...stageItems, ...assignmentItems, ...auditItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
