import { ArrowRight, UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidateAssignmentTimelineItem } from "@/features/candidates/queries";

type CandidateAssignmentTimelineProps = {
  items: CandidateAssignmentTimelineItem[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function assigneeLabel(assignee: CandidateAssignmentTimelineItem["previousAssignee"] | null) {
  return assignee ? `@${assignee.username}` : "Unassigned";
}

export function CandidateAssignmentTimeline({ items }: CandidateAssignmentTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assignment history</CardTitle>
        <CardDescription>Every assignment change recorded for this candidate.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assignment changes recorded yet.</p>
        ) : (
          <ol className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="relative pl-5">
                <span
                  className="absolute top-1 left-0 inline-flex size-3 items-center justify-center rounded-full bg-foreground text-background"
                  aria-hidden="true"
                >
                  <UserRound className="size-2" />
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span>{assigneeLabel(item.previousAssignee)}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>{assigneeLabel(item.newAssignee)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)} by @{item.assignedBy.username}
                  </p>
                  {item.comment ? (
                    <p className="whitespace-pre-line rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                      {item.comment}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
