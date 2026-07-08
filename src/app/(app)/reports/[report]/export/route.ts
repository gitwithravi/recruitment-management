import { getCurrentUser } from "@/server/auth/session";
import {
  assertReportJobAccess,
  getAgingReport,
  getAssignedPerUserReport,
  getCandidatesPerStageReport,
  getSourceCountsReport,
  type ReportKind,
} from "@/features/reports/queries";
import { csvResponse, sanitizeFilename, toCsv } from "@/server/csv";

type Params = { report: string };

const ALL_JOBS = "all";

const reportKinds = new Set<ReportKind>([
  "candidates-per-stage",
  "assigned-per-user",
  "source-counts",
  "aging",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { report } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!reportKinds.has(report as ReportKind)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(_request.url);
  const jobId = url.searchParams.get("jobId") ?? ALL_JOBS;

  try {
    await assertReportJobAccess(user, jobId);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const reportKind = report as ReportKind;
  let header: string[];
  let rows: (string | number | null)[][];

  if (reportKind === "candidates-per-stage") {
    const data = await getCandidatesPerStageReport(user, jobId);
    header = ["Job", "Stage", "Position", "Candidate count"];
    rows = data.map((row) => [
      row.job.title,
      row.stage.name,
      String(row.stage.position),
      row.candidateCount,
    ]);
  } else if (reportKind === "assigned-per-user") {
    const data = await getAssignedPerUserReport(user, jobId);
    header = ["Assignee", "Username", "Job", "Assigned count"];
    rows = data.map((row) => [
      row.user?.name ?? "Unassigned",
      row.user?.username ?? "",
      row.job.title,
      row.candidateCount,
    ]);
  } else if (reportKind === "source-counts") {
    const data = await getSourceCountsReport(user, jobId);
    header = ["Source", "Candidate count"];
    rows = data.map((row) => [row.source, row.candidateCount]);
  } else {
    const data = await getAgingReport(user, jobId);
    header = ["Candidate", "Job", "Stage", "Days in stage", "Since"];
    rows = data.map((row) => [
      row.candidate.name,
      row.job.title,
      row.stage.name,
      row.daysInStage,
      row.updatedAt.toISOString(),
    ]);
  }

  const csv = toCsv([header, ...rows]);
  const filename = `report-${sanitizeFilename(reportKind)}.csv`;
  return csvResponse(filename, csv);
}