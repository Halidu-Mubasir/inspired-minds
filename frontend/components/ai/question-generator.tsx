"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AiFileSelect } from "@/components/ai/ai-file-select";
import { GenerationView } from "@/components/ai/generation-view";
import { LessonSelect } from "@/components/ai/lesson-select";
import { useSubjects } from "@/hooks/use-subjects";
import { aiApi } from "@/lib/api/ai";
import type { AIUsage, QuestionRequest } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";

const schema = z.object({
  subject: z.string().min(1, "Choose a subject"),
  topic: z.string().min(2, "Enter a topic").max(200),
  level: z.string().min(1, "Enter a level, e.g. JHS 2").max(60),
  count: z.string().regex(/^([1-9]|1\d|20)$/, "Between 1 and 20"),
  question_type: z.enum(["mixed", "multiple_choice", "short_answer", "structured"]),
  difficulty: z.enum(["mixed", "easy", "medium", "hard"]),
  instructions: z.string().max(1000),
  lesson_id: z.string(),
  resource_id: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function QuestionGenerator() {
  const queryClient = useQueryClient();
  const subjects = useSubjects();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "", topic: "", level: "", count: "10", question_type: "mixed",
      difficulty: "mixed", instructions: "", lesson_id: "", resource_id: "",
    },
  });

  const generate = useMutation({
    mutationFn: (values: FormValues) => {
      const request: QuestionRequest = {
        subject: values.subject,
        topic: values.topic,
        level: values.level,
        count: Number(values.count),
        question_type: values.question_type,
        difficulty: values.difficulty,
        ...(values.instructions && { instructions: values.instructions }),
        ...(values.lesson_id && { lesson_id: values.lesson_id }),
        ...(values.resource_id && { resource_id: values.resource_id }),
      };
      return aiApi.generateQuestions(request);
    },
    onSuccess: (generation) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "generations"] });
      if (generation.usage) {
        queryClient.setQueryData<AIUsage>(queryKeys.ai.usage, (prev) => prev && { ...prev, teacher_tools: generation.usage });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't generate questions.")),
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => generate.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="topic" render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl><Input placeholder="e.g. Quadratic equations" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl><Input placeholder="e.g. SHS 2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>How many</FormLabel>
                    <FormControl><Input type="number" min={1} max={20} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="question_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                        <SelectItem value="short_answer">Short answer</SelectItem>
                        <SelectItem value="structured">Structured</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="lesson_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base on a lesson (optional)</FormLabel>
                  <LessonSelect value={field.value} onChange={field.onChange} />
                </FormItem>
              )} />
              <FormField control={form.control} name="resource_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base on a file (optional)</FormLabel>
                  <AiFileSelect value={field.value} onChange={field.onChange} />
                </FormItem>
              )} />
              <FormField control={form.control} name="instructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra instructions (optional)</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. Use Ghana cedi in word problems" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full gap-1.5" disabled={generate.isPending}>
                <Sparkles className="h-4 w-4" />
                {generate.isPending ? "Generating… (this can take a minute)" : "Generate questions"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="min-w-0">
        {generate.data ? (
          <GenerationView generation={generate.data} />
        ) : (
          <div className="h-full min-h-48 rounded-xl border-2 border-dashed flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Questions appear here, with answers and marking notes. They&apos;re also saved under Saved.
          </div>
        )}
      </div>
    </div>
  );
}
