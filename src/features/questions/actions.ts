"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import {
  MAX_QUESTIONS_PER_JOB,
  validateQuestionInput,
  type QuestionFieldErrors,
} from "@/features/questions/rules";
import { writeAuditLog } from "@/server/audit";
import { requireAdmin } from "@/server/auth/session";

export type QuestionFormState = {
  errors: QuestionFieldErrors;
  generic?: string;
};

export type QuestionMutationState = {
  error?: string;
};

const EMPTY_ERRORS: QuestionFieldErrors = {};

function readQuestionForm(formData: FormData) {
  return validateQuestionInput({
    label: String(formData.get("label") ?? ""),
    type: String(formData.get("type") ?? ""),
    options: String(formData.get("options") ?? ""),
    required: formData.get("required") === "on",
  });
}

function revalidateQuestionPaths(jobId: string) {
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/careers/${jobId}`);
}

export async function createJobQuestionAction(
  jobId: string,
  _previousState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const admin = await requireAdmin();
  const { errors, input } = readQuestionForm(formData);

  if (!input) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, _count: { select: { questions: true } } },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (job._count.questions >= MAX_QUESTIONS_PER_JOB) {
        throw new Error("TOO_MANY_QUESTIONS");
      }

      const last = await tx.jobQuestion.findFirst({
        where: { jobId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const question = await tx.jobQuestion.create({
        data: { jobId, ...input, position: (last?.position ?? 0) + 1 },
        select: { id: true, label: true, type: true, required: true, position: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_question_created",
        entityType: "job_question",
        entityId: question.id,
        metadata: { jobId, ...question },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "JOB_NOT_FOUND") {
        return { errors: EMPTY_ERRORS, generic: "This job no longer exists." };
      }
      if (error.message === "TOO_MANY_QUESTIONS") {
        return {
          errors: EMPTY_ERRORS,
          generic: `A job can have at most ${MAX_QUESTIONS_PER_JOB} questions.`,
        };
      }
    }

    console.error("createJobQuestionAction failed", error);
    return { errors: EMPTY_ERRORS, generic: "Could not add the question. Please try again." };
  }

  revalidateQuestionPaths(jobId);
  return { errors: EMPTY_ERRORS };
}

export async function updateJobQuestionAction(
  jobId: string,
  questionId: string,
  _previousState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const admin = await requireAdmin();
  const { errors, input } = readQuestionForm(formData);

  if (!input) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.jobQuestion.findFirst({
        where: { id: questionId, jobId },
        select: { label: true, type: true, options: true, required: true },
      });

      if (!before) {
        throw new Error("QUESTION_NOT_FOUND");
      }

      const after = await tx.jobQuestion.update({
        where: { id: questionId },
        data: input,
        select: { label: true, type: true, options: true, required: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_question_updated",
        entityType: "job_question",
        entityId: questionId,
        metadata: { jobId, before, after },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUESTION_NOT_FOUND") {
      return { errors: EMPTY_ERRORS, generic: "This question no longer exists." };
    }

    console.error("updateJobQuestionAction failed", error);
    return { errors: EMPTY_ERRORS, generic: "Could not save the question. Please try again." };
  }

  revalidateQuestionPaths(jobId);
  return { errors: EMPTY_ERRORS };
}

export async function deleteJobQuestionAction(
  jobId: string,
  questionId: string,
): Promise<QuestionMutationState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const question = await tx.jobQuestion.findFirst({
        where: { id: questionId, jobId },
        select: { id: true, label: true, type: true },
      });

      if (!question) {
        throw new Error("QUESTION_NOT_FOUND");
      }

      await tx.jobQuestion.delete({ where: { id: questionId } });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_question_deleted",
        entityType: "job_question",
        entityId: questionId,
        metadata: { jobId, label: question.label, type: question.type },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUESTION_NOT_FOUND") {
      return { error: "This question no longer exists." };
    }

    console.error("deleteJobQuestionAction failed", error);
    return { error: "Could not delete the question. Please try again." };
  }

  revalidateQuestionPaths(jobId);
  return {};
}

export async function moveJobQuestionAction(
  jobId: string,
  questionId: string,
  direction: "up" | "down",
): Promise<QuestionMutationState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const questions = await tx.jobQuestion.findMany({
        where: { jobId },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });

      const index = questions.findIndex((question) => question.id === questionId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (index === -1) {
        throw new Error("QUESTION_NOT_FOUND");
      }

      if (swapIndex < 0 || swapIndex >= questions.length) {
        return;
      }

      const current = questions[index];
      const other = questions[swapIndex];

      await tx.jobQuestion.update({
        where: { id: current.id },
        data: { position: other.position },
      });
      await tx.jobQuestion.update({
        where: { id: other.id },
        data: { position: current.position },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "job_question_updated",
        entityType: "job_question",
        entityId: current.id,
        metadata: { jobId, moved: direction, from: current.position, to: other.position },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUESTION_NOT_FOUND") {
      return { error: "This question no longer exists." };
    }

    console.error("moveJobQuestionAction failed", error);
    return { error: "Could not reorder the question. Please try again." };
  }

  revalidateQuestionPaths(jobId);
  return {};
}
