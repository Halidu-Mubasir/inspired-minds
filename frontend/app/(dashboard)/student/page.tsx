"use client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, MessageSquare, GraduationCap } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { pairingsApi } from "@/lib/api/pairings";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

export default function StudentDashboardPage() {
  const { data: pairings = [] } = useQuery({ queryKey: queryKeys.pairings.myTeachers, queryFn: pairingsApi.getMyTeachers });
  const { data: summary, isError } = useQuery({ queryKey: queryKeys.mySummary, queryFn: usersApi.getMySummary });
  const show = (value: number | undefined) => value ?? "—";

  const activeTeacher = pairings.find((p) => p.status === "active");
  const teacherLabel = activeTeacher
    ? `${activeTeacher.teacher.first_name} ${activeTeacher.teacher.last_name}`
    : "—";
  const otherTeachers = pairings.length > 1 ? ` (+${pairings.length - 1} more)` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Access your lessons, resources, and messages.</p>
        {isError && <p className="text-sm text-destructive mt-2">Couldn&apos;t load your dashboard numbers.</p>}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Teacher"
          value={teacherLabel}
          description={activeTeacher ? `${activeTeacher.subject}${otherTeachers}` : "No active pairing"}
          icon={GraduationCap}
        />
        <StatCard title="Upcoming Lessons" value={show(summary?.upcoming_lessons)} description="Scheduled in the next 7 days" icon={BookOpen} />
        <StatCard title="Unread Messages" value={show(summary?.unread_messages)} description="From your teacher" icon={MessageSquare} />
        <StatCard title="Resources" value={show(summary?.shared_files)} description="Files from your teacher" icon={FileText} />
      </div>
    </div>
  );
}
