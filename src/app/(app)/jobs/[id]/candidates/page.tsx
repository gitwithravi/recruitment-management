import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AddCandidateButton } from "@/components/candidates/add-candidate-button";
import { CandidateListExplorer } from "@/components/candidates/candidate-list-explorer";
import { Button } from "@/components/ui/button";
import {
  getCandidateFilterOptions,
  queryCandidates,
} from "@/features/candidates/queries";
import { getJobForUser } from "@/features/jobs/queries";
import { requireJobAccess } from "@/server/auth/session";

type CandidatesPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Candidates · Recruitment",
};

export default async function CandidatesPage({ params }: CandidatesPageProps) {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const [job, candidates, options] = await Promise.all([
    getJobForUser(user, id),
    queryCandidates(id),
    getCandidateFilterOptions(id),
  ]);

  if (!job) {
    notFound();
  }

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

      <CandidateListExplorer jobId={id} candidates={candidates} options={options} />
    </div>
  );
}