import { Badge } from "@/components/ui/badge";

export function JobStatusBadge({ status }: { status: "open" | "closed" }) {
  if (status === "open") {
    return (
      <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Open
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
      Closed
    </Badge>
  );
}
