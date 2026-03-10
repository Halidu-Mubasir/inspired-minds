"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CalendarDays, CheckCircle, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LessonTopics } from "@/components/lessons/lesson-topics";
import { ResourceCard } from "@/components/resources/resource-card";
import { UploadResourceSheet } from "@/components/resources/upload-resource-sheet";
import { lessonsApi } from "@/lib/api/lessons";
import { resourcesApi } from "@/lib/api/resources";
import type { LessonDetail } from "@/lib/api/lessons";
import type { Resource } from "@/lib/api/resources";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const d = new Date(); d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function TeacherLessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  useEffect(() => {
    lessonsApi.get(id).then(setLesson).catch(() => {}).finally(() => setLoading(false));
    resourcesApi.getAll({ lesson_id: id }).then((res) => setResources(res.results ?? (res as unknown as Resource[]))).catch(() => {});
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!lesson) return;
    setSaving("status");
    try {
      const updated = await lessonsApi.updateStatus(id, newStatus);
      setLesson(updated);
      toast.success(`Lesson marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(null);
    }
  }

  async function handleNotesBlur(field: "student_notes" | "teacher_notes" | "homework", value: string) {
    if (!lesson) return;
    if (value === (lesson[field] ?? "")) return;
    try {
      const updated = await lessonsApi.update(id, { [field]: value });
      setLesson(updated);
    } catch {
      toast.error("Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!lesson) return <div className="text-center py-16 text-muted-foreground">Lesson not found.</div>;

  const status = statusConfig[lesson.status];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={status.className}>{status.label}</Badge>
          {lesson.status === "scheduled" || lesson.status === "draft" ? (
            <Button size="sm" className="gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={!!saving}
              onClick={() => handleStatusChange("completed")}>
              <CheckCircle className="h-3.5 w-3.5" /> Mark Complete
            </Button>
          ) : null}
          {lesson.status !== "cancelled" && lesson.status !== "completed" ? (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive" disabled={!!saving}
              onClick={() => handleStatusChange("cancelled")}>
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Info */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-1">{lesson.title}</h2>
          {lesson.description && <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatDate(lesson.scheduled_date)}
            </span>
            {lesson.scheduled_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {formatTime(lesson.scheduled_time)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {lesson.duration_minutes} min
            </span>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge variant="outline">{lesson.subject}</Badge>
            <span className="text-sm text-muted-foreground">
              Student: {lesson.student.first_name} {lesson.student.last_name}
            </span>
          </div>
        </CardContent>
      </Card>

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
            onChange={(topics) => setLesson({ ...lesson, topics })}
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
            onBlur={(e) => handleNotesBlur("student_notes", e.target.value)}
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
            onBlur={(e) => handleNotesBlur("homework", e.target.value)}
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
            onBlur={(e) => handleNotesBlur("teacher_notes", e.target.value)}
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
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files attached to this lesson.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  canDelete
                  onDeleted={(deletedId) => setResources((prev) => prev.filter((x) => x.id !== deletedId))}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadResourceSheet
        open={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        onUploaded={(r) => setResources((prev) => [r, ...prev])}
        defaultPairingId={lesson.pairing_id}
        defaultLessonId={lesson.id}
      />
    </div>
  );
}
