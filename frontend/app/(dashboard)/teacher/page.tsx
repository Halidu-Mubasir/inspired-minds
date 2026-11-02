"use client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, MessageSquare, FileText } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

export default function TeacherDashboardPage() {
  const { data, isError } = useQuery({ queryKey: queryKeys.mySummary, queryFn: usersApi.getMySummary });
  // "—" while loading or if the summary couldn't be fetched, never a misleading 0.
  const show = (value: number | undefined) => value ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your students, lessons, and resources.</p>
        {isError && <p className="text-sm text-destructive mt-2">Couldn&apos;t load your dashboard numbers.</p>}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Students" value={show(data?.active_pairings)} description="Active pairings" icon={GraduationCap} />
        <StatCard title="Upcoming Lessons" value={show(data?.upcoming_lessons)} description="Scheduled in the next 7 days" icon={BookOpen} />
        <StatCard title="Unread Messages" value={show(data?.unread_messages)} description="From your students" icon={MessageSquare} />
        <StatCard title="Shared Files" value={show(data?.shared_files)} description="Files you've uploaded" icon={FileText} />
      </div>
    </div>
  );
}
