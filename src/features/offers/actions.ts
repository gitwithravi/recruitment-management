"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import { writeAuditLog } from "@/server/audit";
import { requireAdmin } from "@/server/auth/session";

export type OfferFormState = {
  error?: string;
};

export async function upsertOfferAction(
  candidateId: string,
  _previousState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const user = await requireAdmin();

  const offeredCtc = formData.get("offeredCtc")
    ? String(formData.get("offeredCtc")).trim()
    : null;
  const offerDate = formData.get("offerDate")
    ? String(formData.get("offerDate")).trim()
    : null;
  const joiningDate = formData.get("joiningDate")
    ? String(formData.get("joiningDate")).trim()
    : null;
  const offerStatus = String(formData.get("offerStatus") ?? "not_offered").trim();

  const validStatuses = ["not_offered", "offered", "accepted", "rejected", "joined"];
  if (!validStatuses.includes(offerStatus)) {
    return { error: "Invalid offer status." };
  }

  let parsedCtc: number | null = null;
  if (offeredCtc) {
    if (!/^\d+(\.\d{1,2})?$/.test(offeredCtc)) {
      return { error: "Offered CTC must be a number with up to 2 decimals." };
    }
    parsedCtc = Number(offeredCtc);
    if (parsedCtc < 0 || parsedCtc > 9999999999.99) {
      return { error: "Offered CTC must be between 0 and 9,999,999,999.99." };
    }
  }

  let parsedOfferDate: Date | null = null;
  if (offerDate) {
    parsedOfferDate = new Date(offerDate);
    if (isNaN(parsedOfferDate.getTime())) {
      return { error: "Invalid offer date." };
    }
  }

  let parsedJoiningDate: Date | null = null;
  if (joiningDate) {
    parsedJoiningDate = new Date(joiningDate);
    if (isNaN(parsedJoiningDate.getTime())) {
      return { error: "Invalid joining date." };
    }
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, name: true, jobId: true },
    });

    if (!candidate) {
      return { error: "This candidate no longer exists." };
    }

    const existing = await prisma.candidateOfferDetails.findUnique({
      where: { candidateId },
      select: { id: true },
    });

    const actionType = existing ? "offer_updated" as const : "offer_created" as const;

    await prisma.$transaction(async (tx) => {
      const offer = await tx.candidateOfferDetails.upsert({
        where: { candidateId },
        create: {
          candidateId,
          offeredCtc: parsedCtc,
          offerDate: parsedOfferDate,
          joiningDate: parsedJoiningDate,
          offerStatus: offerStatus as "not_offered" | "offered" | "accepted" | "rejected" | "joined",
        },
        update: {
          offeredCtc: parsedCtc,
          offerDate: parsedOfferDate,
          joiningDate: parsedJoiningDate,
          offerStatus: offerStatus as "not_offered" | "offered" | "accepted" | "rejected" | "joined",
        },
        select: { id: true },
      });

      await writeAuditLog(tx, {
        actorId: user.id,
        action: actionType,
        entityType: "offer",
        entityId: offer.id,
        metadata: {
          jobId: candidate.jobId,
          candidateId,
          candidateName: candidate.name,
          offeredCtc: parsedCtc,
          offerStatus,
        },
      });
    });

    revalidatePath(`/jobs/${candidate.jobId}/candidates/${candidateId}`);
    return {};
  } catch (error) {
    console.error("upsertOfferAction failed", error);
    return { error: "Could not save offer details. Please try again." };
  }
}
