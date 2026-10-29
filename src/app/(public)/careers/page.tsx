import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";

import { CareersFiltersForm } from "@/components/careers/careers-filters";
import { CareersJobCard } from "@/components/careers/careers-job-card";
import { listPublishedJobs } from "@/features/careers/queries";
import {
  collectFilterOptions,
  filterCareersJobs,
  hasActiveCareersFilters,
  parseCareersFilters,
} from "@/features/careers/rules";
import { getAppName } from "@/features/settings/queries";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Careers",
    description: `Open roles at ${await getAppName()}`,
  };
}

type CareersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CareersPage({ searchParams }: CareersPageProps) {
  const filters = parseCareersFilters(await searchParams);
  const allJobs = await listPublishedJobs();
  const jobs = filterCareersJobs(allJobs, filters);
  const filtersActive = hasActiveCareersFilters(filters);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Open roles</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse published jobs and apply with a verified email. Your application is reviewed by our
          recruitment team.
        </p>
      </div>

      {allJobs.length > 0 ? (
        <CareersFiltersForm
          filters={filters}
          locations={collectFilterOptions(allJobs.map((job) => job.location))}
          departments={collectFilterOptions(allJobs.map((job) => job.department))}
          showClear={filtersActive}
        />
      ) : null}

      {allJobs.length > 0 && jobs.length === 0 ? (
        <div className="rounded-xl border bg-card px-4 py-10 text-center">
          <p className="text-sm font-medium">No roles match these filters</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different keyword or clear the filters.
          </p>
        </div>
      ) : allJobs.length === 0 ? (
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
