"use client";
import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Brain, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { GenerateQuizSheet } from "@/components/quizzes/generate-quiz-sheet";
import { quizzesApi } from "@/lib/api/quizzes";
import type { QuizSummary, QuizDetail } from "@/lib/api/quizzes";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [generateOpen, setGenerateOpen] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab !== "all") params.status = activeTab;
      const data = await quizzesApi.getAll(params);
      setQuizzes(Array.isArray(data) ? data : (data as { results: QuizSummary[] }).results ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  function handleGenerated(quiz: QuizDetail) {
    const summary: QuizSummary = {
      id: quiz.id, title: quiz.title, subject: quiz.subject, status: quiz.status,
      question_count: quiz.question_count, time_limit_minutes: quiz.time_limit_minutes,
      generated_by_ai: quiz.generated_by_ai, created_at: quiz.created_at, student_name: quiz.student_name,
    };
    setQuizzes((prev) => [summary, ...prev]);
  }

  async function handlePublish(id: string) {
    try {
      await quizzesApi.publish(id);
      setQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, status: "published" as const } : q));
      toast.success("Quiz published!");
    } catch {
      toast.error("Failed to publish.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await quizzesApi.delete(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quiz deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const filtered = activeTab === "all" ? quizzes : quizzes.filter((q) => q.status === activeTab);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quizzes"
        subtitle="Create and manage quizzes for your students"
        action={
          <Button onClick={() => setGenerateOpen(true)} className="gap-2">
            <Brain className="h-4 w-4" />
            Generate with AI
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No quizzes yet"
            description={activeTab === "all" ? "Generate your first quiz with AI to get started." : `No ${activeTab} quizzes.`}
            action={activeTab === "all" ? (
              <Button onClick={() => setGenerateOpen(true)} className="gap-2">
                <Brain className="h-4 w-4" /> Generate with AI
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                basePath="/teacher/quizzes"
                onPublish={handlePublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <GenerateQuizSheet
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onCreated={handleGenerated}
      />
    </div>
  );
}
