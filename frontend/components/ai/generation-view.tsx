"use client";
import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import type { AIGeneration, GeneratedQuestion } from "@/lib/api/ai";

const TYPE_LABELS: Record<GeneratedQuestion["type"], string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  structured: "Structured",
};
const LETTERS = "ABCDEFGH";

function questionsAsText(title: string, questions: GeneratedQuestion[], withAnswers: boolean): string {
  const body = questions.map((q, i) => {
    const lines = [`${i + 1}. ${q.question} (${q.marks} mark${q.marks === 1 ? "" : "s"})`];
    q.options.forEach((option, j) => lines.push(`   ${LETTERS[j]}. ${option}`));
    if (withAnswers) lines.push(`   Answer: ${q.answer}`, `   Notes: ${q.explanation}`);
    return lines.join("\n");
  });
  return [title, "", ...body].join("\n\n");
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't copy. Select the text and copy it instead.");
  }
}

/** A saved question set or summary. Generated content: review it before using it with students. */
export function GenerationView({ generation }: { generation: AIGeneration }) {
  const [showAnswers, setShowAnswers] = useState(true);
  const questions = generation.output.questions;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{generation.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            AI-generated. Check answers and wording before sharing with students.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {questions && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAnswers((s) => !s)}>
              {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showAnswers ? "Hide answers" : "Show answers"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              copy(questions ? questionsAsText(generation.title, questions, showAnswers) : generation.output.markdown ?? "")
            }
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questions ? (
          <ol className="space-y-5">
            {questions.map((q, i) => (
              <li key={i} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium whitespace-pre-wrap">{i + 1}. {q.question}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[q.type]}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{q.marks} mk</Badge>
                  </div>
                </div>
                {q.options.length > 0 && (
                  <ul className="grid gap-1 sm:grid-cols-2 pl-4 text-sm">
                    {q.options.map((option, j) => (
                      <li key={j}>
                        <span className="font-medium mr-1">{LETTERS[j]}.</span> {option}
                      </li>
                    ))}
                  </ul>
                )}
                {showAnswers && (
                  <div className="rounded-md bg-muted/60 px-3 py-2 text-sm space-y-1">
                    <p><span className="font-medium">Answer:</span> {q.answer}</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <Markdown>{generation.output.markdown ?? ""}</Markdown>
        )}
      </CardContent>
    </Card>
  );
}
