"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Link2, BookOpen, Library, ShieldAlert, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { Panel, QuickActions, UpcomingLessons, WelcomeHeader } from "@/components/dashboard/dashboard-widgets";
import { useAuth } from "@/hooks/use-auth";
import { aiApi } from "@/lib/api/ai";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

const FLAGGED = { flagged: "true", page_size: "1" };

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isError } = useQuery({ queryKey: queryKeys.dashboardStats, queryFn: usersApi.getDashboardStats });
  const flagged = useQuery({ queryKey: queryKeys.ai.conversations(FLAGGED), queryFn: () => aiApi.getConversations(FLAGGED) });
  // "—" while loading or if the stats couldn't be fetched, never a misleading 0.
  const show = (value: number | undefined) => value ?? "—";
  const flaggedCount = flagged.data?.count;

  return (
    <div className="space-y-8">
      <WelcomeHeader
        firstName={user?.first_name}
        subtitle="Here's how the agency is doing today."
        action={
          <Button asChild>
            <Link href="/admin/pairings"><Link2 className="h-4 w-4" />Pair a student</Link>
          </Button>
        }
      />
      {isError && <p className="text-sm text-destructive">Couldn&apos;t load platform stats.</p>}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Teachers" value={show(data?.total_teachers)} description="Active on the platform" icon={UserCheck} href="/admin/teachers" />
        <StatCard title="Students" value={show(data?.total_students)} description="Active on the platform" icon={Users} href="/admin/students" />
        <StatCard title="Active pairings" value={show(data?.active_pairings)} description="Ongoing teacher–student pairs" icon={Link2} href="/admin/pairings" />
        <StatCard title="Lessons this week" value={show(data?.lessons_this_week)} description="Scheduled in the next 7 days" icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming lessons across the agency" className="lg:col-span-2">
          <UpcomingLessons
            withPerson={(l) => `${l.teacher_name} → ${l.student_name}`}
            emptyText="No lessons are scheduled yet. Teachers schedule lessons for their paired students."
          />
        </Panel>

        <div className="space-y-6">
          <Panel title="Safeguarding">
            <Link href="/admin/tutor-chats" className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-muted/50">
              <span
                className={
                  flaggedCount
                    ? "flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-destructive"
                    : "flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success"
                }
              >
                <ShieldAlert className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-2xl font-bold">{flaggedCount ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">
                  {flaggedCount ? "AI tutor chats need follow-up" : "No tutor chats need follow-up"}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Panel>

          <Panel title="Quick actions">
            <QuickActions
              actions={[
                { label: "Add a teacher", description: "Create a teacher account", href: "/admin/teachers", icon: UserPlus },
                { label: "Add a student", description: "Create a student account", href: "/admin/students", icon: Users },
                { label: "Manage the library", description: "Files every student can see", href: "/admin/library", icon: Library },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
