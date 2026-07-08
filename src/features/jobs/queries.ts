import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type JobStatusFilter = "all" | "open" | "closed";

export type JobListItem = {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  stageCount: number;
  candidateCount: number;
  attachedUserCount: number;
};

export type JobDetail = JobListItem & {
  stages: {
    id: string;
    name: string;
    position: number;
    candidateCount: number;
  }[];
  attachedUsers: {
    id: string;
    name: string;
    username: string;
    email: string;
  }[];
};

export type AssignableJobUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
};

function statusWhere(status: JobStatusFilter) {
  return status === "all" ? {} : { status };
}

function toJobListItem(job: {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  _count: {
    stages: number;
    candidates: number;
    users: number;
  };
}): JobListItem {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    createdBy: job.createdBy,
    stageCount: job._count.stages,
    candidateCount: job._count.candidates,
    attachedUserCount: job._count.users,
  };
}

export async function listJobsForUser(
  user: CurrentUser,
  status: JobStatusFilter = "all",
): Promise<JobListItem[]> {
  const jobs = await prisma.job.findMany({
    where: {
      ...statusWhere(status),
      ...(user.role === "admin" ? {} : { users: { some: { userId: user.id } } }),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      _count: {
        select: {
          stages: true,
          candidates: true,
          users: true,
        },
      },
    },
  });

  return jobs.map(toJobListItem);
}

export async function getJobForUser(user: CurrentUser, jobId: string): Promise<JobDetail | null> {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      ...(user.role === "admin" ? {} : { users: { some: { userId: user.id } } }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      stages: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          _count: {
            select: {
              candidates: true,
            },
          },
        },
      },
      users: {
        orderBy: { createdAt: "asc" },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          stages: true,
          candidates: true,
          users: true,
        },
      },
    },
  });

  if (!job) {
    return null;
  }

  return {
    ...toJobListItem(job),
    stages: job.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
      candidateCount: stage._count.candidates,
    })),
    attachedUsers: job.users.map((membership) => membership.user),
  };
}

export async function listAssignableUsersForJob(jobId: string): Promise<AssignableJobUser[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      jobMemberships: {
        none: { jobId },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  });

  return users;
}
