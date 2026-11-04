"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, CheckCircle, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DetailPageError, DetailPageSkeleton } from "@/components/shared/detail-page-states";
import { LessonStatusBadge } from "@/components/shared/status-badge";
import { LessonOverviewCard } from "@/components/lessons/lesson-overview-card";
import { LessonTopics } from "@/components/lessons/lesson-topics";
import { ResourceCard } from "@/components/resources/resource-card";
import { UploadResourceSheet } from "@/components/resources/upload-resource-sheet";
import { getErrorMessage } from "@/lib/api/errors";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonDetail } from "@/lib/api/lessons";
import { resourcesApi } from "@/lib/api/resources";
import { queryKeys } from "@/lib/query-keys";

type NoteField = "student_notes" | "teacher_notes" | "homework";

export default function TeacherLessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  const detailKey = queryKeys.lessons.detail(id);
  const lessonQuery = useQuery({ queryKey: detailKey, queryFn: () => lessonsApi.get(id) });
  const resourceParams = { lesson: id };
  const resourcesQuery = useQuery({
    queryKey: queryKeys.resources.list(resourceParams),
    queryFn: () => resourcesApi.getAll(resourceParams),
  });

  /** Store the server's copy of this lesson and refresh any lists that show it. */
  function storeLesson(updated: LessonDetail) {
    queryClient.setQueryData(detailKey, updated);
    queryClient.invalidateQueries({ queryKey: ["lessons", "list"] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) => lessonsApi.updateStatus(id, status),
    onSuccess: (updated) => {
      storeLesson(updated);
      toast.success(`Lesson marked as ${updated.status}`);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to update status")),
  });

  const notesMutation = useMutation({
    mutationFn: ({ field, value }: { field: NoteField; value: string }) => lessonsApi.update(id, { [field]: value }),
    onSuccess: storeLesson,
    onError: (error) => toast.error(getErrorMessage(error, "Failed to save")),
  });

  if (lessonQuery.isPending) return <DetailPageSkeleton />;
  if (lessonQuery.isError) {
    return <DetailPageError error={lessonQuery.error} noun="Lesson" onRetry={() => lessonQuery.refetch()} />;
  }
  const lesson = lessonQuery.data;
  const resources = resourcesQuery.data?.results ?? [];

  function saveNotes(field: NoteField, value: string) {
    if (value !== (lesson[field] ?? "")) notesMutation.mutate({ field, value });
  }

  const refreshResources = () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
  const busy = statusMutation.isPending;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <LessonStatusBadge status={lesson.status} />
          {lesson.status === "draft" || lesson.status === "cancelled" ? (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" disabled={busy}
              onClick={() => statusMutation.mutate("scheduled")}>
              <CalendarCheck className="h-3.5 w-3.5" /> Schedule
            </Button>
          ) : null}
          {lesson.status === "scheduled" || lesson.status === "draft" ? (
            <Button size="sm" className="gap-1.5 h-7 text-xs bg-success text-white hover:bg-success/90" disabled={busy}
              onClick={() => statusMutation.mutate("completed")}>
              <CheckCircle className="h-3.5 w-3.5" /> Mark Complete
            </Button>
          ) : null}
          {lesson.status !== "cancelled" && lesson.status !== "completed" ? (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive" disabled={busy}
              onClick={() => statusMutation.mutate("cancelled")}>
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <LessonOverviewCard lesson={lesson} counterpart="student" showStatus={false} />

      {/* Topics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonTopics
            lessonId={lesson.id}
            topics={lesson.topics}
            readOnly={false}
            onChange={(topics) => storeLesson({ ...lesson, topics })}
          />
        </CardContent>
      </Card>

      {/* Student Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Student Notes <span className="text-xs font-normal text-muted-foreground">(shared with student)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            defaultValue={lesson.student_notes ?? ""}
            rows={4}
            placeholder="Notes visible to the student..."
            onBlur={(e) => saveNotes("student_notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Homework */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            defaultValue={lesson.homework ?? ""}
            rows={3}
            placeholder="Homework assignment..."
            onBlur={(e) => saveNotes("homework", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Teacher Notes (private) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teacher Notes <span className="text-xs font-normal text-muted-foreground">(private — not visible to student)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            defaultValue={lesson.teacher_notes ?? ""}
            rows={3}
            placeholder="Your private notes..."
            onBlur={(e) => saveNotes("teacher_notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resources</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => setUploadSheetOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        </CardHeader>
        <CardContent>
          {resourcesQuery.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load this lesson&apos;s files.</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {resourcesQuery.isPending ? "Loading files…" : "No files attached to this lesson."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} canDelete onDeleted={refreshResources} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadResourceSheet
        open={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        onUploaded={refreshResources}
        defaultPairingId={lesson.pairing_id}
        defaultLessonId={lesson.id}
      />
    </div>
  );
}
