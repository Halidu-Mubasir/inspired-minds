"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Loader2 } from "lucide-react";
import { quizzesApi } from "@/lib/api/quizzes";
import { pairingsApi } from "@/lib/api/pairings";
import type { QuizDetail } from "@/lib/api/quizzes";
import type { Pairing } from "@/lib/api/pairings";

const schema = z.object({
  pairing_id: z.string().min(1, "Select a pairing"),
  topic: z.string().min(2, "Topic is required"),
  title: z.string().optional(),
  subject: z.string().optional(),
  num_questions: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  include_mcq: z.boolean(),
  include_tf: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface GenerateQuizSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (quiz: QuizDetail) => void;
}

export function GenerateQuizSheet({ open, onOpenChange, onCreated }: GenerateQuizSheetProps) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [generating, setGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: "medium", num_questions: "10", include_mcq: true, include_tf: true },
  });

  useEffect(() => {
    if (open) {
      pairingsApi.getMyStudents().then(setPairings).catch(() => {});
    }
  }, [open]);

  async function onSubmit(values: FormValues) {
    const types: ("mcq" | "true_false")[] = [];
    if (values.include_mcq) types.push("mcq");
    if (values.include_tf) types.push("true_false");
    if (types.length === 0) {
      toast.error("Select at least one question type.");
      return;
    }

    setGenerating(true);
    try {
      const quiz = await quizzesApi.generate({
        pairing_id: values.pairing_id,
        topic: values.topic,
        title: values.title || undefined,
        subject: values.subject || undefined,
        num_questions: Number(values.num_questions),
        difficulty: values.difficulty,
        question_types: types,
      });
      toast.success(`Quiz generated with ${quiz.question_count} questions!`);
      onCreated(quiz);
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Failed to generate quiz. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            Generate Quiz with AI
          </SheetTitle>
          <SheetDescription>Describe a topic and the AI will create a quiz automatically.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="pairing_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Student Pairing *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {pairings.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.student.first_name} {p.student.last_name} — {p.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="topic" render={({ field }) => (
              <FormItem>
                <FormLabel>Topic *</FormLabel>
                <FormControl><Input placeholder="e.g. Photosynthesis, Quadratic Equations" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Quiz Title <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="Auto-generated from topic if left blank" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="e.g. Biology, Mathematics" {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="difficulty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="num_questions" render={({ field }) => (
                <FormItem>
                  <FormLabel>No. of Questions</FormLabel>
                  <FormControl><Input type="number" min={5} max={30} {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Question Types</p>
              <FormField control={form.control} name="include_mcq" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Multiple Choice (MCQ)</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="include_tf" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">True / False</FormLabel>
                </FormItem>
              )} />
            </div>

            <Button type="submit" className="w-full" disabled={generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" /> Generate Quiz</>
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
