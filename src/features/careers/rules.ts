import { isPastApplyBy } from "../jobs/posting.ts";
import { OTP_MAX_ATTEMPTS } from "./constants.ts";

type CareersJobState = {
  status: string;
  isPublished: boolean;
  applyBy?: Date | null;
};

export function isJobListedOnCareers(job: CareersJobState, now = new Date()) {
  return job.status === "open" && job.isPublished && !isPastApplyBy(job.applyBy ?? null, now);
}

export function getPublicJobPageState(
  job: CareersJobState | null,
  now = new Date(),
): "not_found" | "closed" | "open" {
  if (!job || !job.isPublished) {
    return "not_found";
  }

  if (job.status !== "open" || isPastApplyBy(job.applyBy ?? null, now)) {
    return "closed";
  }

  return "open";
}

export function canAcceptPublicApplications(
  job: CareersJobState & { stageCount: number },
  now = new Date(),
) {
  return isJobListedOnCareers(job, now) && job.stageCount > 0;
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

export function selectApplicationNotificationRecipients(
  users: Array<{ id: string; isActive: boolean }>,
) {
  return [...new Set(users.filter((user) => user.isActive).map((user) => user.id))];
}

export function buildApplicationConfirmationEmail(input: {
  appName: string;
  candidateName: string;
  jobTitle: string;
}) {
  return {
    subject: `[${input.appName}] We received your application for ${input.jobTitle}`,
    body: [
      `Hi ${input.candidateName},`,
      ``,
      `Thank you for applying for "${input.jobTitle}". We have received your application and resume.`,
      ``,
      `Our team will review it and contact you if your profile matches the role.`,
      ``,
      `${input.appName}`,
    ].join("\n"),
  };
}

export type CareersFilters = {
  q: string;
  location: string;
  department: string;
  workMode: string;
  employmentType: string;
};

export const EMPTY_CAREERS_FILTERS: CareersFilters = {
  q: "",
  location: "",
  department: "",
  workMode: "",
  employmentType: "",
};

export function parseCareersFilters(
  params: Record<string, string | string[] | undefined>,
): CareersFilters {
  const read = (key: keyof CareersFilters) => {
    const value = params[key];
    const text = (Array.isArray(value) ? value[0] : value) ?? "";
    return text.trim().slice(0, 120);
  };

  return {
    q: read("q"),
    location: read("location"),
    department: read("department"),
    workMode: read("workMode"),
    employmentType: read("employmentType"),
  };
}

export function hasActiveCareersFilters(filters: CareersFilters) {
  return Object.values(filters).some((value) => value.length > 0);
}

type FilterableCareersJob = {
  title: string;
  searchText: string;
  location: string | null;
  department: string | null;
  workMode: string | null;
  employmentType: string | null;
};

export function filterCareersJobs<T extends FilterableCareersJob>(
  jobs: T[],
  filters: CareersFilters,
): T[] {
  const query = filters.q.toLowerCase();
  const sameText = (left: string | null, right: string) =>
    !right || (left ?? "").trim().toLowerCase() === right.toLowerCase();

  return jobs.filter(
    (job) =>
      (!query ||
        [job.title, job.searchText, job.location ?? "", job.department ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        )) &&
      sameText(job.location, filters.location) &&
      sameText(job.department, filters.department) &&
      (!filters.workMode || job.workMode === filters.workMode) &&
      (!filters.employmentType || job.employmentType === filters.employmentType),
  );
}

export function collectFilterOptions(values: Array<string | null>) {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const text = value?.trim();
    if (text && !byKey.has(text.toLowerCase())) {
      byKey.set(text.toLowerCase(), text);
    }
  }
  return [...byKey.values()].sort((left, right) => left.localeCompare(right));
}
