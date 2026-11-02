import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LessonStatusBadge } from "@/components/shared/status-badge";
import { formatLongDate, formatTime } from "@/lib/utils";
import type { LessonDetail } from "@/lib/api/lessons";

interface LessonOverviewCardProps {
  lesson: LessonDetail;
  /** The other party, named under the title. */
  counterpart: "teacher" | "student";
  /** Teachers show the status beside their action buttons instead. */
  showStatus?: boolean;
}

export function LessonOverviewCard({ lesson, counterpart, showStatus = true }: LessonOverviewCardProps) {
  const person = lesson[counterpart];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-xl font-bold">{lesson.title}</h2>
          {showStatus && <LessonStatusBadge status={lesson.status} />}
        </div>
        {lesson.description && <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatLongDate(lesson.scheduled_date)}
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
          <span className="text-sm text-muted-foreground capitalize">
            {counterpart}: {person.first_name} {person.last_name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
