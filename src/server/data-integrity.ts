import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

export async function assertStageBelongsToJob(
  tx: Tx,
  input: { jobId: string; stageId: string },
) {
  const stage = await tx.jobStage.findFirst({
    where: {
      id: input.stageId,
      jobId: input.jobId,
    },
    select: { id: true },
  });

  if (!stage) {
    throw new Error("Stage does not belong to the candidate job.");
  }
}

export async function assertUserAttachedToJob(
  tx: Tx,
  input: { jobId: string; userId: string },
) {
  const jobUser = await tx.jobUser.findUnique({
    where: {
      jobId_userId: {
        jobId: input.jobId,
        userId: input.userId,
      },
    },
    select: { id: true },
  });

  if (!jobUser) {
    throw new Error("User is not attached to the job.");
  }
}

export async function assertCandidateAssigneeIsValid(
  tx: Tx,
  input: { jobId: string; assignedUserId?: string | null },
) {
  if (!input.assignedUserId) {
    return;
  }

  await assertUserAttachedToJob(tx, {
    jobId: input.jobId,
    userId: input.assignedUserId,
  });
}

export async function assertStageCanBeDeleted(tx: Tx, stageId: string) {
  const candidateCount = await tx.candidate.count({
    where: { currentStageId: stageId },
  });

  if (candidateCount > 0) {
    throw new Error("Stage cannot be deleted while candidates exist in it.");
  }
}
