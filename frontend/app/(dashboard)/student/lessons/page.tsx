"use client";
import { useEffect, useState, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LessonCard } from "@/components/lessons/lesson-card";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonSummary } from "@/lib/api/lessons";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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

  return (
    <div className="space-y-5">
      <PageHeader title="My Lessons" subtitle="View your scheduled lesson plans." />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons yet"
          description="Your teacher has not scheduled any lessons yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} basePath="/student/lessons" personLabel="teacher" />
          ))}
        </div>
      )}
    </div>
  );
}
