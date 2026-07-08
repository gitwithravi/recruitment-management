import { listCandidateHistoryTimeline } from "@/features/candidates/queries";
import { requireJobAccess } from "@/server/auth/session";

type CandidateHistoryRouteContext = {
  params: Promise<{ id: string; candidateId: string }>;
};

export async function GET(_request: Request, { params }: CandidateHistoryRouteContext) {
  const { id, candidateId } = await params;
  const user = await requireJobAccess(id);
  const history = await listCandidateHistoryTimeline(user, id, candidateId);

  return Response.json({ history });
}
