import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidateHistoryTimelineItem } from "@/features/candidates/queries";

type CandidateHistoryTimelineProps = {
  items: CandidateHistoryTimelineItem[];
};

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function groupByDate(items: CandidateHistoryTimelineItem[]) {
  const groups = new Map<string, CandidateHistoryTimelineItem[]>();

  for (const item of items) {
    const key = formatDateKey(item.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()];
}

export function CandidateHistoryTimeline({ items }: CandidateHistoryTimelineProps) {
  const groups = groupByDate(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Candidate timeline</CardTitle>
        <CardDescription>
          Unified history of stage moves, assignments, comments, resume changes, and offers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history has been recorded yet.</p>
        ) : (
          <div className="space-y-6">
            {groups.map(([date, group]) => (
              <section key={date} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {date}
                </h3>
                <ol className="space-y-4 border-l pl-4">
                  {group.map((item) => (
                    <li key={item.id} className="relative space-y-1">
                      <span
                        className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-foreground"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.visibility === "admin" ? "destructive" : "secondary"}>
                          {item.badge}
                        </Badge>
                        <p className="text-sm font-medium">{item.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.createdAt)}
                        {item.actor ? ` by @${item.actor.username}` : ""}
                      </p>
                      {item.description ? (
                        <p className="whitespace-pre-line rounded-lg border bg-muted/30 px-3 py-2 text-sm leading-6">
                          {item.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
