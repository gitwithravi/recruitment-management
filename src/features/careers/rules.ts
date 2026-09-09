import { OTP_MAX_ATTEMPTS } from "./constants.ts";

export function isJobListedOnCareers(job: { status: string; isPublished: boolean }) {
  return job.status === "open" && job.isPublished;
}

export function getPublicJobPageState(
  job: { status: string; isPublished: boolean } | null,
): "not_found" | "closed" | "open" {
  if (!job || !job.isPublished) {
    return "not_found";
  }

  if (job.status !== "open") {
    return "closed";
  }

  return "open";
}

export function canAcceptPublicApplications(job: {
  status: string;
  isPublished: boolean;
  stageCount: number;
}) {
  return isJobListedOnCareers(job) && job.stageCount > 0;
}

export function canPublishJob(status: string) {
  return status === "open";
}

export function emailsMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function isHoneypotFilled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function formatCandidateCreatedBy(createdBy: { username: string } | null) {
  return createdBy ? `@${createdBy.username}` : "Public application";
}

export function formatStageMovedBy(movedBy: { username: string } | null) {
  return movedBy ? `by @${movedBy.username}` : "via careers page";
}

export function isOtpAttemptAllowed(attemptCount: number) {
  return attemptCount < OTP_MAX_ATTEMPTS;
}

export function isOtpExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export function evaluateOtpChallenge(input: {
  expiresAt: Date;
  attemptCount: number;
  verifiedAt: Date | null;
  now?: Date;
}): "valid" | "expired" | "exhausted" | "already_verified" {
  if (input.verifiedAt) {
    return "already_verified";
  }

  if (isOtpExpired(input.expiresAt, input.now ?? new Date())) {
    return "expired";
  }

  if (!isOtpAttemptAllowed(input.attemptCount)) {
    return "exhausted";
  }

  return "valid";
}

export function truncatePlainText(value: string, maxLength = 180) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeApplyEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateApplyEmail(value: string) {
  const email = normalizeApplyEmail(value);

  if (!email) {
    return { error: "Email is required.", email };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address.", email };
  }

  return { error: undefined, email };
}
