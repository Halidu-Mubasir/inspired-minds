"use client";
import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LessonCard } from "@/components/lessons/lesson-card";
import { CreateLessonSheet } from "@/components/lessons/create-lesson-sheet";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonSummary, LessonDetail } from "@/lib/api/lessons";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Drafts" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TeacherLessonsPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab !== "all") params.status = activeTab;
      const data = await lessonsApi.getAll(params);
      setLessons(data.results);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  function handleCreated(lesson: LessonDetail) {
    const summary: LessonSummary = {
      id: lesson.id,
      title: lesson.title,
      status: lesson.status,
      scheduled_date: lesson.scheduled_date,
      scheduled_time: lesson.scheduled_time,
      duration_minutes: lesson.duration_minutes,
      pairing_id: lesson.pairing_id,
      subject: lesson.subject,
      teacher_name: `${lesson.teacher.first_name} ${lesson.teacher.last_name}`,
      student_name: `${lesson.student.first_name} ${lesson.student.last_name}`,
      topic_count: 0,
      updated_at: lesson.updated_at,
    };
    setLessons((prev) => [summary, ...prev]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lessons"
        subtitle="Plan and manage your lesson schedules."
        action={
          <Button size="sm" className="gap-1.5 bg-white text-slate-900 hover:bg-slate-100" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Plan Lesson
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons found"
          description="Plan your first lesson to get started."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Plan Lesson
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} basePath="/teacher/lessons" personLabel="student" />
          ))}
        </div>
      )}

      <CreateLessonSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
