import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import type { QuizAttempt } from "@/lib/api/quizzes";

interface QuizResultsSummaryProps {
  attempt: QuizAttempt;
}

export function QuizResultsSummary({ attempt }: QuizResultsSummaryProps) {
  const score = attempt.score ?? 0;
  const total = attempt.total_points ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
  const bgColor = pct >= 80 ? "bg-emerald-50 border-emerald-200" : pct >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <Card className={`border-2 ${bgColor}`}>
        <CardContent className="p-6 flex flex-col items-center text-center">
          <Trophy className={`h-10 w-10 mb-3 ${color}`} />
          <p className={`text-4xl font-bold ${color}`}>{pct}%</p>
          <p className="text-muted-foreground text-sm mt-1">
            {score} / {total} points
          </p>
          <Badge className={`mt-3 ${pct >= 80 ? "bg-emerald-100 text-emerald-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
            {pct >= 80 ? "Excellent" : pct >= 50 ? "Good effort" : "Keep practicing"}
          </Badge>
        </CardContent>
      </Card>

      {/* Per-question stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{attempt.answers.filter(a => a.is_correct).length}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{attempt.answers.filter(a => !a.is_correct).length}</p>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </div>
      </div>
    </div>
  );
}
