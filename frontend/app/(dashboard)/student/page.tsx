"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bot, Clock, FileText, Library, MessageSquare, GraduationCap, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { PairingStatusBadge } from "@/components/shared/status-badge";
import {
  Panel, QuickActions, UpcomingLessons, WelcomeHeader, dayLabel, useUpcomingLessons,
} from "@/components/dashboard/dashboard-widgets";
import { useAuth } from "@/hooks/use-auth";
import { pairingsApi } from "@/lib/api/pairings";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { formatTime, getInitials } from "@/lib/utils";

function NextLessonCard() {
  const { data, isPending } = useUpcomingLessons();
  const next = data?.results[0];

  if (isPending) return <Skeleton className="h-40 rounded-2xl" />;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,var(--gold),transparent)] opacity-32" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,var(--leaf),transparent)] opacity-64" aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">Your next lesson</p>
        {next ? (
          <>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{next.title}</h2>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {next.subject} with {next.teacher_name}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm">
                <Clock className="h-3.5 w-3.5" />
                {dayLabel(next.scheduled_date)}
                {next.scheduled_time && ` · ${formatTime(next.scheduled_time)}`} · {next.duration_minutes} min
              </span>
              <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link href={`/student/lessons/${next.id}`}>
                  View lesson plan <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-2xl font-semibold">Nothing scheduled yet</h2>
            <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
              Your teacher will schedule your next lesson. Meanwhile, revise with the library or ask the AI tutor.
            </p>
            <Button asChild size="sm" className="mt-5 bg-gold text-gold-foreground hover:bg-gold/90">
              <Link href="/student/tutor">Ask the AI tutor <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const teachers = useQuery({ queryKey: queryKeys.pairings.myTeachers, queryFn: pairingsApi.getMyTeachers });
  const { data: summary, isError } = useQuery({ queryKey: queryKeys.mySummary, queryFn: usersApi.getMySummary });
  // "—" while loading or if the summary couldn't be fetched, never a misleading 0.
  const show = (value: number | undefined) => value ?? "—";

  return (
    <div className="space-y-8">
      <WelcomeHeader firstName={user?.first_name} subtitle="Here's what's coming up in your learning." />
      {isError && <p className="text-sm text-destructive">Couldn&apos;t load your dashboard numbers.</p>}

      <NextLessonCard />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard title="Upcoming lessons" value={show(summary?.upcoming_lessons)} description="In the next 7 days" icon={BookOpen} href="/student/lessons" />
        <StatCard
          title="Unread messages"
          value={show(summary?.unread_messages)}
          description="From your teacher"
          icon={MessageSquare}
          href="/student/chat"
          highlight={!!summary?.unread_messages}
        />
        <StatCard title="Shared files" value={show(summary?.shared_files)} description="From your teacher" icon={FileText} href="/student/resources" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming lessons" href="/student/lessons" className="lg:col-span-2">
          <UpcomingLessons
            hrefBase="/student/lessons"
            withPerson={(l) => l.teacher_name}
            emptyText="No lessons scheduled. They'll appear here as soon as your teacher plans them."
          />
        </Panel>

        <div className="space-y-6">
          <Panel title="My teachers">
            {teachers.isPending ? (
              <div className="p-5"><Skeleton className="h-12" /></div>
            ) : (teachers.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm text-muted-foreground">You&apos;ll see your teacher here once the agency pairs you.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {(teachers.data ?? []).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.teacher.avatar ?? undefined} alt="" />
                      <AvatarFallback className="bg-secondary text-primary text-xs font-semibold">
                        {getInitials(p.teacher.first_name, p.teacher.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.teacher.first_name} {p.teacher.last_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.subject}</p>
                    </div>
                    <PairingStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Quick actions">
            <QuickActions
              actions={[
                { label: "Ask the AI tutor", description: "Get unstuck on homework, step by step", href: "/student/tutor", icon: Bot },
                { label: "Message your teacher", description: "Questions about a lesson", href: "/student/chat", icon: MessageSquare },
                { label: "Browse the library", description: "Past questions and notes", href: "/student/library", icon: Library },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
