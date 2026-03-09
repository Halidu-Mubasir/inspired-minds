"use client";
import { useEffect, useState } from "react";
import { BookOpen, FileText, MessageSquare, Bot } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { pairingsApi } from "@/lib/api/pairings";
import type { Pairing } from "@/lib/api/pairings";

export default function StudentDashboardPage() {
  const [pairings, setPairings] = useState<Pairing[]>([]);

  useEffect(() => {
    pairingsApi
      .getMyTeachers()
      .then(setPairings)
      .catch(() => {});
  }, []);

  const activeTeacher = pairings.find((p) => p.status === "active");
  const teacherLabel = activeTeacher
    ? `${activeTeacher.teacher.first_name} ${activeTeacher.teacher.last_name}`
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Access your lessons, resources, and AI tutor.</p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Teacher" value={teacherLabel} description={activeTeacher?.subject ?? "No active pairing"} icon={BookOpen} />
        <StatCard title="Resources" value="—" description="Files from your teacher" icon={FileText} />
        <StatCard title="Unread Messages" value="—" description="From your teacher" icon={MessageSquare} />
        <StatCard title="AI Chatbot" value="Ready" description="Ask questions anytime" icon={Bot} />
      </div>
    </div>
  );
}
