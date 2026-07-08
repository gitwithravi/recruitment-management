import path from "node:path";

import { prisma } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { readStoredFile } from "@/server/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  const { id, candidateId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (user.role !== "admin") {
    const membership = await prisma.jobUser.findUnique({
      where: { jobId_userId: { jobId: id, userId: user.id } },
      select: { id: true },
    });

    if (!membership) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId: id },
    select: { name: true, resumeFilePath: true },
  });

  if (!candidate) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readStoredFile(candidate.resumeFilePath);
    const fileName = path.basename(candidate.resumeFilePath).replace(/^\d+-/, "");

    return new Response(file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("resume download failed", error);
    return new Response("Resume file not found", { status: 404 });
  }
}
