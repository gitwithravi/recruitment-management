import { ArrowRight, KanbanSquare, ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="outline">Authentication enabled</Badge>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">Recruitment workflow</h1>
          <p className="text-muted-foreground">
            Phase 2 protects the application with internal login, signed httpOnly sessions,
            role-aware server guards, and inactive-user checks.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KanbanSquare className="size-4" aria-hidden="true" />
              Job boards
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Future phases add per-job Kanban stages and candidate cards.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="size-4" aria-hidden="true" />
              Internal users
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Admin and user access rules are enforced server-side.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Guarded sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Inactive users are rejected during sign-in and current-user lookup.
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Next step: Admin user management.</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            development_plan.md <ArrowRight className="size-4" aria-hidden="true" /> Phase 3
          </span>
        </div>
      </section>
    </div>
  );
}
