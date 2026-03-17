"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Archive, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { QuizQuestionCard } from "@/components/quizzes/quiz-question-card";
import { quizzesApi } from "@/lib/api/quizzes";
import type { QuizDetail, TeacherAttemptResult } from "@/lib/api/quizzes";

const statusBadge = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-zinc-100 text-zinc-500",
};

export default function TeacherQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [results, setResults] = useState<TeacherAttemptResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [q, r] = await Promise.all([
          quizzesApi.get(id),
          quizzesApi.getResults(id).catch(() => []),
        ]);
        setQuiz(q);
        setResults(Array.isArray(r) ? r as TeacherAttemptResult[] : []);
      } catch {
        toast.error("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handlePublish() {
    if (!quiz) return;
    try {
      const updated = await quizzesApi.publish(quiz.id);
      setQuiz(updated);
      toast.success("Quiz published!");
    } catch {
      toast.error("Failed to publish.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg truncate">{quiz.title}</h1>
              <Badge className={statusBadge[quiz.status]}>{quiz.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {quiz.subject && <span>{quiz.subject} · </span>}
              {quiz.student_name} · {quiz.question_count} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {quiz.status === "draft" && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePublish}>
              <CheckCircle className="h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Questions */}
        <section>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Questions ({quiz.question_count})
          </h2>
          <div className="space-y-4">
            {quiz.questions.map((q, i) => (
              <QuizQuestionCard key={q.id} question={q} index={i + 1} mode="teacher" />
            ))}
          </div>
        </section>

        {/* Results */}
        {quiz.status === "published" && (
          <section>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" /> Student Results ({results.length})
            </h2>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Student</th>
                      <th className="text-left px-4 py-3 font-medium">Score</th>
                      <th className="text-left px-4 py-3 font-medium">Percentage</th>
                      <th className="text-left px-4 py-3 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{r.student_name}</p>
                          <p className="text-xs text-muted-foreground">{r.student_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {r.score != null ? `${r.score} / ${r.total_points}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.percentage != null ? (
                            <Badge className={r.percentage >= 80 ? "bg-emerald-100 text-emerald-700" : r.percentage >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                              {r.percentage}%
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "In progress"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
