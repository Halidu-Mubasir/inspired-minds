"use client";
import { useEffect, useState } from "react";
import { Users, UserCheck, Link2, BookOpen } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { usersApi } from "@/lib/api/users";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total_teachers: 0, total_students: 0 });

  useEffect(() => {
    usersApi.getDashboardStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is an overview of your platform.</p>
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
          description="Registered students"
          icon={Users}
        />
        <StatCard
          title="Active Pairings"
          value="—"
          description="Ongoing teacher-student pairs"
          icon={Link2}
        />
        <StatCard
          title="Lessons This Week"
          value="—"
          description="Scheduled this week"
          icon={BookOpen}
        />
      </div>
    </div>
  );
}
