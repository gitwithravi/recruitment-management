import "server-only";

import { prisma } from "@/db/client";
import type { ApplicationQuestion } from "@/features/questions/rules";

export async function listJobQuestions(jobId: string): Promise<ApplicationQuestion[]> {
  return prisma.jobQuestion.findMany({
    where: { jobId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      label: true,
      type: true,
      options: true,
      required: true,
      position: true,
    },
  });
}
