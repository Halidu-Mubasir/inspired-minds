"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonTopics } from "@/components/lessons/lesson-topics";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonDetail } from "@/lib/api/lessons";

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

export default function StudentLessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lessonsApi.get(id).then(setLesson).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!lesson) return <div className="text-center py-16 text-muted-foreground">Lesson not found.</div>;

  const status = statusConfig[lesson.status];

  return (
    <div className="space-y-5 max-w-3xl">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-xl font-bold">{lesson.title}</h2>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
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
              Teacher: {lesson.teacher.first_name} {lesson.teacher.last_name}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Topics (read-only for student) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonTopics
            lessonId={lesson.id}
            topics={lesson.topics}
            readOnly={true}
            onChange={() => {}}
          />
          {lesson.topics.length === 0 && <p className="text-sm text-muted-foreground">No topics listed.</p>}
        </CardContent>
      </Card>

      {/* Student Notes */}
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

      {/* Homework */}
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
