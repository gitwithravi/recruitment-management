"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { writeAuditLog } from "@/server/audit";
import { requireJobAccess } from "@/server/auth/session";
import { deleteStoredFile, saveResumeFile } from "@/server/storage";
import {
  validateCandidateFields,
  validateResumeFile,
  type CandidateFieldErrors,
} from "@/features/candidates/validation";

export type CandidateFormState = {
  errors: CandidateFieldErrors;
  generic?: string;
};

export type ResumeReplaceState = {
  error?: string;
};

export type MoveCandidateState = {
  error?: string;
};

const EMPTY_ERRORS: CandidateFieldErrors = {};

function getResumeFromForm(formData: FormData) {
  const file = formData.get("resume");
  return file instanceof File ? file : null;
}

function validateCandidateForm(formData: FormData) {
  return validateCandidateFields({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    totalExperience: String(formData.get("totalExperience") ?? ""),
    relevantExperience: String(formData.get("relevantExperience") ?? ""),
    currentCity: String(formData.get("currentCity") ?? ""),
    currentCtc: String(formData.get("currentCtc") ?? ""),
    expectedCtc: String(formData.get("expectedCtc") ?? ""),
    noticePeriod: String(formData.get("noticePeriod") ?? ""),
    source: String(formData.get("source") ?? ""),
    feedback: String(formData.get("feedback") ?? ""),
  });
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createCandidateAction(
  jobId: string,
  _previousState: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const user = await requireJobAccess(jobId);
  const { errors, input } = validateCandidateForm(formData);
  const resume = getResumeFromForm(formData);
  const resumeError = validateResumeFile(resume, { required: true });

  if (resumeError) {
    errors.resume = resumeError;
  }

  if (!input || Object.keys(errors).length > 0 || !resume) {
    return { errors };
  }

  const candidateId = randomUUID();
  let resumePath: string | null = null;

  try {
    const savedResume = await saveResumeFile({ jobId, candidateId, file: resume });
    resumePath = savedResume.relativePath;

    await prisma.$transaction(async (tx) => {
      const firstStage = await tx.jobStage.findFirst({
        where: { jobId },
        orderBy: { position: "asc" },
        select: { id: true, name: true },
      });

      if (!firstStage) {
        throw new Error("NO_STAGES");
      }

      const existing = await tx.candidate.findFirst({
        where: {
          jobId,
          OR: [{ email: input.email }, { phone: input.phone }],
        },
        select: { email: true, phone: true },
      });

      if (existing?.email === input.email) {
        throw new Error("DUPLICATE_EMAIL");
      }

      if (existing?.phone === input.phone) {
        throw new Error("DUPLICATE_PHONE");
      }

      const candidate = await tx.candidate.create({
        data: {
          id: candidateId,
          jobId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          totalExperience: input.totalExperience,
          relevantExperience: input.relevantExperience,
          currentCity: input.currentCity,
          currentCtc: input.currentCtc,
          expectedCtc: input.expectedCtc,
          noticePeriod: input.noticePeriod,
          resumeFilePath: savedResume.relativePath,
          source: input.source,
          currentStageId: firstStage.id,
          feedback: user.role === "admin" ? input.feedback : null,
          createdById: user.id,
        },
        select: { id: true, name: true, email: true, phone: true },
      });

      await tx.candidateStageHistory.create({
        data: {
          candidateId: candidate.id,
          fromStageId: null,
          toStageId: firstStage.id,
          movedById: user.id,
          comment: "Candidate created.",
        },
      });

      await writeAuditLog(tx, {
        actorId: user.id,
        action: "candidate_created",
        entityType: "candidate",
        entityId: candidate.id,
        metadata: {
          jobId,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          initialStage: firstStage.name,
          resumeFileName: savedResume.fileName,
          resumeFileSize: savedResume.size,
        },
      });
    });
  } catch (error) {
    if (resumePath) {
      await deleteStoredFile(resumePath);
    }

    if (error instanceof Error) {
      if (error.message === "NO_STAGES") {
        return {
          errors: EMPTY_ERRORS,
          generic: "Add at least one stage before creating candidates.",
        };
      }
      if (error.message === "DUPLICATE_EMAIL") {
        return { errors: { email: "A candidate with this email already exists in this job." } };
      }
      if (error.message === "DUPLICATE_PHONE") {
        return { errors: { phone: "A candidate with this phone already exists in this job." } };
      }
    }

    if (isUniqueConstraintError(error)) {
      return {
        errors: EMPTY_ERRORS,
        generic: "A candidate with this email or phone already exists in this job.",
      };
    }

    console.error("createCandidateAction failed", error);
    return { errors: EMPTY_ERRORS, generic: "Could not create the candidate. Please try again." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/candidates`);
  redirect(`/jobs/${jobId}/candidates/${candidateId}`);
}

export async function updateCandidateAction(
  jobId: string,
  candidateId: string,
  _previousState: CandidateFormState,
  formData: FormData,
): Promise<CandidateFormState> {
  const user = await requireJobAccess(jobId);
  const { errors, input } = validateCandidateForm(formData);

  if (!input) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.candidate.findFirst({
        where: { id: candidateId, jobId },
        select: {
          id: true,
          email: true,
          phone: true,
          assignedUserId: true,
          feedback: true,
        },
      });

      if (!existing) {
        throw new Error("CANDIDATE_NOT_FOUND");
      }

      const duplicate = await tx.candidate.findFirst({
        where: {
          jobId,
          NOT: { id: candidateId },
          OR: [{ email: input.email }, { phone: input.phone }],
        },
        select: { email: true, phone: true },
      });

      if (duplicate?.email === input.email) {
        throw new Error("DUPLICATE_EMAIL");
      }

      if (duplicate?.phone === input.phone) {
        throw new Error("DUPLICATE_PHONE");
      }

      const canEditFeedback = user.role === "admin" || existing.assignedUserId === user.id;

      const updated = await tx.candidate.update({
        where: { id: candidateId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          totalExperience: input.totalExperience,
          relevantExperience: input.relevantExperience,
          currentCity: input.currentCity,
          currentCtc: input.currentCtc,
          expectedCtc: input.expectedCtc,
          noticePeriod: input.noticePeriod,
          source: input.source,
          ...(canEditFeedback ? { feedback: input.feedback } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          feedback: true,
        },
      });

      await writeAuditLog(tx, {
        actorId: user.id,
        action:
          canEditFeedback && existing.feedback !== updated.feedback
            ? "candidate_feedback_updated"
            : "candidate_updated",
        entityType: "candidate",
        entityId: updated.id,
        metadata: {
          jobId,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          feedbackUpdated: canEditFeedback && existing.feedback !== updated.feedback,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}/candidates`);
    revalidatePath(`/jobs/${jobId}/candidates/${candidateId}`);
    return { errors: EMPTY_ERRORS };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CANDIDATE_NOT_FOUND") {
        return { errors: EMPTY_ERRORS, generic: "This candidate no longer exists." };
      }
      if (error.message === "DUPLICATE_EMAIL") {
        return { errors: { email: "A candidate with this email already exists in this job." } };
      }
      if (error.message === "DUPLICATE_PHONE") {
        return { errors: { phone: "A candidate with this phone already exists in this job." } };
      }
    }

    if (isUniqueConstraintError(error)) {
      return {
        errors: EMPTY_ERRORS,
        generic: "A candidate with this email or phone already exists in this job.",
      };
    }

    console.error("updateCandidateAction failed", error);
    return { errors: EMPTY_ERRORS, generic: "Could not update the candidate. Please try again." };
  }
}

export async function replaceCandidateResumeAction(
  jobId: string,
  candidateId: string,
  _previousState: ResumeReplaceState,
  formData: FormData,
): Promise<ResumeReplaceState> {
  const user = await requireJobAccess(jobId);
  const resume = getResumeFromForm(formData);
  const resumeError = validateResumeFile(resume, { required: true });

  if (resumeError || !resume) {
    return { error: resumeError ?? "Resume file is required." };
  }

  let newResumePath: string | null = null;

  try {
    const existing = await prisma.candidate.findFirst({
      where: { id: candidateId, jobId },
      select: { id: true, name: true, resumeFilePath: true },
    });

    if (!existing) {
      return { error: "This candidate no longer exists." };
    }

    const savedResume = await saveResumeFile({ jobId, candidateId, file: resume });
    newResumePath = savedResume.relativePath;

    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id: candidateId },
        data: { resumeFilePath: savedResume.relativePath },
      });

      await writeAuditLog(tx, {
        actorId: user.id,
        action: "candidate_resume_replaced",
        entityType: "candidate",
        entityId: candidateId,
        metadata: {
          jobId,
          name: existing.name,
          previousResumeFilePath: existing.resumeFilePath,
          resumeFileName: savedResume.fileName,
          resumeFileSize: savedResume.size,
        },
      });
    });

    await deleteStoredFile(existing.resumeFilePath);
    revalidatePath(`/jobs/${jobId}/candidates/${candidateId}`);
    return {};
  } catch (error) {
    if (newResumePath) {
      await deleteStoredFile(newResumePath);
    }
    console.error("replaceCandidateResumeAction failed", error);
    return { error: "Could not replace the resume. Please try again." };
  }
}

export async function moveCandidateAction(
  jobId: string,
  candidateId: string,
  toStageId: string,
  comment: string,
): Promise<MoveCandidateState> {
  const user = await requireJobAccess(jobId);
  const trimmedComment = comment.trim();

  if (!toStageId) {
    return { error: "Select a target stage." };
  }

  if (trimmedComment.length > 5000) {
    return { error: "Movement comment must be 5,000 characters or fewer." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.findFirst({
        where: { id: candidateId, jobId },
        select: {
          id: true,
          name: true,
          currentStageId: true,
          assignedUserId: true,
          currentStage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!candidate) {
        throw new Error("CANDIDATE_NOT_FOUND");
      }

      if (user.role !== "admin" && candidate.assignedUserId !== user.id) {
        throw new Error("MOVE_NOT_ALLOWED");
      }

      const toStage = await tx.jobStage.findFirst({
        where: { id: toStageId, jobId },
        select: { id: true, name: true },
      });

      if (!toStage) {
        throw new Error("STAGE_NOT_FOUND");
      }

      if (candidate.currentStageId === toStage.id) {
        throw new Error("SAME_STAGE");
      }

      await tx.candidate.update({
        where: { id: candidate.id },
        data: { currentStageId: toStage.id },
      });

      const history = await tx.candidateStageHistory.create({
        data: {
          candidateId: candidate.id,
          fromStageId: candidate.currentStageId,
          toStageId: toStage.id,
          movedById: user.id,
          comment: trimmedComment || null,
        },
        select: { id: true },
      });

      let commentId: string | null = null;
      if (trimmedComment) {
        const createdComment = await tx.candidateComment.create({
          data: {
            candidateId: candidate.id,
            authorId: user.id,
            body: trimmedComment,
            visibility: "job",
          },
          select: { id: true },
        });
        commentId = createdComment.id;
      }

      await writeAuditLog(tx, {
        actorId: user.id,
        action: "candidate_stage_moved",
        entityType: "candidate",
        entityId: candidate.id,
        metadata: {
          jobId,
          candidateName: candidate.name,
          fromStageId: candidate.currentStage.id,
          fromStageName: candidate.currentStage.name,
          toStageId: toStage.id,
          toStageName: toStage.name,
          stageHistoryId: history.id,
          commentId,
        },
      });
    });

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}/board`);
    revalidatePath(`/jobs/${jobId}/candidates`);
    revalidatePath(`/jobs/${jobId}/candidates/${candidateId}`);
    return {};
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CANDIDATE_NOT_FOUND") {
        return { error: "This candidate no longer exists." };
      }
      if (error.message === "MOVE_NOT_ALLOWED") {
        return { error: "Only admins or the assigned user can move this candidate." };
      }
      if (error.message === "STAGE_NOT_FOUND") {
        return { error: "The target stage is no longer available." };
      }
      if (error.message === "SAME_STAGE") {
        return { error: "Candidate is already in that stage." };
      }
    }

    console.error("moveCandidateAction failed", error);
    return { error: "Could not move this candidate. Please try again." };
  }
}
