"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { writeAuditLog, writeCandidateHistory } from "@/server/audit";
import { deleteStoredFile, saveResumeFile } from "@/server/storage";
import { dispatchApplicationNotifications } from "@/server/notifications/dispatch";
import { isEmailConfigured, sendEmail } from "@/server/notifications/email";
import { SlidingWindowLimiter, formatRetryAfter, getClientIp } from "@/server/auth/rate-limit";
import { findCandidateDuplicate } from "@/features/candidates/rules";
import {
  validateCandidateFields,
  validateResumeFile,
  type CandidateFieldErrors,
} from "@/features/candidates/validation";
import {
  ALREADY_APPLIED_MESSAGE,
  APPLICATIONS_UNAVAILABLE_MESSAGE,
  APPLY_SUBMIT_PER_IP,
  CONSENT_REQUIRED_MESSAGE,
  EMAIL_MISMATCH_MESSAGE,
  JOB_NOT_ACCEPTING_MESSAGE,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_SEND_PER_EMAIL,
  OTP_SEND_PER_IP,
  PUBLIC_APPLICATION_SOURCE,
  PUBLIC_APPLY_STAGE_COMMENT,
  RATE_LIMIT_WINDOW_MS,
  VERIFY_EMAIL_REQUIRED_MESSAGE,
} from "@/features/careers/constants";
import {
  generateOtpCode,
  hashOtpCode,
  normalizeOtpCode,
  otpHashesMatch,
} from "@/features/careers/otp";
import { getPublicJob, hasAppliedWithEmail } from "@/features/careers/queries";
import { getAppName } from "@/features/settings/queries";
import {
  buildApplicationConfirmationEmail,
  canAcceptPublicApplications,
  emailsMatch,
  evaluateOtpChallenge,
  isHoneypotFilled,
  selectApplicationNotificationRecipients,
  validateApplyEmail,
} from "@/features/careers/rules";
import {
  clearVerifiedApplyEmailCookie,
  getVerifiedApplyEmail,
  setVerifiedApplyEmailCookie,
} from "@/features/careers/session";
import { getAuthSecret } from "@/features/careers/verified-email";
import {
  isConsentGiven,
  questionFieldName,
  validateApplicationAnswers,
} from "@/features/questions/rules";

export type SendApplyOtpState = {
  error?: string;
  sent?: boolean;
  email?: string;
};

export type VerifyApplyOtpState = {
  error?: string;
  email?: string;
};

export type ApplyToJobState = {
  errors: CandidateFieldErrors;
  answerErrors?: Record<string, string>;
  consentError?: string;
  generic?: string;
};

const EMPTY_ERRORS: CandidateFieldErrors = {};
const otpEmailLimiter = new SlidingWindowLimiter(OTP_SEND_PER_EMAIL, RATE_LIMIT_WINDOW_MS);
const otpIpLimiter = new SlidingWindowLimiter(OTP_SEND_PER_IP, RATE_LIMIT_WINDOW_MS);
const applyIpLimiter = new SlidingWindowLimiter(APPLY_SUBMIT_PER_IP, RATE_LIMIT_WINDOW_MS);

function getResumeFromForm(formData: FormData) {
  const file = formData.get("resume");
  return file instanceof File ? file : null;
}

async function getRequestIp() {
  const headerStore = await headers();
  return getClientIp({
    forwardedFor: headerStore.get("x-forwarded-for"),
    realIp: headerStore.get("x-real-ip"),
  });
}

async function getAcceptingJob(jobId: string) {
  const job = await getPublicJob(jobId);

  if (
    !job ||
    !canAcceptPublicApplications({
      status: job.status,
      isPublished: job.isPublished,
      applyBy: job.applyBy,
      stageCount: job.stageCount,
    })
  ) {
    return null;
  }

  return job;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function sendApplyOtpAction(
  jobId: string,
  _previousState: SendApplyOtpState,
  formData: FormData,
): Promise<SendApplyOtpState> {
  const { error, email } = validateApplyEmail(String(formData.get("email") ?? ""));

  if (error) {
    return { error };
  }

  if (isHoneypotFilled(formData.get("website"))) {
    return { sent: true, email };
  }

  const job = await getAcceptingJob(jobId);
  if (!job) {
    return { error: JOB_NOT_ACCEPTING_MESSAGE };
  }

  if (!isEmailConfigured()) {
    return { error: APPLICATIONS_UNAVAILABLE_MESSAGE };
  }

  const ip = await getRequestIp();
  const emailLimit = otpEmailLimiter.consume(`otp-email:${email}`);
  const ipLimit = otpIpLimiter.consume(`otp-ip:${ip}`);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    return { error: formatRetryAfter(retryAfter) };
  }

  const code = generateOtpCode();
  const now = new Date();

  await prisma.emailOtp.updateMany({
    where: {
      email,
      verifiedAt: null,
      consumedAt: null,
    },
    data: {
      expiresAt: now,
    },
  });

  await prisma.emailOtp.create({
    data: {
      email,
      codeHash: hashOtpCode({ code, email, secret: getAuthSecret() }),
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
      ip,
    },
  });

  const sent = await sendEmail({
    to: email,
    subject: `${await getAppName()} verification code`,
    body: `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
  });

  if (!sent) {
    return { error: APPLICATIONS_UNAVAILABLE_MESSAGE };
  }

  return { sent: true, email };
}

export async function verifyApplyOtpAction(
  jobId: string,
  _previousState: VerifyApplyOtpState,
  formData: FormData,
): Promise<VerifyApplyOtpState> {
  const { error, email } = validateApplyEmail(String(formData.get("email") ?? ""));
  const code = normalizeOtpCode(String(formData.get("code") ?? ""));

  if (error) {
    return { error, email };
  }

  if (code.length !== 6) {
    return { error: "Enter the 6-digit verification code.", email };
  }

  const job = await getAcceptingJob(jobId);
  if (!job) {
    return { error: JOB_NOT_ACCEPTING_MESSAGE, email };
  }

  const challenge = await prisma.emailOtp.findFirst({
    where: {
      email,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return { error: "Request a new verification code.", email };
  }

  const status = evaluateOtpChallenge(challenge);

  if (status === "expired" || status === "exhausted") {
    return { error: "This code is no longer valid. Request a new one.", email };
  }

  if (status === "already_verified") {
    await setVerifiedApplyEmailCookie(email);
    redirect(`/careers/${jobId}`);
  }

  const nextAttemptCount = challenge.attemptCount + 1;
  const expectedHash = hashOtpCode({ code, email, secret: getAuthSecret() });
  const matches = otpHashesMatch(challenge.codeHash, expectedHash);

  await prisma.emailOtp.update({
    where: { id: challenge.id },
    data: {
      attemptCount: nextAttemptCount,
      verifiedAt: matches ? new Date() : undefined,
    },
  });

  if (!matches) {
    if (nextAttemptCount >= OTP_MAX_ATTEMPTS) {
      return { error: "Too many incorrect codes. Request a new one.", email };
    }

    return { error: "That code is incorrect.", email };
  }

  await setVerifiedApplyEmailCookie(email);
  redirect(`/careers/${jobId}`);
}

export async function clearVerifiedApplyEmailAction(jobId: string) {
  await clearVerifiedApplyEmailCookie();
  revalidatePath(`/careers/${jobId}`);
  redirect(`/careers/${jobId}`);
}

export async function applyToJobAction(
  jobId: string,
  _previousState: ApplyToJobState,
  formData: FormData,
): Promise<ApplyToJobState> {
  if (isHoneypotFilled(formData.get("website"))) {
    redirect(`/careers/${jobId}/applied`);
  }

  const verifiedEmail = await getVerifiedApplyEmail();
  if (!verifiedEmail) {
    return { errors: EMPTY_ERRORS, generic: VERIFY_EMAIL_REQUIRED_MESSAGE };
  }

  const formEmail = String(formData.get("email") ?? "");
  if (!emailsMatch(formEmail, verifiedEmail)) {
    return { errors: { email: EMAIL_MISMATCH_MESSAGE } };
  }

  const job = await getAcceptingJob(jobId);
  if (!job) {
    return { errors: EMPTY_ERRORS, generic: JOB_NOT_ACCEPTING_MESSAGE };
  }

  const ip = await getRequestIp();
  const submitLimit = applyIpLimiter.consume(`apply-ip:${ip}`);
  if (!submitLimit.allowed) {
    return { errors: EMPTY_ERRORS, generic: formatRetryAfter(submitLimit.retryAfterSeconds) };
  }

  const { errors, input } = validateCandidateFields({
    name: String(formData.get("name") ?? ""),
    email: verifiedEmail,
    phone: String(formData.get("phone") ?? ""),
    totalExperience: String(formData.get("totalExperience") ?? ""),
    relevantExperience: String(formData.get("relevantExperience") ?? ""),
    currentCity: String(formData.get("currentCity") ?? ""),
    currentCtc: String(formData.get("currentCtc") ?? ""),
    expectedCtc: String(formData.get("expectedCtc") ?? ""),
    noticePeriod: String(formData.get("noticePeriod") ?? ""),
    source: PUBLIC_APPLICATION_SOURCE,
    feedback: "",
  });
  const resume = getResumeFromForm(formData);
  const resumeError = validateResumeFile(resume, { required: true });

  if (resumeError) {
    errors.resume = resumeError;
  }

  const { errors: answerErrors, answers } = validateApplicationAnswers(
    job.questions,
    (questionId) => String(formData.get(questionFieldName(questionId)) ?? ""),
  );
  const consentError = isConsentGiven(formData.get("consent"))
    ? undefined
    : CONSENT_REQUIRED_MESSAGE;
  const hasAnswerErrors = Object.keys(answerErrors).length > 0;

  if (!input || Object.keys(errors).length > 0 || !resume || hasAnswerErrors || consentError) {
    return { errors, answerErrors, consentError };
  }

  if (await hasAppliedWithEmail(jobId, input.email)) {
    return { errors: { email: ALREADY_APPLIED_MESSAGE } };
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

      const duplicate = findCandidateDuplicate({
        existing,
        email: input.email,
        phone: input.phone,
      });

      if (duplicate === "email") {
        throw new Error("DUPLICATE_EMAIL");
      }

      if (duplicate === "phone") {
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
          source: PUBLIC_APPLICATION_SOURCE,
          currentStageId: firstStage.id,
          consentAt: new Date(),
          createdById: null,
          answers: {
            create: answers.map((answer) => ({
              questionId: answer.questionId,
              questionLabel: answer.questionLabel,
              value: answer.value,
              position: answer.position,
            })),
          },
        },
        select: { id: true, name: true, email: true, phone: true },
      });

      await tx.candidateStageHistory.create({
        data: {
          candidateId: candidate.id,
          fromStageId: null,
          toStageId: firstStage.id,
          movedById: null,
          comment: PUBLIC_APPLY_STAGE_COMMENT,
        },
      });

      const latestVerified = await tx.emailOtp.findFirst({
        where: {
          email: input.email,
          verifiedAt: { not: null },
          consumedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (latestVerified) {
        await tx.emailOtp.update({
          where: { id: latestVerified.id },
          data: { consumedAt: new Date() },
        });
      }

      const [jobMembers, admins] = await Promise.all([
        tx.jobUser.findMany({
          where: { jobId },
          select: { user: { select: { id: true, isActive: true } } },
        }),
        tx.user.findMany({
          where: { role: "admin", isActive: true },
          select: { id: true, isActive: true },
        }),
      ]);

      const notifications = await dispatchApplicationNotifications(tx, {
        recipientUserIds: selectApplicationNotificationRecipients([
          ...jobMembers.map((member) => member.user),
          ...admins,
        ]),
        candidateName: candidate.name,
        jobTitle: job.title,
        jobId,
        candidateId: candidate.id,
      });

      for (const notification of notifications) {
        await writeAuditLog(tx, {
          actorId: null,
          action: "notification_created",
          entityType: "notification",
          entityId: notification.id,
          metadata: {
            jobId,
            candidateId: candidate.id,
            recipientUserId: notification.recipientUserId,
            type: "candidate_applied",
          },
        });
      }

      await writeCandidateHistory(tx, {
        actorId: null,
        action: "candidate_applied",
        candidateId: candidate.id,
        metadata: {
          jobId,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          initialStage: firstStage.name,
          resumeFileName: savedResume.fileName,
          resumeFileSize: savedResume.size,
          origin: "public_apply",
          notificationIds: notifications.map((notification) => notification.id),
        },
      });
    });
  } catch (error) {
    if (resumePath) {
      await deleteStoredFile(resumePath);
    }

    if (error instanceof Error) {
      if (error.message === "NO_STAGES") {
        return { errors: EMPTY_ERRORS, generic: JOB_NOT_ACCEPTING_MESSAGE };
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

    console.error("applyToJobAction failed", error);
    return {
      errors: EMPTY_ERRORS,
      generic: "Could not submit your application. Please try again.",
    };
  }

  const confirmation = buildApplicationConfirmationEmail({
    appName: await getAppName(),
    candidateName: input.name,
    jobTitle: job.title,
  });
  await sendEmail({ to: input.email, ...confirmation });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/candidates`);
  revalidatePath(`/careers/${jobId}`);
  redirect(`/careers/${jobId}/applied`);
}
