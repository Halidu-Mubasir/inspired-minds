"use client";
import { PageHeader } from "@/components/shared/page-header";
import { LessonList } from "@/components/lessons/lesson-list";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

export default function StudentLessonsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="My Lessons" subtitle="View your scheduled lesson plans." />
      <LessonList
        tabs={STATUS_TABS}
        basePath="/student/lessons"
        personLabel="teacher"
        emptyTitle="No lessons yet"
        emptyDescription="Your teacher has not scheduled any lessons yet."
      />
    </div>
  );
}
