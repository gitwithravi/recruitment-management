import { prisma } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { readAttachmentFile } from "@/server/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string; attachmentId: string }> },
) {
  const { id, commentId, attachmentId } = await params;
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

  const attachment = await prisma.commentAttachment.findFirst({
    where: {
      id: attachmentId,
      commentId,
      comment: {
        deletedAt: null,
        candidate: { jobId: id },
      },
    },
    select: {
      fileName: true,
      filePath: true,
      mimeType: true,
      comment: {
        select: {
          visibility: true,
        },
      },
    },
  });

  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  if (attachment.comment.visibility === "admin" && user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const file = await readAttachmentFile(attachment.filePath);
    const originalName = attachment.fileName;

    return new Response(file, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${originalName}"`,
      },
    });
  } catch (error) {
    console.error("attachment download failed", error);
    return new Response("Attachment file not found", { status: 404 });
  }
}
