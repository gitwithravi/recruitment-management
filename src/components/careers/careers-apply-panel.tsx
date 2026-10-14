"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { HoneypotField } from "@/components/careers/honeypot-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyToJobAction,
  clearVerifiedApplyEmailAction,
  sendApplyOtpAction,
  verifyApplyOtpAction,
  type ApplyToJobState,
  type SendApplyOtpState,
  type VerifyApplyOtpState,
} from "@/features/careers/actions";
import {
  ALREADY_APPLIED_MESSAGE,
  APPLICATIONS_UNAVAILABLE_MESSAGE,
  OTP_SEND_GENERIC_MESSAGE,
} from "@/features/careers/constants";
import type { CandidateFieldErrors } from "@/features/candidates/validation";
import {
  LONG_ANSWER_MAX,
  SHORT_ANSWER_MAX,
  questionFieldName,
  type ApplicationQuestion,
} from "@/features/questions/rules";

type CareersApplyPanelProps = {
  jobId: string;
  smtpConfigured: boolean;
  verifiedEmail: string | null;
  alreadyApplied: boolean;
  questions: ApplicationQuestion[];
  privacyPolicyUrl: string | null;
};

const textareaClassName =
  "flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

const sendInitial: SendApplyOtpState = {};
const verifyInitial: VerifyApplyOtpState = {};
const applyInitial: ApplyToJobState = { errors: {} };

export function CareersApplyPanel({
  jobId,
  smtpConfigured,
  verifiedEmail,
  alreadyApplied,
  questions,
  privacyPolicyUrl,
}: CareersApplyPanelProps) {
  const boundSend = React.useMemo(() => sendApplyOtpAction.bind(null, jobId), [jobId]);
  const boundVerify = React.useMemo(() => verifyApplyOtpAction.bind(null, jobId), [jobId]);
  const boundApply = React.useMemo(() => applyToJobAction.bind(null, jobId), [jobId]);
  const boundClear = React.useMemo(() => clearVerifiedApplyEmailAction.bind(null, jobId), [jobId]);

  const [sendState, sendAction, sendPending] = useActionState(boundSend, sendInitial);
  const [verifyState, verifyAction, verifyPending] = useActionState(boundVerify, verifyInitial);
  const [applyState, applyAction, applyPending] = useActionState(boundApply, applyInitial);

  const pendingEmail = sendState.email ?? verifyState.email;
  const showCodeStep = Boolean(sendState.sent && pendingEmail && !verifiedEmail);

  if (!smtpConfigured && !verifiedEmail) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-medium">Apply for this role</h2>
        <p className="mt-2 text-sm text-muted-foreground">{APPLICATIONS_UNAVAILABLE_MESSAGE}</p>
      </div>
    );
  }

  if (alreadyApplied && verifiedEmail) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="flex items-center gap-2 text-base font-medium">
          <MailCheck className="size-4" aria-hidden="true" />
          Application received
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{ALREADY_APPLIED_MESSAGE}</p>
      </div>
    );
  }

  if (verifiedEmail) {
    const fieldErrors = applyState.errors as CandidateFieldErrors;

    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-medium">Apply for this role</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Email verified. Complete the form and upload your resume.
            </p>
          </div>
          <form action={boundClear}>
            <Button type="submit" variant="ghost" size="sm">
              Use a different email
            </Button>
          </form>
        </div>

        <form
          onSubmit={(event) => {
            // Submitting via onSubmit keeps typed values when the server returns errors;
            // React resets uncontrolled fields after a form `action` completes.
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            React.startTransition(() => applyAction(formData));
          }}
          className="relative mt-6 space-y-4"
        >
          <HoneypotField />
          <input type="hidden" name="email" value={verifiedEmail} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" id="apply-name" error={fieldErrors.name}>
              <Input name="name" required maxLength={120} />
            </Field>
            <Field label="Email" id="apply-email">
              <Input type="email" value={verifiedEmail} readOnly disabled />
            </Field>
            <Field label="Phone" id="apply-phone" error={fieldErrors.phone}>
              <Input name="phone" required />
            </Field>
            <Field label="Current city" id="apply-city" error={fieldErrors.currentCity}>
              <Input name="currentCity" required maxLength={80} />
            </Field>
            <Field
              label="Total experience (years)"
              id="apply-total-exp"
              error={fieldErrors.totalExperience}
            >
              <Input name="totalExperience" inputMode="decimal" required />
            </Field>
            <Field
              label="Relevant experience (years)"
              id="apply-relevant-exp"
              error={fieldErrors.relevantExperience}
            >
              <Input name="relevantExperience" inputMode="decimal" required />
            </Field>
            <Field
              label="Current CTC (optional)"
              id="apply-current-ctc"
              error={fieldErrors.currentCtc}
            >
              <Input name="currentCtc" inputMode="decimal" />
            </Field>
            <Field
              label="Expected CTC (optional)"
              id="apply-expected-ctc"
              error={fieldErrors.expectedCtc}
            >
              <Input name="expectedCtc" inputMode="decimal" />
            </Field>
            <Field label="Notice period" id="apply-notice" error={fieldErrors.noticePeriod}>
              <Input name="noticePeriod" required maxLength={80} />
            </Field>
            <Field label="Resume" id="apply-resume" error={fieldErrors.resume}>
              <Input name="resume" type="file" required accept=".pdf,.doc,.docx" />
            </Field>
          </div>

          {questions.length > 0 ? (
            <fieldset className="space-y-4 border-t pt-4">
              <legend className="sr-only">Additional questions</legend>
              <p className="text-sm font-medium">Additional questions</p>
              {questions.map((question) => (
                <ApplicationQuestionField
                  key={question.id}
                  question={question}
                  error={applyState.answerErrors?.[question.id]}
                />
              ))}
            </fieldset>
          ) : null}

          <div className="space-y-1 border-t pt-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-0.5 size-4 shrink-0 accent-primary"
                aria-invalid={Boolean(applyState.consentError) || undefined}
              />
              <span>
                I agree that my personal details and resume may be stored and processed for
                recruitment purposes.
                {privacyPolicyUrl ? (
                  <>
                    {" "}
                    Read the{" "}
                    <a
                      href={privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      privacy policy
                    </a>
                    .
                  </>
                ) : null}
              </span>
            </label>
            {applyState.consentError ? (
              <p className="text-xs text-destructive">{applyState.consentError}</p>
            ) : null}
          </div>

          {applyState.generic ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {applyState.generic}
            </p>
          ) : null}

          <Button type="submit" disabled={applyPending}>
            {applyPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        </form>
      </div>
    );
  }

  if (showCodeStep && pendingEmail) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-medium">Enter verification code</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {OTP_SEND_GENERIC_MESSAGE} We sent it to {pendingEmail}.
        </p>
        <form action={verifyAction} className="relative mt-6 space-y-4">
          <HoneypotField />
          <input type="hidden" name="email" value={pendingEmail} />
          <Field label="6-digit code" id="apply-otp" error={verifyState.error ?? sendState.error}>
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={verifyPending}>
              {verifyPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </Button>
            <Button type="submit" variant="outline" formAction={sendAction} disabled={sendPending}>
              {sendPending ? "Sending..." : "Resend code"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-base font-medium">Verify your email</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We will send a one-time code before you fill in the application.
      </p>
      <form action={sendAction} className="relative mt-6 space-y-4">
        <HoneypotField />
        <Field label="Email" id="apply-otp-email" error={sendState.error}>
          <Input name="email" type="email" required autoCapitalize="none" />
        </Field>
        <Button type="submit" disabled={sendPending}>
          {sendPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": Boolean(error) || undefined,
      })}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ApplicationQuestionField({
  question,
  error,
}: {
  question: ApplicationQuestion;
  error?: string;
}) {
  const id = `apply-question-${question.id}`;
  const name = questionFieldName(question.id);
  const label = question.required ? question.label : `${question.label} (optional)`;
  const invalid = Boolean(error) || undefined;

  if (question.type === "yes_no" || question.type === "single_choice") {
    const options =
      question.type === "yes_no"
        ? [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]
        : question.options.map((option) => ({ value: option, label: option }));

    return (
      <fieldset className="space-y-2" aria-invalid={invalid}>
        <legend className="text-sm font-medium">{label}</legend>
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={name}
                value={option.value}
                required={question.required}
                className="size-4 accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </fieldset>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {question.type === "long_text" ? (
        <textarea
          id={id}
          name={name}
          rows={4}
          maxLength={LONG_ANSWER_MAX}
          required={question.required}
          aria-invalid={invalid}
          className={textareaClassName}
        />
      ) : (
        <Input
          id={id}
          name={name}
          maxLength={SHORT_ANSWER_MAX}
          required={question.required}
          aria-invalid={invalid}
        />
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
