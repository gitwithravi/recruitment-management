import { prisma } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { toCsv, csvResponse, sanitizeFilename } from "@/server/csv";
import { listCandidatesForJob } from "@/features/candidates/queries";

type SearchParams = {
  search?: string;
  stageId?: string;
  assignedUserId?: string;
  source?: string;
  currentCity?: string;
  minExperience?: string;
  maxExperience?: string;
  noticePeriod?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (user.role !== "admin") {
    if (process.env.ENABLE_USER_CSV_EXPORT !== "true") {
      return new Response("Forbidden", { status: 403 });
    }

    const membership = await prisma.jobUser.findUnique({
      where: { jobId_userId: { jobId: id, userId: user.id } },
      select: { id: true },
    });

    if (!membership) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(_request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries()) as SearchParams;

  const filters = {
    search: searchParams.search?.trim() || undefined,
    stageId: searchParams.stageId || undefined,
    assignedUserId: searchParams.assignedUserId || undefined,
    source: searchParams.source || undefined,
    currentCity: searchParams.currentCity || undefined,
    noticePeriod: searchParams.noticePeriod || undefined,
    minExperience: searchParams.minExperience ? Number(searchParams.minExperience) : null,
    maxExperience: searchParams.maxExperience ? Number(searchParams.maxExperience) : null,
  };

  const candidates = await listCandidatesForJob(id, filters);

  const header = [
    "Name",
    "Email",
    "Phone",
    "Total experience",
    "Relevant experience",
    "Current city",
    "Notice period",
    "Source",
    "Stage",
    "Assigned user",
    "Created at",
    "Updated at",
  ];

  const rows = candidates.map((candidate) => [
    candidate.name,
    candidate.email,
    candidate.phone,
    `${candidate.totalExperience} years`,
    `${candidate.relevantExperience} years`,
    candidate.currentCity,
    candidate.noticePeriod,
    candidate.source,
    candidate.currentStage.name,
    candidate.assignedUser ? candidate.assignedUser.username : "Unassigned",
    candidate.createdAt.toISOString(),
    candidate.updatedAt.toISOString(),
  ]);

  const csv = toCsv([header, ...rows]);
  const filename = `candidates-${sanitizeFilename(job.title)}.csv`;
  return csvResponse(filename, csv);
}