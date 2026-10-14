import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatApplyByDate,
  getJobPostingChips,
  type JobPostingFields,
} from "@/features/jobs/posting";

export function CareersJobMeta({ job }: { job: JobPostingFields }) {
  const chips = getJobPostingChips(job);

  if (chips.length === 0 && !job.applyBy) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary">
          {chip}
        </Badge>
      ))}
      {job.applyBy ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          Apply by {formatApplyByDate(job.applyBy)}
        </span>
      ) : null}
    </div>
  );
}
