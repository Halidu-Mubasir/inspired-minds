"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Link2, BookOpen } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

export default function AdminDashboardPage() {
  const { data, isError } = useQuery({ queryKey: queryKeys.dashboardStats, queryFn: usersApi.getDashboardStats });
  // "—" while loading or if the stats couldn't be fetched, never a misleading 0.
  const stats = {
    total_teachers: data?.total_teachers ?? "—",
    total_students: data?.total_students ?? "—",
    active_pairings: data?.active_pairings ?? "—",
    lessons_this_week: data?.lessons_this_week ?? "—",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is an overview of your platform.</p>
        {isError && <p className="text-sm text-destructive mt-2">Couldn&apos;t load platform stats.</p>}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Teachers"
          value={stats.total_teachers}
          description="Active teachers on the platform"
          icon={UserCheck}
        />
        <StatCard
          title="Total Students"
          value={stats.total_students}
          description="Active students on the platform"
          icon={Users}
        />
        <StatCard
          title="Active Pairings"
          value={stats.active_pairings}
          description="Ongoing teacher-student pairs"
          icon={Link2}
        />
        <StatCard
          title="Lessons This Week"
          value={stats.lessons_this_week}
          description="Scheduled in the next 7 days"
          icon={BookOpen}
        />
      </div>
    </div>
  );
}
