import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "accent";
};

const toneStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent text-accent-foreground",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
            toneStyles[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
