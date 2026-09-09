import { Badge } from "@/components/ui/badge";

export function JobListedBadge({ isPublished }: { isPublished: boolean }) {
  if (isPublished) {
    return (
      <Badge variant="outline" className="gap-1 text-sky-600 dark:text-sky-400">
        <span className="size-1.5 rounded-full bg-sky-500" aria-hidden="true" />
        Listed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
      Not listed
    </Badge>
  );
}
