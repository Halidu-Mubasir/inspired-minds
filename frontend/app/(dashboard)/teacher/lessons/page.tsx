"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { LessonList } from "@/components/lessons/lesson-list";
import { CreateLessonSheet } from "@/components/lessons/create-lesson-sheet";
import { queryKeys } from "@/lib/query-keys";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Drafts" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TeacherLessonsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lessons"
        subtitle="Plan and manage your lesson schedules."
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Plan Lesson
          </Button>
        }
      />

      <LessonList
        tabs={STATUS_TABS}
        basePath="/teacher/lessons"
        personLabel="student"
        emptyTitle="No lessons found"
        emptyDescription="Plan your first lesson to get started."
        emptyAction={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Plan Lesson
          </Button>
        }
      />

      <CreateLessonSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all })}
      />
    </div>
  );
}
