import type { Metadata } from "next";
import { ClipboardList, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditAction, type AuditAction as AuditActionType } from "@/generated/prisma/client";
import { listAuditLogsForAdmin, type AuditLogListItem } from "@/features/audit/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Audit log · Recruitment",
};

type AdminAuditPageProps = {
  searchParams: Promise<{
    actor?: string | string[];
    action?: string | string[];
    entity?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseAction(value: string | undefined): AuditActionType | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(AuditAction).includes(value as AuditActionType)
    ? (value as AuditActionType)
    : undefined;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function metadataSummary(metadata: AuditLogListItem["metadata"]) {
  if (!metadata) {
    return "No metadata";
  }

  const json = JSON.stringify(metadata);
  return json.length > 180 ? `${json.slice(0, 177)}...` : json;
}

function humanizeAction(action: string) {
  return action.replaceAll("_", " ");
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const actor = firstParam(params.actor) ?? "";
  const entity = firstParam(params.entity) ?? "";
  const action = parseAction(firstParam(params.action));
  const logs = await listAuditLogsForAdmin({ actor, entity, action });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Admin-only history of recorded system activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by actor, action, or entity type/id.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" action="/admin/audit">
            <Input name="actor" defaultValue={actor} placeholder="Actor name, username, email" />
            <select
              name="action"
              defaultValue={action ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All actions</option>
              {Object.values(AuditAction).map((option) => (
                <option key={option} value={option}>
                  {humanizeAction(option)}
                </option>
              ))}
            </select>
            <Input name="entity" defaultValue={entity} placeholder="Entity type or id" />
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recorded activity</CardTitle>
          <CardDescription>{logs.length} matching entries, newest first</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ClipboardList className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No audit entries found</p>
              <p className="text-xs text-muted-foreground">
                Adjust filters or check again after activity is recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {log.actor ? `@${log.actor.username}` : "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{humanizeAction(log.action)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-sm">
                        {log.entityType}:{log.entityId}
                      </TableCell>
                      <TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground">
                        {metadataSummary(log.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
