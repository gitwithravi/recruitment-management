import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download } from "lucide-react";

import { CandidateAssignmentPanel } from "@/components/candidates/candidate-assignment-panel";
import { CandidateAssignmentTimeline } from "@/components/candidates/candidate-assignment-timeline";
import { CommentThread } from "@/components/candidates/comment-thread";
import { EditCandidateButton } from "@/components/candidates/edit-candidate-button";
import { CandidateStageTimeline } from "@/components/candidates/candidate-stage-timeline";
import { ResumeReplaceForm } from "@/components/candidates/resume-replace-form";
import { OfferDetailsPanel } from "@/components/offers/offer-details-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCandidateForJob,
  listCandidateAssignmentTimeline,
  listCandidateStageTimeline,
} from "@/features/candidates/queries";
import { listCommentsForCandidate, listMentionableUsersForJob } from "@/features/comments/queries";
import { getJobForUser } from "@/features/jobs/queries";
import { getOfferForCandidate } from "@/features/offers/queries";
import { requireJobAccess } from "@/server/auth/session";

type CandidateDetailPageProps = {
  params: Promise<{ id: string; candidateId: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}): Promise<Metadata> {
  const { id, candidateId } = await params;
  const user = await requireJobAccess(id);
  const candidate = await getCandidateForJob(user, id, candidateId);

  return {
    title: candidate ? `${candidate.name} · Recruitment` : "Candidate · Recruitment",
  };
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id, candidateId } = await params;
  const user = await requireJobAccess(id);
  const [job, candidate, stageTimeline, assignmentTimeline, comments, mentionableUsers, offer] =
    await Promise.all([
      getJobForUser(user, id),
      getCandidateForJob(user, id, candidateId),
      listCandidateStageTimeline(id, candidateId),
      listCandidateAssignmentTimeline(id, candidateId),
      listCommentsForCandidate(user, candidateId),
      listMentionableUsersForJob(id),
      user.role === "admin" ? getOfferForCandidate(candidateId) : null,
    ]);

  if (!job || !candidate) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href={`/jobs/${id}/candidates`} />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Candidates
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
              <Badge variant="secondary">{candidate.currentStage.name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {candidate.email} · {candidate.phone} · {candidate.currentCity}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href={`/jobs/${id}/candidates/${candidate.id}/resume`} />}
            >
              <Download className="size-4" aria-hidden="true" />
              Download resume
            </Button>
            <EditCandidateButton jobId={id} candidate={candidate} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidate details</CardTitle>
            <CardDescription>{job.title}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Total experience" value={`${candidate.totalExperience} years`} />
            <Detail label="Relevant experience" value={`${candidate.relevantExperience} years`} />
            <Detail label="Current CTC" value={candidate.currentCtc ?? "Not provided"} />
            <Detail label="Expected CTC" value={candidate.expectedCtc ?? "Not provided"} />
            <Detail label="Notice period" value={candidate.noticePeriod} />
            <Detail label="Source" value={candidate.source} />
            <Detail
              label="Assigned user"
              value={candidate.assignedUser ? `@${candidate.assignedUser.username}` : "Unassigned"}
            />
            <Detail label="Created by" value={`@${candidate.createdBy.username}`} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
              <CardDescription>
                Assign this candidate to an attached user or leave them unassigned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateAssignmentPanel
                key={candidate.assignedUser?.id ?? "unassigned"}
                jobId={id}
                candidateId={candidate.id}
                currentAssignee={candidate.assignedUser}
                assignableUsers={job.attachedUsers}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resume</CardTitle>
              <CardDescription>One resume file is stored for each candidate.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeReplaceForm jobId={id} candidateId={candidate.id} />
            </CardContent>
          </Card>

          {user.role === "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offer details</CardTitle>
                <CardDescription>
                  Admin-only. Offer CTC, dates, and status for this candidate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfferDetailsPanel candidateId={candidate.id} initialOffer={offer ?? null} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback</CardTitle>
          <CardDescription>
            {candidate.canEditFeedback
              ? "Feedback can be updated from the edit candidate dialog."
              : "Only admins or the assigned user can update feedback."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidate.feedback ? (
            <p className="whitespace-pre-line text-sm leading-6">{candidate.feedback}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No feedback added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments</CardTitle>
          <CardDescription>Discuss this candidate with @mentions.</CardDescription>
        </CardHeader>
        <CardContent>
          <CommentThread
            jobId={id}
            candidateId={candidate.id}
            initialComments={comments}
            mentionableUsers={mentionableUsers}
            currentUserId={user.id}
            isAdmin={user.role === "admin"}
          />
        </CardContent>
      </Card>

      <CandidateAssignmentTimeline items={assignmentTimeline} />
      <CandidateStageTimeline items={stageTimeline} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
