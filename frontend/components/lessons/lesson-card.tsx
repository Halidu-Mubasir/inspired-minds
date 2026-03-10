import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonSummary } from "@/lib/api/lessons";

interface LessonCardProps {
  lesson: LessonSummary;
  basePath: string;
  personLabel?: string; // "student_name" or "teacher_name" depending on role
}

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function LessonCard({ lesson, basePath, personLabel }: LessonCardProps) {
  const router = useRouter();
  const status = statusConfig[lesson.status];
  const person = personLabel === "teacher" ? lesson.teacher_name : lesson.student_name;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`${basePath}/${lesson.id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(lesson.scheduled_date)}</span>
            {lesson.scheduled_time && (
              <>
                <span>·</span>
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatTime(lesson.scheduled_time)}</span>
              </>
            )}
          </div>
          <Badge className={cn("text-xs flex-shrink-0", status.className)}>{status.label}</Badge>
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-1">{lesson.title}</h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">{lesson.subject}</Badge>
          {person && <span className="truncate">· {person}</span>}
        </div>

        {lesson.topic_count > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            <span>{lesson.topic_count} topic{lesson.topic_count !== 1 ? "s" : ""}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 text-xs"
          onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/${lesson.id}`); }}
        >
          View
        </Button>
      </CardContent>
    </Card>
  );
}
