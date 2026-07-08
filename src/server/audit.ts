import "server-only";

import type { AuditAction, Prisma, PrismaClient } from "@/generated/prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

export type WriteAuditLogInput = {
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(tx: Tx, input: WriteAuditLogInput) {
  return tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
    select: { id: true },
  });
}

export type WriteCandidateHistoryInput = {
  actorId: string | null;
  action: AuditAction;
  candidateId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
};

export async function writeCandidateHistory(tx: Tx, input: WriteCandidateHistoryInput) {
  return writeAuditLog(tx, {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType ?? "candidate",
    entityId: input.entityId ?? input.candidateId,
    metadata: {
      ...(input.metadata ?? {}),
      candidateId: input.candidateId,
    },
  });
}
