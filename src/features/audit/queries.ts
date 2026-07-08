import "server-only";

import { prisma } from "@/db/client";
import type { AuditAction } from "@/generated/prisma/client";

export type AuditLogFilters = {
  actor?: string;
  action?: AuditAction;
  entity?: string;
};

export type AuditLogListItem = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
};

function normalizeFilter(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function listAuditLogsForAdmin(
  filters: AuditLogFilters,
  limit = 100,
): Promise<AuditLogListItem[]> {
  const actor = normalizeFilter(filters.actor);
  const entity = normalizeFilter(filters.entity);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(filters.action ? { action: filters.action } : {}),
      ...(actor
        ? {
            actor: {
              OR: [
                { name: { contains: actor, mode: "insensitive" } },
                { username: { contains: actor, mode: "insensitive" } },
                { email: { contains: actor, mode: "insensitive" } },
              ],
            },
          }
        : {}),
      ...(entity
        ? {
            OR: [
              { entityType: { contains: entity, mode: "insensitive" } },
              { entityId: { contains: entity, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, name: true, username: true, email: true } },
    },
  });

  return logs.map((log) => ({
    ...log,
    metadata: isRecord(log.metadata) ? log.metadata : null,
  }));
}
