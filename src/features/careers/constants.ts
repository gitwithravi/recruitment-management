export const PUBLIC_APPLICATION_SOURCE = "Website";
export const PUBLIC_APPLY_STAGE_COMMENT = "Candidate applied via careers page.";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_SEND_PER_EMAIL = 3;
export const OTP_SEND_PER_IP = 5;
export const APPLY_SUBMIT_PER_IP = 8;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const VERIFIED_EMAIL_COOKIE_NAME = "careers_email_verified";
export const VERIFIED_EMAIL_MAX_AGE_SECONDS = 30 * 60;

export const OTP_SEND_GENERIC_MESSAGE =
  "If this email can receive mail, we sent a verification code.";
export const APPLICATIONS_UNAVAILABLE_MESSAGE =
  "Applications are temporarily unavailable. Please try again later.";
export const JOB_NOT_ACCEPTING_MESSAGE = "This job is not accepting applications.";
export const ALREADY_APPLIED_MESSAGE = "You have already applied for this job.";
export const VERIFY_EMAIL_REQUIRED_MESSAGE = "Verify your email before submitting an application.";
export const EMAIL_MISMATCH_MESSAGE = "Use the email address you just verified.";
