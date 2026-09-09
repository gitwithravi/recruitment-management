import "server-only";

import { prisma } from "@/db/client";
import { sanitizeDescriptionHtml, stripHtmlToText } from "@/lib/sanitize-html";
import { canAcceptPublicApplications, truncatePlainText } from "@/features/careers/rules";

export type PublicJobListItem = {
  id: string;
  title: string;
  excerpt: string;
};

export type PublicJobDetail = {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  isPublished: boolean;
  stageCount: number;
  acceptsApplications: boolean;
};

export async function listPublishedJobs(): Promise<PublicJobListItem[]> {
  const jobs = await prisma.job.findMany({
    where: {
      status: "open",
      isPublished: true,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    excerpt: truncatePlainText(stripHtmlToText(sanitizeDescriptionHtml(job.description))),
  }));
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
      _count: {
        select: { stages: true },
      },
    },
  });

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    title: job.title,
    description: sanitizeDescriptionHtml(job.description),
    status: job.status,
    isPublished: job.isPublished,
    stageCount: job._count.stages,
    acceptsApplications: canAcceptPublicApplications({
      status: job.status,
      isPublished: job.isPublished,
      stageCount: job._count.stages,
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
