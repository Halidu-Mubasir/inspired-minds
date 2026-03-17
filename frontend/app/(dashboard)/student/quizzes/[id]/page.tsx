"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { QuizQuestionCard } from "@/components/quizzes/quiz-question-card";
import { QuizResultsSummary } from "@/components/quizzes/quiz-results-summary";
import { quizzesApi } from "@/lib/api/quizzes";
import type { QuizDetail, QuizAttempt } from "@/lib/api/quizzes";

type PageState = "info" | "taking" | "results";

export default function StudentQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [pageState, setPageState] = useState<PageState>("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Map: questionId → selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [q, a] = await Promise.all([
          quizzesApi.get(id),
          quizzesApi.getAttempt(id).catch(() => null),
        ]);
        setQuiz(q);
        setAttempt(a);
        if (a?.status === "submitted") setPageState("results");
        else if (a?.status === "in_progress") setPageState("taking");
      } catch {
        toast.error("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleStart() {
    if (!quiz) return;
    try {
      const a = await quizzesApi.startAttempt(quiz.id);
      setAttempt(a);
      setPageState("taking");
    } catch {
      toast.error("Failed to start quiz.");
    }
  }

  function handleSelectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    if (!quiz) return;
    const allAnswered = quiz.questions.every((q) => answers[q.id]);
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const submitted = await quizzesApi.submitAttempt(quiz.id, {
        answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
          question_id, selected_option_id,
        })),
      });
      setAttempt(submitted);
      setPageState("results");
      toast.success("Quiz submitted!");
    } catch {
      toast.error("Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-lg truncate">{quiz.title}</h1>
            {quiz.subject && <Badge variant="outline" className="text-xs">{quiz.subject}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            By {quiz.teacher_name} · {quiz.question_count} questions
            {quiz.time_limit_minutes && ` · ${quiz.time_limit_minutes} min`}
          </p>
        </div>
        {pageState === "taking" && (
          <p className="text-sm text-muted-foreground flex-shrink-0">
            {Object.keys(answers).length} / {quiz.question_count} answered
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Info state */}
        {pageState === "info" && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{quiz.title}</h2>
                  {quiz.description && <p className="text-muted-foreground text-sm mt-1">{quiz.description}</p>}
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                  <span>{quiz.question_count} questions</span>
                  {quiz.time_limit_minutes && <span>· {quiz.time_limit_minutes} min limit</span>}
                  <span>· By {quiz.teacher_name}</span>
                </div>
                <Button size="lg" onClick={handleStart} className="w-full mt-2">
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Taking state */}
        {pageState === "taking" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {quiz.questions.map((q, i) => (
              <QuizQuestionCard
                key={q.id}
                question={q}
                index={i + 1}
                mode="taking"
                selectedOptionId={answers[q.id]}
                onSelectOption={handleSelectOption}
              />
            ))}

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full"
                disabled={submitting || Object.keys(answers).length < quiz.question_count}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                ) : (
                  `Submit Quiz (${Object.keys(answers).length}/${quiz.question_count} answered)`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Results state */}
        {pageState === "results" && attempt && (
          <div className="max-w-2xl mx-auto space-y-6">
            <QuizResultsSummary attempt={attempt} />

            <section>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Question Breakdown
              </h2>
              <div className="space-y-4">
                {quiz.questions.map((q, i) => {
                  const answer = attempt.answers.find((a) => a.question.id === q.id);
                  return (
                    <QuizQuestionCard
                      key={q.id}
                      question={q}
                      index={i + 1}
                      mode="results"
                      answer={answer}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
