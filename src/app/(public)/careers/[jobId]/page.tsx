import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { CareersApplyPanel } from "@/components/careers/careers-apply-panel";
import { CareersJobMeta } from "@/components/careers/careers-job-meta";
import { Button } from "@/components/ui/button";
import { getPublicJob, hasAppliedWithEmail } from "@/features/careers/queries";
import { getPublicJobPageState } from "@/features/careers/rules";
import { getVerifiedApplyEmail } from "@/features/careers/session";
import { buildJobPostingJsonLd, serializeJsonLd } from "@/features/jobs/posting";
import { APP_NAME, APP_URL, PRIVACY_POLICY_URL, formatAppTitle } from "@/lib/app-config";
import { isEmailConfigured } from "@/server/notifications/email";

type CareersJobPageProps = {
  params: Promise<{ jobId: string }>;
};

export async function generateMetadata({ params }: CareersJobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getPublicJob(jobId);
  const state = getPublicJobPageState(job);

  return {
    title: formatAppTitle(state === "not_found" || !job ? "Job" : job.title),
  };
}

export default async function CareersJobPage({ params }: CareersJobPageProps) {
  const { jobId } = await params;
  const job = await getPublicJob(jobId);
  const pageState = getPublicJobPageState(job);

  if (pageState === "not_found" || !job) {
    notFound();
  }

  const verifiedEmail = await getVerifiedApplyEmail();
  const alreadyApplied = verifiedEmail ? await hasAppliedWithEmail(job.id, verifiedEmail) : false;
  const jsonLd =
    pageState === "open"
      ? buildJobPostingJsonLd({
          title: job.title,
          descriptionHtml: job.description,
          datePosted: job.createdAt,
          organizationName: APP_NAME,
          url: `${await getBaseUrl()}/careers/${job.id}`,
          posting: job,
        })
      : null;

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/careers" />}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All roles
      </Button>

      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
        <CareersJobMeta job={job} />
        <div
          className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:leading-6 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      </div>

      {pageState === "closed" ? (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-medium">No longer accepting applications</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This role is no longer open. Browse other open roles on the careers page.
          </p>
        </div>
      ) : (
        <CareersApplyPanel
          jobId={job.id}
          smtpConfigured={isEmailConfigured()}
          verifiedEmail={verifiedEmail}
          alreadyApplied={alreadyApplied}
          questions={job.questions}
          privacyPolicyUrl={PRIVACY_POLICY_URL}
        />
      )}
    </div>
  );
}

async function getBaseUrl() {
  if (APP_URL) {
    return APP_URL;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol =
    headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
