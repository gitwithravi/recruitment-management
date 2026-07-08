import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { CandidateBoard } from "@/components/candidates/candidate-board";
import { Button } from "@/components/ui/button";
import { getCandidateBoardForJob } from "@/features/candidates/queries";
import { getJobForUser } from "@/features/jobs/queries";
import { formatAppTitle } from "@/lib/app-config";
import { requireJobAccess } from "@/server/auth/session";

type JobBoardPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: JobBoardPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const job = await getJobForUser(user, id);

  return {
    title: formatAppTitle(job ? `${job.title} Board` : "Job Board"),
  };
}

export default async function JobBoardPage({ params }: JobBoardPageProps) {
  const { id } = await params;
  const user = await requireJobAccess(id);
  const [job, board] = await Promise.all([getJobForUser(user, id), getCandidateBoardForJob(id)]);

  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          nativeButton={false}
          render={<Link href={`/jobs/${id}`} />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {job.title}
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kanban board</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards between stages to prepare a move. Confirmation is handled in Phase 9.
          </p>
        </div>
      </div>

      <CandidateBoard
        jobId={id}
        stages={board.stages}
        candidates={board.candidates}
        filters={board.filters}
      />
    </div>
  );
}
