import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, ListChecks } from "lucide-react";
import { LessonStatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { LessonSummary } from "@/lib/api/lessons";

interface LessonCardProps {
  lesson: LessonSummary;
  basePath: string;
  /** Which party to name on the card: the other side from the viewer. */
  personLabel?: "teacher" | "student";
}

export function LessonCard({ lesson, basePath, personLabel }: LessonCardProps) {
  const router = useRouter();
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
          <LessonStatusBadge status={lesson.status} className="text-xs flex-shrink-0" />
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
