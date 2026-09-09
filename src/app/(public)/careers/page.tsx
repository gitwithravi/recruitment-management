import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";

import { CareersJobCard } from "@/components/careers/careers-job-card";
import { listPublishedJobs } from "@/features/careers/queries";
import { APP_NAME, formatAppTitle } from "@/lib/app-config";

export const metadata: Metadata = {
  title: formatAppTitle("Careers"),
  description: `Open roles at ${APP_NAME}`,
};

export default async function CareersPage() {
  const jobs = await listPublishedJobs();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Open roles</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse published jobs and apply with a verified email. Your application is reviewed by our
          recruitment team.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-4 py-16 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium">No open roles right now</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Check back later. New jobs appear here when they are listed by the team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <CareersJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
