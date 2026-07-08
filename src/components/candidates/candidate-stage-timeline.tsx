import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidateStageTimelineItem } from "@/features/candidates/queries";

type CandidateStageTimelineProps = {
  items: CandidateStageTimelineItem[];
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

export function CandidateStageTimeline({ items }: CandidateStageTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stage movement history</CardTitle>
        <CardDescription>Every stage change recorded for this candidate.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stage movement has been recorded yet.</p>
        ) : (
          <ol className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="relative pl-5">
                <span
                  className="absolute top-1.5 left-0 size-2 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span>{item.fromStage?.name ?? "Created"}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>{item.toStage.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)} by @{item.movedBy.username}
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
