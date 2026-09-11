import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

export function OperationsPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-12">
        <section className="flex flex-col justify-between gap-5 border-b border-border/70 pb-7 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary"><span className="h-px w-6 bg-primary/60" />{eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <Badge variant="outline" className="w-fit gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">
            <LockKeyhole className="h-3.5 w-3.5" /> LLC-controlled workspace
          </Badge>
        </section>
        {children}
        <footer className="flex flex-col justify-between gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row">
          <span>All actions require explicit rules, validation, and an activity record.</span>
          <Button variant="ghost" size="sm" className="h-auto w-fit gap-1 px-0 text-xs text-primary hover:bg-transparent hover:text-primary">
            Review operating architecture <ArrowUpRight className="h-3 w-3" />
          </Button>
        </footer>
      </div>
    </DashboardLayout>
  );
}
