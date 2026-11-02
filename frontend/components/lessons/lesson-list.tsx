"use client";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { LessonCard } from "@/components/lessons/lesson-card";
import { lessonsApi } from "@/lib/api/lessons";
import { queryKeys } from "@/lib/query-keys";

interface LessonListProps {
  /** Status tabs; "all" shows every status. */
  tabs: { value: string; label: string }[];
  basePath: string;
  personLabel: "teacher" | "student";
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}

/** Status-tabbed, paginated lesson grid for teachers and students. */
export function LessonList({ tabs, basePath, personLabel, emptyTitle, emptyDescription, emptyAction }: LessonListProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string> = { page: String(page) };
  if (activeTab !== "all") params.status = activeTab;

  const list = useQuery({
    queryKey: queryKeys.lessons.list(params),
    queryFn: () => lessonsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
  const lessons = list.data?.results ?? [];

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.isPending ? (
        <CardGridSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : lessons.length === 0 ? (
        <EmptyState icon={BookOpen} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} basePath={basePath} personLabel={personLabel} />
            ))}
          </div>
          <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
