"use client";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, MessageSquare, Brain } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { pairingsApi } from "@/lib/api/pairings";

export default function TeacherDashboardPage() {
  const [studentCount, setStudentCount] = useState<number | string>("—");

  useEffect(() => {
    pairingsApi
      .getMyStudents()
      .then((pairings) => setStudentCount(pairings.filter((p) => p.status === "active").length))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your students, lessons, and resources.</p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Students" value={studentCount} description="Students assigned to you" icon={GraduationCap} />
        <StatCard title="Upcoming Lessons" value="—" description="Scheduled this week" icon={BookOpen} />
        <StatCard title="Unread Messages" value="—" description="New chat messages" icon={MessageSquare} />
        <StatCard title="AI Tools" value="Available" description="Generate questions & summaries" icon={Brain} />
      </div>
    </div>
  );
}
