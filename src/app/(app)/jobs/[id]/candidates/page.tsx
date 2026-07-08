import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Search, UserPlus } from "lucide-react";

import { AddCandidateButton } from "@/components/candidates/add-candidate-button";
import { CandidatesTable } from "@/components/candidates/candidates-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listCandidatesForJob, type CandidateFilters } from "@/features/candidates/queries";
import { getJobForUser } from "@/features/jobs/queries";
import { requireJobAccess } from "@/server/auth/session";

type CandidatesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string | string[]; stage?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Candidates · Recruitment",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CandidatesPage({ params, searchParams }: CandidatesPageProps) {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const [query, job] = await Promise.all([searchParams, getJobForUser(user, id)]);

  if (!job) {
    notFound();
  }

  const filters: CandidateFilters = {
    search: firstParam(query.q),
    stageId: firstParam(query.stage),
  };
  const candidates = await listCandidatesForJob(id, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={`/jobs/${id}`} />}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {job.title}
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
            <p className="text-sm text-muted-foreground">
              Add and manage resumes for this job. Duplicate email or phone is blocked per job.
            </p>
          </div>
          <AddCandidateButton jobId={id} />
        </div>
      </div>

      <form className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="candidate-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="candidate-search"
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder="Name, email, phone, city, source"
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="candidate-stage">Stage</Label>
          <select
            id="candidate-stage"
            name="stage"
            defaultValue={filters.stageId ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">All stages</option>
            {job.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate list</CardTitle>
          <CardDescription>{candidates.length} candidates shown</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserPlus className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No candidates found</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Add a candidate with a resume to start the job pipeline.
              </p>
            </div>
          ) : (
            <CandidatesTable jobId={id} candidates={candidates} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
