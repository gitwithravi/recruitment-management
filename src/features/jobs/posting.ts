export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;

export type WorkMode = (typeof WORK_MODES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const UNSPECIFIED_OPTION = "unspecified";

export const JOB_POSTING_SELECT = {
  location: true,
  department: true,
  workMode: true,
  employmentType: true,
  minExperience: true,
  maxExperience: true,
  openings: true,
  applyBy: true,
} as const;

export type JobPostingFields = {
  location: string | null;
  department: string | null;
  workMode: WorkMode | null;
  employmentType: EmploymentType | null;
  minExperience: number | null;
  maxExperience: number | null;
  openings: number | null;
  applyBy: Date | null;
};

export type JobPostingFieldErrors = Partial<Record<keyof JobPostingFields, string>>;

export type JobPostingRawInput = Partial<Record<keyof JobPostingFields, string>>;

export const EMPTY_JOB_POSTING_FIELDS: JobPostingFields = {
  location: null,
  department: null,
  workMode: null,
  employmentType: null,
  minExperience: null,
  maxExperience: null,
  openings: null,
  applyBy: null,
};

function parseOptionalText(value: string | undefined, maxLength: number, label: string) {
  const text = (value ?? "").trim();
  if (!text) {
    return { value: null };
  }
  if (text.length > maxLength) {
    return { value: null, error: `${label} must be ${maxLength} characters or fewer.` };
  }
  return { value: text };
}

function parseOptionalInt(value: string | undefined, min: number, max: number, label: string) {
  const text = (value ?? "").trim();
  if (!text) {
    return { value: null };
  }
  if (!/^\d+$/.test(text)) {
    return { value: null, error: `${label} must be a whole number.` };
  }
  const number = Number(text);
  if (number < min || number > max) {
    return { value: null, error: `${label} must be between ${min} and ${max}.` };
  }
  return { value: number };
}

function parseOptionalEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  label: string,
) {
  const text = (value ?? "").trim();
  if (!text || text === UNSPECIFIED_OPTION) {
    return { value: null };
  }
  if ((allowed as readonly string[]).includes(text)) {
    return { value: text as T };
  }
  return { value: null, error: `Select a valid ${label.toLowerCase()}.` };
}

function parseOptionalDate(value: string | undefined) {
  const text = (value ?? "").trim();
  if (!text) {
    return { value: null };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return { value: null, error: "Enter a valid date." };
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    return { value: null, error: "Enter a valid date." };
  }
  return { value: date };
}

export function parseJobPostingFields(input: JobPostingRawInput): {
  errors: JobPostingFieldErrors;
  fields: JobPostingFields;
} {
  const errors: JobPostingFieldErrors = {};
  const location = parseOptionalText(input.location, 120, "Location");
  const department = parseOptionalText(input.department, 80, "Department");
  const workMode = parseOptionalEnum(input.workMode, WORK_MODES, "Work mode");
  const employmentType = parseOptionalEnum(
    input.employmentType,
    EMPLOYMENT_TYPES,
    "Employment type",
  );
  const minExperience = parseOptionalInt(input.minExperience, 0, 50, "Minimum experience");
  const maxExperience = parseOptionalInt(input.maxExperience, 0, 50, "Maximum experience");
  const openings = parseOptionalInt(input.openings, 1, 999, "Openings");
  const applyBy = parseOptionalDate(input.applyBy);

  const results = {
    location,
    department,
    workMode,
    employmentType,
    minExperience,
    maxExperience,
    openings,
    applyBy,
  };

  for (const [key, result] of Object.entries(results)) {
    if ("error" in result && result.error) {
      errors[key as keyof JobPostingFields] = result.error;
    }
  }

  if (
    minExperience.value !== null &&
    maxExperience.value !== null &&
    minExperience.value > maxExperience.value
  ) {
    errors.maxExperience = "Maximum experience must be at least the minimum.";
  }

  return {
    errors,
    fields: {
      location: location.value,
      department: department.value,
      workMode: workMode.value,
      employmentType: employmentType.value,
      minExperience: minExperience.value,
      maxExperience: maxExperience.value,
      openings: openings.value,
      applyBy: applyBy.value,
    },
  };
}

export function readJobPostingFormData(formData: FormData): JobPostingRawInput {
  const read = (key: keyof JobPostingFields) => String(formData.get(key) ?? "");
  return {
    location: read("location"),
    department: read("department"),
    workMode: read("workMode"),
    employmentType: read("employmentType"),
    minExperience: read("minExperience"),
    maxExperience: read("maxExperience"),
    openings: read("openings"),
    applyBy: read("applyBy"),
  };
}

/** Applications are accepted through the end of the apply-by day (UTC). */
export function isPastApplyBy(applyBy: Date | null, now = new Date()) {
  if (!applyBy) {
    return false;
  }
  const endOfDay = Date.UTC(
    applyBy.getUTCFullYear(),
    applyBy.getUTCMonth(),
    applyBy.getUTCDate() + 1,
  );
  return now.getTime() >= endOfDay;
}

export function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function formatExperienceRange(min: number | null, max: number | null) {
  if (min === null && max === null) {
    return null;
  }
  if (min !== null && max !== null) {
    return min === max ? `${min} yrs` : `${min}–${max} yrs`;
  }
  if (min !== null) {
    return `${min}+ yrs`;
  }
  return `Up to ${max} yrs`;
}

export function formatApplyByDate(applyBy: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(applyBy);
}

export function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function getJobPostingChips(job: JobPostingFields) {
  const chips: string[] = [];
  if (job.location) chips.push(job.location);
  if (job.workMode) chips.push(WORK_MODE_LABELS[job.workMode]);
  if (job.employmentType) chips.push(EMPLOYMENT_TYPE_LABELS[job.employmentType]);
  if (job.department) chips.push(job.department);
  const experience = formatExperienceRange(job.minExperience, job.maxExperience);
  if (experience) chips.push(experience);
  if (job.openings) chips.push(job.openings === 1 ? "1 opening" : `${job.openings} openings`);
  return chips;
}

const JSON_LD_EMPLOYMENT_TYPE: Record<EmploymentType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

export function buildJobPostingJsonLd(input: {
  title: string;
  descriptionHtml: string;
  datePosted: Date;
  organizationName: string;
  url: string;
  posting: JobPostingFields;
}) {
  const { posting } = input;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: input.title,
    description: input.descriptionHtml,
    datePosted: input.datePosted.toISOString().slice(0, 10),
    hiringOrganization: { "@type": "Organization", name: input.organizationName },
    url: input.url,
  };

  if (posting.applyBy) {
    jsonLd.validThrough = `${posting.applyBy.toISOString().slice(0, 10)}T23:59:59Z`;
  }
  if (posting.employmentType) {
    jsonLd.employmentType = JSON_LD_EMPLOYMENT_TYPE[posting.employmentType];
  }
  if (posting.location) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: posting.location },
    };
  }
  if (posting.workMode === "remote") {
    jsonLd.jobLocationType = "TELECOMMUTE";
  }
  if (posting.openings) {
    jsonLd.totalJobOpenings = posting.openings;
  }
  if (posting.minExperience !== null) {
    jsonLd.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: posting.minExperience * 12,
    };
  }

  return jsonLd;
}

/** Serializes JSON-LD safely for a <script> tag (no closing-tag breakout). */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
