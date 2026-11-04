"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, MessageSquare, FileText, Plus, ShieldAlert, Sparkles, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { Panel, QuickActions, UpcomingLessons, WelcomeHeader } from "@/components/dashboard/dashboard-widgets";
import { useAuth } from "@/hooks/use-auth";
import { aiApi } from "@/lib/api/ai";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

const FLAGGED = { flagged: "true", page_size: "1" };

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { data, isError } = useQuery({ queryKey: queryKeys.mySummary, queryFn: usersApi.getMySummary });
  const flagged = useQuery({ queryKey: queryKeys.ai.conversations(FLAGGED), queryFn: () => aiApi.getConversations(FLAGGED) });
  // "—" while loading or if the summary couldn't be fetched, never a misleading 0.
  const show = (value: number | undefined) => value ?? "—";
  const flaggedCount = flagged.data?.count ?? 0;

  return (
    <div className="space-y-8">
      <WelcomeHeader
        firstName={user?.first_name}
        subtitle="Your teaching week at a glance."
        action={
          <Button asChild>
            <Link href="/teacher/lessons"><Plus className="h-4 w-4" />Plan a lesson</Link>
          </Button>
        }
      />
      {isError && <p className="text-sm text-destructive">Couldn&apos;t load your dashboard numbers.</p>}

      {flaggedCount > 0 && (
        <Link
          href="/teacher/tutor-chats"
          className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-danger-soft px-5 py-4 transition-colors hover:border-destructive/50"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {flaggedCount} AI tutor chat{flaggedCount === 1 ? "" : "s"} need{flaggedCount === 1 ? "s" : ""} your follow-up
            </p>
            <p className="text-xs text-muted-foreground">The tutor flagged a possible safety concern. Please read and follow up.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-destructive" />
        </Link>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My students" value={show(data?.active_pairings)} description="Active pairings" icon={GraduationCap} href="/teacher/students" />
        <StatCard title="Upcoming lessons" value={show(data?.upcoming_lessons)} description="In the next 7 days" icon={BookOpen} href="/teacher/lessons" />
        <StatCard
          title="Unread messages"
          value={show(data?.unread_messages)}
          description="From your students"
          icon={MessageSquare}
          href="/teacher/chat"
          highlight={!!data?.unread_messages}
        />
        <StatCard title="Shared files" value={show(data?.shared_files)} description="Files you've uploaded" icon={FileText} href="/teacher/resources" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming lessons" href="/teacher/lessons" className="lg:col-span-2">
          <UpcomingLessons
            hrefBase="/teacher/lessons"
            withPerson={(l) => l.student_name}
            emptyText="No scheduled lessons. Plan one and schedule it to share it with your student."
            emptyAction={
              <Button asChild size="sm" variant="outline">
                <Link href="/teacher/lessons"><Plus className="h-4 w-4" />Plan a lesson</Link>
              </Button>
            }
          />
        </Panel>

        <Panel title="Quick actions">
          <QuickActions
            actions={[
              { label: "Generate practice questions", description: "From a lesson or shared file", href: "/teacher/ai-tools", icon: Sparkles },
              { label: "Upload a resource", description: "Notes, past questions, answer sheets", href: "/teacher/resources", icon: Upload },
              { label: "Message a student", description: "Open your conversations", href: "/teacher/chat", icon: MessageSquare },
              { label: "Review tutor chats", description: "See how students use the AI tutor", href: "/teacher/tutor-chats", icon: ShieldAlert },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
