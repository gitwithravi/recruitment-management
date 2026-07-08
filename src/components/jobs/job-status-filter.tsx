import Link from "next/link";

import { cn } from "@/lib/utils";
import type { JobStatusFilter as JobStatusFilterValue } from "@/features/jobs/queries";

const filters: { label: string; value: JobStatusFilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

export function JobStatusFilter({ active }: { active: JobStatusFilterValue }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filter jobs by status">
      {filters.map((filter) => (
        <Link
          key={filter.value}
          href={filter.value === "all" ? "/jobs" : `/jobs?status=${filter.value}`}
          aria-current={active === filter.value ? "page" : undefined}
          className={cn(
            "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
            active === filter.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
