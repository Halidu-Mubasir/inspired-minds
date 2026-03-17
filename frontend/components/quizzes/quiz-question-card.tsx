import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion, QuizAnswer } from "@/lib/api/quizzes";

type QuizQuestionMode = "teacher" | "taking" | "results";

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  mode: QuizQuestionMode;
  /** For "taking" mode: currently selected option id */
  selectedOptionId?: string;
  onSelectOption?: (questionId: string, optionId: string) => void;
  /** For "results" mode: the student's answer record */
  answer?: QuizAnswer;
}

export function QuizQuestionCard({
  question,
  index,
  mode,
  selectedOptionId,
  onSelectOption,
  answer,
}: QuizQuestionCardProps) {
  const typeLabel = question.question_type === "mcq" ? "MCQ" : "True/False";

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
          {index}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            <span className="text-xs text-muted-foreground">{question.points} pt{question.points !== 1 ? "s" : ""}</span>
          </div>
          <p className="text-sm font-medium leading-snug">{question.question_text}</p>
        </div>
      </div>

      <div className="space-y-2 pl-9">
        {question.options.map((opt) => {
          const isSelected = mode === "taking"
            ? selectedOptionId === opt.id
            : mode === "results"
            ? answer?.selected_option?.id === opt.id
            : false;

          const isCorrect = opt.is_correct;

          let optionClass = "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm cursor-default";

          if (mode === "teacher") {
            optionClass = cn(optionClass, isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "");
          } else if (mode === "taking") {
            optionClass = cn(optionClass, isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50 cursor-pointer");
          } else if (mode === "results") {
            if (isCorrect) {
              optionClass = cn(optionClass, "border-emerald-400 bg-emerald-50 text-emerald-800");
            } else if (isSelected && !isCorrect) {
              optionClass = cn(optionClass, "border-red-400 bg-red-50 text-red-700");
            }
          }

          return (
            <div
              key={opt.id}
              className={optionClass}
              onClick={() => mode === "taking" && onSelectOption?.(question.id, opt.id)}
            >
              {mode === "results" && (
                isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                ) : isSelected ? (
                  <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                ) : (
                  <span className="h-4 w-4 flex-shrink-0" />
                )
              )}
              {mode === "teacher" && isCorrect && (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              )}
              {mode === "taking" && (
                <span className={cn(
                  "h-4 w-4 rounded-full border-2 flex-shrink-0",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                )} />
              )}
              <span>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {/* Explanation — shown in results and teacher mode */}
      {(mode === "results" || mode === "teacher") && question.explanation && (
        <div className="pl-9">
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <span className="font-semibold">Explanation: </span>{question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
