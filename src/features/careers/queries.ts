import "server-only";

import { prisma } from "@/db/client";
import { sanitizeDescriptionHtml, stripHtmlToText } from "@/lib/sanitize-html";
import { canAcceptPublicApplications, truncatePlainText } from "@/features/careers/rules";
import { JOB_POSTING_SELECT, startOfUtcDay, type JobPostingFields } from "@/features/jobs/posting";
import type { ApplicationQuestion } from "@/features/questions/rules";

export type PublicJobListItem = JobPostingFields & {
  id: string;
  title: string;
  excerpt: string;
  searchText: string;
};

export type PublicJobDetail = JobPostingFields & {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  isPublished: boolean;
  stageCount: number;
  acceptsApplications: boolean;
  createdAt: Date;
  questions: ApplicationQuestion[];
};

export async function listPublishedJobs(): Promise<PublicJobListItem[]> {
  const jobs = await prisma.job.findMany({
    where: {
      status: "open",
      isPublished: true,
      OR: [{ applyBy: null }, { applyBy: { gte: startOfUtcDay() } }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      ...JOB_POSTING_SELECT,
    },
  });

  return jobs.map(({ description, ...job }) => {
    const searchText = stripHtmlToText(sanitizeDescriptionHtml(description));
    return {
      ...job,
      excerpt: truncatePlainText(searchText),
      searchText,
    };
  });
}

export async function getPublicJob(jobId: string): Promise<PublicJobDetail | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      isPublished: true,
      createdAt: true,
      ...JOB_POSTING_SELECT,
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          label: true,
          type: true,
          options: true,
          required: true,
          position: true,
        },
      },
      _count: {
        select: { stages: true },
      },
    },
  });

  if (!job) {
    return null;
  }

  const { _count, description, ...rest } = job;

  return {
    ...rest,
    description: sanitizeDescriptionHtml(description),
    stageCount: _count.stages,
    acceptsApplications: canAcceptPublicApplications({
      status: job.status,
      isPublished: job.isPublished,
      applyBy: job.applyBy,
      stageCount: _count.stages,
    }),
  };
}

export async function hasAppliedWithEmail(jobId: string, email: string) {
  const existing = await prisma.candidate.findUnique({
    where: {
      jobId_email: {
        jobId,
        email,
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}
