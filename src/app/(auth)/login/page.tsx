import { redirect } from "next/navigation";
import { ArrowUpRight, KanbanSquare, ShieldCheck, UsersRound } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/app-config";
import { getCurrentUser } from "@/server/auth/session";

const highlights = [
  {
    icon: KanbanSquare,
    title: "Kanban per job",
    description: "Track every candidate through configurable, job-specific stages.",
  },
  {
    icon: UsersRound,
    title: "Role-aware access",
    description: "Admin and user permissions enforced on every server request.",
  },
  {
    icon: ShieldCheck,
    title: "Audited history",
    description: "Stage moves, assignments, and comments preserved for review.",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <section
        className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(60rem 60rem at 110% -10%, color-mix(in oklch, var(--primary-foreground) 18%, transparent), transparent), radial-gradient(40rem 40rem at -10% 120%, color-mix(in oklch, var(--primary-foreground) 12%, transparent), transparent)",
          }}
        />
        <div className="relative flex items-center gap-2 text-lg font-semibold tracking-tight">
          <KanbanSquare className="size-6" aria-hidden="true" />
          <span>{APP_NAME}</span>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase">
              Internal workspace
            </span>
            <h1 className="max-w-md text-balance text-4xl font-semibold tracking-tight">
              Run hiring like a workflow, not a spreadsheet.
            </h1>
            <p className="max-w-md text-balance text-sm text-primary-foreground/80">
              Sign in to manage jobs, move candidates across stages, and keep your team aligned with
              a full audit trail.
            </p>
          </div>

          <ul className="space-y-3">
            {highlights.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-3 backdrop-blur-sm"
              >
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-primary-foreground/70">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {APP_NAME}. Internal use only.
        </p>
      </section>

      <section className="flex items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3 text-center lg:hidden">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KanbanSquare className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">Sign in with your internal account.</p>
          </div>

          <div className="hidden space-y-2 lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your internal account to continue.
            </p>
          </div>

          <LoginForm />

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            Need access?
            <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
              Contact an admin
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
