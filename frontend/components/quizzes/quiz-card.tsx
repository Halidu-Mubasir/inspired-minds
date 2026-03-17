import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizSummary } from "@/lib/api/quizzes";

interface QuizCardProps {
  quiz: QuizSummary;
  basePath: string;
  onPublish?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Student view: show attempt status instead of management actions */
  attemptStatus?: "not_started" | "in_progress" | "submitted";
  score?: number | null;
  totalPoints?: number | null;
}

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Archived", className: "bg-zinc-100 text-zinc-500" },
};

const attemptConfig = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  submitted: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

export function QuizCard({ quiz, basePath, onPublish, onDelete, attemptStatus, score, totalPoints }: QuizCardProps) {
  const router = useRouter();
  const quizStatus = statusConfig[quiz.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Badge className={cn("text-xs", quizStatus.className)}>{quizStatus.label}</Badge>
            {quiz.generated_by_ai && (
              <Badge className="text-xs bg-violet-100 text-violet-700 gap-1">
                <Brain className="h-3 w-3" />AI
              </Badge>
            )}
          </div>
          {attemptStatus && (
            <Badge className={cn("text-xs flex-shrink-0", attemptConfig[attemptStatus].className)}>
              {attemptConfig[attemptStatus].label}
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-1">{quiz.title}</h3>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-3">
          {quiz.subject && <Badge variant="outline" className="text-xs">{quiz.subject}</Badge>}
          <div className="flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""}</span>
          </div>
          {quiz.time_limit_minutes && <span>· {quiz.time_limit_minutes} min</span>}
          {quiz.student_name && <span>· {quiz.student_name}</span>}
        </div>

        {attemptStatus === "submitted" && score != null && totalPoints != null && (
          <p className="text-xs font-semibold text-emerald-700 mb-2">
            Score: {score}/{totalPoints} ({Math.round(score / totalPoints * 100)}%)
          </p>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => router.push(`${basePath}/${quiz.id}`)}
          >
            {attemptStatus ? (attemptStatus === "not_started" ? "Start" : "View") : "View"}
          </Button>
          {onPublish && quiz.status === "draft" && (
            <Button
              size="sm"
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => { e.stopPropagation(); onPublish(quiz.id); }}
            >
              Publish
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-red-500 hover:bg-red-50 border-red-200"
              onClick={(e) => { e.stopPropagation(); onDelete(quiz.id); }}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
