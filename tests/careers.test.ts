import assert from "node:assert/strict";
import test from "node:test";

import {
  OTP_MAX_ATTEMPTS,
  VERIFIED_EMAIL_MAX_AGE_SECONDS,
} from "../src/features/careers/constants.ts";
import { generateOtpCode, hashOtpCode, otpHashesMatch } from "../src/features/careers/otp.ts";
import {
  canAcceptPublicApplications,
  canPublishJob,
  emailsMatch,
  evaluateOtpChallenge,
  formatCandidateCreatedBy,
  formatStageMovedBy,
  getPublicJobPageState,
  isHoneypotFilled,
  isJobListedOnCareers,
  isOtpAttemptAllowed,
  validateApplyEmail,
} from "../src/features/careers/rules.ts";
import {
  createVerifiedEmailToken,
  verifyVerifiedEmailToken,
} from "../src/features/careers/verified-email.ts";
import { isSmtpReady } from "../src/lib/smtp-config.ts";
import { SlidingWindowLimiter } from "../src/server/auth/rate-limit.ts";

test("only open published jobs are listed on careers", () => {
  assert.equal(isJobListedOnCareers({ status: "open", isPublished: true }), true);
  assert.equal(isJobListedOnCareers({ status: "open", isPublished: false }), false);
  assert.equal(isJobListedOnCareers({ status: "closed", isPublished: true }), false);
});

test("public job pages 404 unpublished jobs and close published ones", () => {
  assert.equal(getPublicJobPageState(null), "not_found");
  assert.equal(getPublicJobPageState({ status: "open", isPublished: false }), "not_found");
  assert.equal(getPublicJobPageState({ status: "closed", isPublished: false }), "not_found");
  assert.equal(getPublicJobPageState({ status: "closed", isPublished: true }), "closed");
  assert.equal(getPublicJobPageState({ status: "open", isPublished: true }), "open");
});

test("public applications require an open listed job with stages", () => {
  assert.equal(
    canAcceptPublicApplications({ status: "open", isPublished: true, stageCount: 1 }),
    true,
  );
  assert.equal(
    canAcceptPublicApplications({ status: "open", isPublished: true, stageCount: 0 }),
    false,
  );
  assert.equal(
    canAcceptPublicApplications({ status: "closed", isPublished: true, stageCount: 3 }),
    false,
  );
  assert.equal(canPublishJob("open"), true);
  assert.equal(canPublishJob("closed"), false);
});

test("apply requires matching verified email", () => {
  assert.equal(emailsMatch("Ada@Example.com", "ada@example.com"), true);
  assert.equal(emailsMatch("ada@example.com", "other@example.com"), false);
});

test("OTP challenges expire and exhaust attempts", () => {
  const now = new Date("2026-09-09T12:00:00.000Z");
  assert.equal(
    evaluateOtpChallenge({
      expiresAt: new Date("2026-09-09T12:10:00.000Z"),
      attemptCount: 0,
      verifiedAt: null,
      now,
    }),
    "valid",
  );
  assert.equal(
    evaluateOtpChallenge({
      expiresAt: new Date("2026-09-09T11:59:00.000Z"),
      attemptCount: 0,
      verifiedAt: null,
      now,
    }),
    "expired",
  );
  assert.equal(
    evaluateOtpChallenge({
      expiresAt: new Date("2026-09-09T12:10:00.000Z"),
      attemptCount: OTP_MAX_ATTEMPTS,
      verifiedAt: null,
      now,
    }),
    "exhausted",
  );
  assert.equal(
    evaluateOtpChallenge({
      expiresAt: new Date("2026-09-09T12:10:00.000Z"),
      attemptCount: 0,
      verifiedAt: now,
      now,
    }),
    "already_verified",
  );
  assert.equal(isOtpAttemptAllowed(OTP_MAX_ATTEMPTS - 1), true);
  assert.equal(isOtpAttemptAllowed(OTP_MAX_ATTEMPTS), false);
});

test("OTP hashes are compared with the email-bound secret", () => {
  const secret = "a".repeat(32);
  const code = generateOtpCode();
  assert.equal(code.length, 6);
  const hash = hashOtpCode({ code, email: "ada@example.com", secret });
  const same = hashOtpCode({ code, email: "ada@example.com", secret });
  const otherEmail = hashOtpCode({ code, email: "other@example.com", secret });
  assert.equal(otpHashesMatch(hash, same), true);
  assert.equal(otpHashesMatch(hash, otherEmail), false);
});

test("verified email cookie rejects expired or mismatched tokens", () => {
  const secret = "b".repeat(32);
  const now = 1_000_000;
  const token = createVerifiedEmailToken({
    email: "ada@example.com",
    secret,
    now,
  });

  assert.equal(verifyVerifiedEmailToken(token, secret, now)?.email, "ada@example.com");
  assert.equal(
    verifyVerifiedEmailToken(token, secret, now + (VERIFIED_EMAIL_MAX_AGE_SECONDS + 1) * 1000),
    null,
  );
  assert.equal(verifyVerifiedEmailToken("tampered." + token.split(".")[1], secret, now), null);
});

test("public applicant labels fall back when no staff actor exists", () => {
  assert.equal(formatCandidateCreatedBy({ username: "admin" }), "@admin");
  assert.equal(formatCandidateCreatedBy(null), "Public application");
  assert.equal(formatStageMovedBy({ username: "recruiter" }), "by @recruiter");
  assert.equal(formatStageMovedBy(null), "via careers page");
});

test("SMTP must be fully configured before public apply is offered", () => {
  assert.equal(isSmtpReady({}), false);
  assert.equal(
    isSmtpReady({
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "mail@example.com",
      SMTP_PASS: "secret",
    }),
    true,
  );
  assert.equal(
    isSmtpReady({
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "mail@example.com",
    }),
    false,
  );
});

test("honeypot treats any filled value as bot traffic", () => {
  assert.equal(isHoneypotFilled(""), false);
  assert.equal(isHoneypotFilled("   "), false);
  assert.equal(isHoneypotFilled("https://spam.example"), true);
});

test("apply email validation normalizes and rejects invalid addresses", () => {
  assert.deepEqual(validateApplyEmail("  Ada@Example.com "), {
    error: undefined,
    email: "ada@example.com",
  });
  assert.equal(validateApplyEmail("not-an-email").error, "Enter a valid email address.");
  assert.equal(validateApplyEmail("").error, "Email is required.");
});

test("sliding window limiter blocks extra events inside the window", () => {
  const limiter = new SlidingWindowLimiter(2, 1000);
  const now = 10_000;
  assert.equal(limiter.consume("ip", now).allowed, true);
  assert.equal(limiter.consume("ip", now + 10).allowed, true);
  assert.equal(limiter.consume("ip", now + 20).allowed, false);
  assert.equal(limiter.consume("ip", now + 1001).allowed, true);
});
