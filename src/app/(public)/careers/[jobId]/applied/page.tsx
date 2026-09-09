import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicJob } from "@/features/careers/queries";
import { getPublicJobPageState } from "@/features/careers/rules";
import { formatAppTitle } from "@/lib/app-config";

type AppliedPageProps = {
  params: Promise<{ jobId: string }>;
};

export async function generateMetadata({ params }: AppliedPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getPublicJob(jobId);

  return {
    title: formatAppTitle(job ? `Applied · ${job.title}` : "Applied"),
  };
}

export default async function CareersAppliedPage({ params }: AppliedPageProps) {
  const { jobId } = await params;
  const job = await getPublicJob(jobId);
  const pageState = getPublicJobPageState(job);

  if (pageState === "not_found" || !job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10 text-center">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Application submitted</h1>
        <p className="text-sm text-muted-foreground">
          Thank you for applying to {job.title}. Our team will review your application and contact
          you if there is a match.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/careers" />}>
        Back to open roles
      </Button>
    </div>
  );
}
