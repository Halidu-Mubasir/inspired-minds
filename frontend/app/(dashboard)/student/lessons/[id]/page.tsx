"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageError, DetailPageSkeleton } from "@/components/shared/detail-page-states";
import { LessonOverviewCard } from "@/components/lessons/lesson-overview-card";
import { LessonTopics } from "@/components/lessons/lesson-topics";
import { lessonsApi } from "@/lib/api/lessons";
import { queryKeys } from "@/lib/query-keys";

export default function StudentLessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lessonQuery = useQuery({ queryKey: queryKeys.lessons.detail(id), queryFn: () => lessonsApi.get(id) });

  if (lessonQuery.isPending) return <DetailPageSkeleton />;
  if (lessonQuery.isError) {
    return <DetailPageError error={lessonQuery.error} noun="Lesson" onRetry={() => lessonQuery.refetch()} />;
  }
  const lesson = lessonQuery.data;

  return (
    <div className="space-y-5 max-w-3xl">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <LessonOverviewCard lesson={lesson} counterpart="teacher" />

      {/* Topics (read-only for student) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonTopics lessonId={lesson.id} topics={lesson.topics} readOnly onChange={() => {}} />
        </CardContent>
      </Card>

      {lesson.student_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes from Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lesson.student_notes}</p>
          </CardContent>
        </Card>
      )}

      {lesson.homework && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lesson.homework}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
