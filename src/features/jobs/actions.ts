"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { DEFAULT_JOB_STAGES } from "@/features/jobs/constants";
import { sanitizeDescriptionHtml } from "@/lib/sanitize-html";
import {
  validateCreateJob,
  validateStageName,
  validateUpdateJob,
  type JobFieldErrors,
  type StageFieldErrors,
} from "@/features/jobs/validation";
import { assertStageCanBeDeleted } from "@/server/data-integrity";
import { writeAuditLog } from "@/server/audit";
import { requireAdmin } from "@/server/auth/session";

export type CreateJobState = {
  errors: JobFieldErrors;
  generic?: string;
};

export type UpdateJobState = {
  errors: JobFieldErrors;
  generic?: string;
};

export type CloseJobState = {
  error?: string;
};

export type SetJobPublishedState = {
  error?: string;
};

export type AttachJobUserState = {
  error?: string;
};

export type DetachJobUserState = {
  error?: string;
};

export type StageFormState = {
  errors: StageFieldErrors;
  generic?: string;
};

export type StageMutationState = {
  error?: string;
};

const EMPTY_ERRORS: JobFieldErrors = {};
const EMPTY_STAGE_ERRORS: StageFieldErrors = {};

export async function createJobAction(
  _previousState: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const admin = await requireAdmin();

  const { errors, input } = validateCreateJob({
    title: String(formData.get("title") ?? ""),
    description: sanitizeDescriptionHtml(String(formData.get("description") ?? "")),
  });

  if (!input) {
    return { errors };
  }

  let jobId: string;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: input.title,
          description: input.description,
          createdById: admin.id,
          stages: {
            create: DEFAULT_JOB_STAGES.map((name, index) => ({
              name,
              position: index + 1,
            })),
          },
        },
        select: { id: true, title: true, status: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_created",
        entityType: "job",
        entityId: job.id,
        metadata: {
          title: job.title,
          status: job.status,
          defaultStages: DEFAULT_JOB_STAGES,
        },
      });

      return job;
    });

    jobId = created.id;
  } catch (error) {
    console.error("createJobAction failed", error);
    return {
      errors: EMPTY_ERRORS,
      generic: "Could not create the job. Please try again.",
    };
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${jobId}`);
}

export async function updateJobAction(
  jobId: string,
  _previousState: UpdateJobState,
  formData: FormData,
): Promise<UpdateJobState> {
  const admin = await requireAdmin();

  const { errors, input } = validateUpdateJob({
    title: String(formData.get("title") ?? ""),
    description: sanitizeDescriptionHtml(String(formData.get("description") ?? "")),
    status: String(formData.get("status") ?? ""),
  });

  if (!input) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, description: true, status: true },
      });

      if (!before) {
        throw new Error("JOB_NOT_FOUND");
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
        },
        select: { id: true, title: true, description: true, status: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_updated",
        entityType: "job",
        entityId: updated.id,
        metadata: {
          before,
          after: updated,
        },
      });
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/careers");
    revalidatePath(`/careers/${jobId}`);
    return { errors: EMPTY_ERRORS };
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return {
        errors: EMPTY_ERRORS,
        generic: "This job no longer exists.",
      };
    }
    console.error("updateJobAction failed", error);
    return {
      errors: EMPTY_ERRORS,
      generic: "Could not update the job. Please try again.",
    };
  }
}

export async function closeJobAction(jobId: string): Promise<CloseJobState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, status: true },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (job.status === "closed") {
        return;
      }

      await tx.job.update({
        where: { id: jobId },
        data: { status: "closed" },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_closed",
        entityType: "job",
        entityId: job.id,
        metadata: {
          title: job.title,
          previousStatus: job.status,
          nextStatus: "closed",
        },
      });
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/careers");
    revalidatePath(`/careers/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return { error: "This job no longer exists." };
    }
    console.error("closeJobAction failed", error);
    return { error: "Could not close this job. Please try again." };
  }
}

export async function setJobPublishedAction(
  jobId: string,
  isPublished: boolean,
): Promise<SetJobPublishedState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, status: true, isPublished: true },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (isPublished && job.status === "closed") {
        throw new Error("JOB_CLOSED");
      }

      if (job.isPublished === isPublished) {
        return;
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data: { isPublished },
        select: { id: true, title: true, status: true, isPublished: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_updated",
        entityType: "job",
        entityId: updated.id,
        metadata: {
          before: { isPublished: job.isPublished },
          after: { isPublished: updated.isPublished },
          title: job.title,
        },
      });
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/careers");
    revalidatePath(`/careers/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return { error: "This job no longer exists." };
    }
    if (error instanceof Error && error.message === "JOB_CLOSED") {
      return { error: "Closed jobs cannot be listed on the careers page." };
    }
    console.error("setJobPublishedAction failed", error);
    return { error: "Could not update careers listing. Please try again." };
  }
}

export async function attachJobUserAction(
  jobId: string,
  _previousState: AttachJobUserState,
  formData: FormData,
): Promise<AttachJobUserState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "Select a user to attach." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [job, user, existing] = await Promise.all([
        tx.job.findUnique({
          where: { id: jobId },
          select: { id: true, title: true },
        }),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, username: true, isActive: true },
        }),
        tx.jobUser.findUnique({
          where: {
            jobId_userId: {
              jobId,
              userId,
            },
          },
          select: { id: true },
        }),
      ]);

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (!user || !user.isActive) {
        throw new Error("USER_NOT_FOUND");
      }

      if (existing) {
        throw new Error("USER_ALREADY_ATTACHED");
      }

      const membership = await tx.jobUser.create({
        data: {
          jobId,
          userId,
          attachedById: admin.id,
        },
        select: { id: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_user_attached",
        entityType: "job_user",
        entityId: membership.id,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          userId: user.id,
          username: user.username,
          name: user.name,
        },
      });
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "JOB_NOT_FOUND") {
        return { error: "This job no longer exists." };
      }
      if (error.message === "USER_NOT_FOUND") {
        return { error: "This user is no longer active or does not exist." };
      }
      if (error.message === "USER_ALREADY_ATTACHED") {
        return { error: "This user is already attached to the job." };
      }
    }

    console.error("attachJobUserAction failed", error);
    return { error: "Could not attach this user. Please try again." };
  }
}

export async function detachJobUserAction(
  jobId: string,
  userId: string,
): Promise<DetachJobUserState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.jobUser.findUnique({
        where: {
          jobId_userId: {
            jobId,
            userId,
          },
        },
        select: {
          id: true,
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      if (!membership) {
        throw new Error("MEMBERSHIP_NOT_FOUND");
      }

      await tx.jobUser.delete({
        where: { id: membership.id },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_user_detached",
        entityType: "job_user",
        entityId: membership.id,
        metadata: {
          jobId: membership.job.id,
          jobTitle: membership.job.title,
          userId: membership.user.id,
          username: membership.user.username,
          name: membership.user.name,
        },
      });
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "MEMBERSHIP_NOT_FOUND") {
      return { error: "This user is no longer attached to the job." };
    }

    console.error("detachJobUserAction failed", error);
    return { error: "Could not detach this user. Please try again." };
  }
}

export async function addJobStageAction(
  jobId: string,
  _previousState: StageFormState,
  formData: FormData,
): Promise<StageFormState> {
  const admin = await requireAdmin();
  const { errors, name } = validateStageName(String(formData.get("name") ?? ""));

  if (!name) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      const existing = await tx.jobStage.findFirst({
        where: { jobId, name },
        select: { id: true },
      });

      if (existing) {
        throw new Error("STAGE_NAME_EXISTS");
      }

      const lastStage = await tx.jobStage.findFirst({
        where: { jobId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const stage = await tx.jobStage.create({
        data: {
          jobId,
          name,
          position: (lastStage?.position ?? 0) + 1,
        },
        select: { id: true, name: true, position: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "stage_created",
        entityType: "job_stage",
        entityId: stage.id,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          name: stage.name,
          position: stage.position,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    return { errors: EMPTY_STAGE_ERRORS };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "JOB_NOT_FOUND") {
        return { errors: EMPTY_STAGE_ERRORS, generic: "This job no longer exists." };
      }
      if (error.message === "STAGE_NAME_EXISTS") {
        return { errors: { name: "A stage with this name already exists." } };
      }
    }

    console.error("addJobStageAction failed", error);
    return {
      errors: EMPTY_STAGE_ERRORS,
      generic: "Could not add the stage. Please try again.",
    };
  }
}

export async function renameJobStageAction(
  jobId: string,
  stageId: string,
  _previousState: StageFormState,
  formData: FormData,
): Promise<StageFormState> {
  const admin = await requireAdmin();
  const { errors, name } = validateStageName(String(formData.get("name") ?? ""));

  if (!name) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const stage = await tx.jobStage.findFirst({
        where: { id: stageId, jobId },
        select: {
          id: true,
          name: true,
          position: true,
          job: { select: { id: true, title: true } },
        },
      });

      if (!stage) {
        throw new Error("STAGE_NOT_FOUND");
      }

      const existing = await tx.jobStage.findFirst({
        where: { jobId, name, NOT: { id: stageId } },
        select: { id: true },
      });

      if (existing) {
        throw new Error("STAGE_NAME_EXISTS");
      }

      const updated = await tx.jobStage.update({
        where: { id: stageId },
        data: { name },
        select: { id: true, name: true, position: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "stage_updated",
        entityType: "job_stage",
        entityId: updated.id,
        metadata: {
          jobId: stage.job.id,
          jobTitle: stage.job.title,
          previousName: stage.name,
          nextName: updated.name,
          position: updated.position,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    return { errors: EMPTY_STAGE_ERRORS };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "STAGE_NOT_FOUND") {
        return { errors: EMPTY_STAGE_ERRORS, generic: "This stage no longer exists." };
      }
      if (error.message === "STAGE_NAME_EXISTS") {
        return { errors: { name: "A stage with this name already exists." } };
      }
    }

    console.error("renameJobStageAction failed", error);
    return {
      errors: EMPTY_STAGE_ERRORS,
      generic: "Could not rename the stage. Please try again.",
    };
  }
}

export async function reorderJobStagesAction(
  jobId: string,
  orderedStageIds: string[],
): Promise<StageMutationState> {
  const admin = await requireAdmin();

  if (orderedStageIds.length === 0) {
    return { error: "Stage order cannot be empty." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      const stages = await tx.jobStage.findMany({
        where: { jobId },
        orderBy: { position: "asc" },
        select: { id: true, name: true, position: true },
      });

      const existingIds = new Set(stages.map((stage) => stage.id));
      const inputIds = new Set(orderedStageIds);

      if (
        existingIds.size !== inputIds.size ||
        orderedStageIds.some((id) => !existingIds.has(id))
      ) {
        throw new Error("INVALID_STAGE_ORDER");
      }

      for (const [index, stageId] of orderedStageIds.entries()) {
        await tx.jobStage.update({
          where: { id: stageId },
          data: { position: -(index + 1) },
        });
      }

      for (const [index, stageId] of orderedStageIds.entries()) {
        await tx.jobStage.update({
          where: { id: stageId },
          data: { position: index + 1 },
        });
      }

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "stage_reordered",
        entityType: "job",
        entityId: job.id,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          previousOrder: stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            position: stage.position,
          })),
          nextOrder: orderedStageIds.map((id, index) => ({ id, position: index + 1 })),
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "JOB_NOT_FOUND") {
        return { error: "This job no longer exists." };
      }
      if (error.message === "INVALID_STAGE_ORDER") {
        return { error: "Stage order is out of date. Refresh and try again." };
      }
    }

    console.error("reorderJobStagesAction failed", error);
    return { error: "Could not reorder stages. Please try again." };
  }
}

export async function deleteJobStageAction(
  jobId: string,
  stageId: string,
): Promise<StageMutationState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const stage = await tx.jobStage.findFirst({
        where: { id: stageId, jobId },
        select: {
          id: true,
          name: true,
          position: true,
          job: { select: { id: true, title: true } },
        },
      });

      if (!stage) {
        throw new Error("STAGE_NOT_FOUND");
      }

      await assertStageCanBeDeleted(tx, stage.id);

      await tx.jobStage.delete({
        where: { id: stage.id },
      });

      const remainingStages = await tx.jobStage.findMany({
        where: { jobId },
        orderBy: { position: "asc" },
        select: { id: true },
      });

      for (const [index, remainingStage] of remainingStages.entries()) {
        await tx.jobStage.update({
          where: { id: remainingStage.id },
          data: { position: index + 1 },
        });
      }

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "stage_deleted",
        entityType: "job_stage",
        entityId: stage.id,
        metadata: {
          jobId: stage.job.id,
          jobTitle: stage.job.title,
          name: stage.name,
          position: stage.position,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "STAGE_NOT_FOUND") {
        return { error: "This stage no longer exists." };
      }
      if (error.message === "Stage cannot be deleted while candidates exist in it.") {
        return { error: "Only empty stages can be deleted." };
      }
    }

    console.error("deleteJobStageAction failed", error);
    return { error: "Could not delete this stage. Please try again." };
  }
}
