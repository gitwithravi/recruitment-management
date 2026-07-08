"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { DEFAULT_JOB_STAGES } from "@/features/jobs/constants";
import {
  validateCreateJob,
  validateUpdateJob,
  type JobFieldErrors,
} from "@/features/jobs/validation";
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

export type AttachJobUserState = {
  error?: string;
};

export type DetachJobUserState = {
  error?: string;
};

const EMPTY_ERRORS: JobFieldErrors = {};

export async function createJobAction(
  _previousState: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const admin = await requireAdmin();

  const { errors, input } = validateCreateJob({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
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
    description: String(formData.get("description") ?? ""),
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
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return { error: "This job no longer exists." };
    }
    console.error("closeJobAction failed", error);
    return { error: "Could not close this job. Please try again." };
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
