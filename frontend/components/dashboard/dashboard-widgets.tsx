"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ArrowRight, CalendarDays, ChevronRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonSummary } from "@/lib/api/lessons";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatTime } from "@/lib/utils";

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHeader({ firstName, subtitle, action }: { firstName?: string; subtitle: string; action?: React.ReactNode }) {
  const now = new Date();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{format(now, "EEEE, d MMMM")}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {greeting(now)}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** A titled card section on a dashboard. */
export function Panel({
  title, href, linkLabel = "View all", children, className,
}: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-xs", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
            {linkLabel}<ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function dayLabel(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

function DateTile({ date, emphasis }: { date: string; emphasis?: boolean }) {
  const d = parseISO(date);
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
        emphasis ? "bg-gold text-gold-foreground" : "bg-secondary text-primary"
      )}
    >
      <span className="text-[10px] font-semibold uppercase">{format(d, "MMM")}</span>
      <span className="mt-0.5 text-lg font-bold">{format(d, "d")}</span>
    </div>
  );
}

export const upcomingLessonParams = (pageSize = 5) => ({
  status: "scheduled",
  from_date: format(new Date(), "yyyy-MM-dd"),
  ordering: "scheduled_date",
  page_size: String(pageSize),
});

export function useUpcomingLessons(pageSize = 5) {
  const params = upcomingLessonParams(pageSize);
  return useQuery({ queryKey: queryKeys.lessons.list(params), queryFn: () => lessonsApi.getAll(params) });
}

/** Scheduled lessons from today on. `withPerson` names the other side of the pairing. */
export function UpcomingLessons({
  hrefBase, withPerson, emptyText, emptyAction,
}: {
  hrefBase?: string;
  withPerson: (lesson: LessonSummary) => string;
  emptyText: string;
  emptyAction?: React.ReactNode;
}) {
  const query = useUpcomingLessons();

  if (query.isPending) {
    return <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>;
  }
  if (query.isError) return <div className="p-5"><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>;
  const lessons = query.data.results;
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <CalendarDays className="h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {lessons.map((lesson, i) => {
        const row = (
          <>
            <DateTile date={lesson.scheduled_date} emphasis={i === 0} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{lesson.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {lesson.subject} · {withPerson(lesson)}
              </p>
            </div>
            <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
              <p className="font-medium text-foreground">{dayLabel(lesson.scheduled_date)}</p>
              <p className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                {lesson.scheduled_time ? formatTime(lesson.scheduled_time) : "Time TBC"} · {lesson.duration_minutes} min
              </p>
            </div>
          </>
        );
        return (
          <li key={lesson.id}>
            {hrefBase ? (
              <Link href={`${hrefBase}/${lesson.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-4 px-5 py-3.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <ul className="divide-y">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <li key={a.href}>
            <Link href={a.href} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
