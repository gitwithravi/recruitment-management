import "server-only";

import { prisma } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";

export type OfferDetail = {
  id: string;
  candidateId: string;
  offeredCtc: string | null;
  offerDate: Date | null;
  joiningDate: Date | null;
  offerStatus: "not_offered" | "offered" | "accepted" | "rejected" | "joined";
  createdAt: Date;
  updatedAt: Date;
};

function decimalToString(value: { toString(): string } | null) {
  return value ? value.toString() : null;
}

export async function getOfferForCandidate(
  candidateId: string,
): Promise<OfferDetail | null> {
  await requireAdmin();

  const offer = await prisma.candidateOfferDetails.findUnique({
    where: { candidateId },
    select: {
      id: true,
      candidateId: true,
      offeredCtc: true,
      offerDate: true,
      joiningDate: true,
      offerStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!offer) {
    return null;
  }

  return {
    id: offer.id,
    candidateId: offer.candidateId,
    offeredCtc: decimalToString(offer.offeredCtc),
    offerDate: offer.offerDate,
    joiningDate: offer.joiningDate,
    offerStatus: offer.offerStatus,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
}
