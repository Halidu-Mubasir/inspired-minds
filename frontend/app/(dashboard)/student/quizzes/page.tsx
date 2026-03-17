"use client";
import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { quizzesApi } from "@/lib/api/quizzes";
import type { QuizSummary, QuizAttempt } from "@/lib/api/quizzes";

interface QuizWithAttempt {
  quiz: QuizSummary;
  attempt: QuizAttempt | null;
}

export default function StudentQuizzesPage() {
  const [items, setItems] = useState<QuizWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await quizzesApi.getAll();
      const quizzes: QuizSummary[] = Array.isArray(raw) ? raw : (raw as { results: QuizSummary[] }).results ?? [];

      const withAttempts = await Promise.all(
        quizzes.map(async (quiz) => {
          const attempt = await quizzesApi.getAttempt(quiz.id).catch(() => null);
          return { quiz, attempt };
        })
      );
      setItems(withAttempts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  function getAttemptStatus(attempt: QuizAttempt | null): "not_started" | "in_progress" | "submitted" {
    if (!attempt) return "not_started";
    return attempt.status === "submitted" ? "submitted" : "in_progress";
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="My Quizzes"
        subtitle="Take quizzes assigned to you by your tutors"
      />

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No quizzes yet"
            description="Your tutor hasn't assigned any quizzes yet. Check back soon!"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(({ quiz, attempt }) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                basePath="/student/quizzes"
                attemptStatus={getAttemptStatus(attempt)}
                score={attempt?.score}
                totalPoints={attempt?.total_points}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
