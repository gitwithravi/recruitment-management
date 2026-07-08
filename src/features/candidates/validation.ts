import "server-only";

export type CandidateFieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentCity?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source?: string;
  feedback?: string;
  resume?: string;
};

export type CandidateInput = {
  name: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentCity: string;
  currentCtc: string | null;
  expectedCtc: string | null;
  noticePeriod: string;
  source: string;
  feedback: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()0-9\s-]{7,24}$/;
const RESUME_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateDecimal(
  errors: CandidateFieldErrors,
  key: keyof CandidateFieldErrors,
  value: string,
  label: string,
  options: { required: boolean; max: number },
) {
  const trimmed = value.trim();

  if (!trimmed) {
    if (options.required) {
      errors[key] = `${label} is required.`;
    }
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    errors[key] = `${label} must be a number with up to 2 decimals.`;
    return null;
  }

  const numberValue = Number(trimmed);
  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > options.max) {
    errors[key] = `${label} must be between 0 and ${options.max}.`;
    return null;
  }

  return trimmed;
}

export function validateCandidateFields(input: {
  name: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentCity: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  source: string;
  feedback: string;
}): { errors: CandidateFieldErrors; input: CandidateInput | null } {
  const errors: CandidateFieldErrors = {};
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const currentCity = input.currentCity.trim();
  const noticePeriod = input.noticePeriod.trim();
  const source = input.source.trim();
  const feedback = input.feedback.trim();
  const totalExperience = validateDecimal(
    errors,
    "totalExperience",
    input.totalExperience,
    "Total experience",
    {
      required: true,
      max: 99.99,
    },
  );
  const relevantExperience = validateDecimal(
    errors,
    "relevantExperience",
    input.relevantExperience,
    "Relevant experience",
    { required: true, max: 99.99 },
  );
  const currentCtc = validateDecimal(errors, "currentCtc", input.currentCtc, "Current CTC", {
    required: false,
    max: 9999999999.99,
  });
  const expectedCtc = validateDecimal(errors, "expectedCtc", input.expectedCtc, "Expected CTC", {
    required: false,
    max: 9999999999.99,
  });

  if (!name) {
    errors.name = "Candidate name is required.";
  } else if (name.length > 120) {
    errors.name = "Candidate name must be 120 characters or fewer.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!phone) {
    errors.phone = "Phone is required.";
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!currentCity) {
    errors.currentCity = "Current city is required.";
  } else if (currentCity.length > 80) {
    errors.currentCity = "Current city must be 80 characters or fewer.";
  }

  if (!noticePeriod) {
    errors.noticePeriod = "Notice period is required.";
  } else if (noticePeriod.length > 80) {
    errors.noticePeriod = "Notice period must be 80 characters or fewer.";
  }

  if (!source) {
    errors.source = "Source is required.";
  } else if (source.length > 80) {
    errors.source = "Source must be 80 characters or fewer.";
  }

  if (feedback.length > 5000) {
    errors.feedback = "Feedback must be 5,000 characters or fewer.";
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input:
      hasErrors || !totalExperience || !relevantExperience
        ? null
        : {
            name,
            email,
            phone,
            totalExperience,
            relevantExperience,
            currentCity,
            currentCtc,
            expectedCtc,
            noticePeriod,
            source,
            feedback: feedback || null,
          },
  };
}

export function validateResumeFile(file: File | null, options: { required: boolean }) {
  if (!file || file.size === 0) {
    return options.required ? "Resume file is required." : undefined;
  }

  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return "Resume must be 10 MB or smaller.";
  }

  if (file.type && !ALLOWED_RESUME_TYPES.has(file.type)) {
    return "Upload a PDF, DOC, or DOCX resume.";
  }

  return undefined;
}
