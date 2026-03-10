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
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { lessonsApi } from "@/lib/api/lessons";
import { pairingsApi } from "@/lib/api/pairings";
import type { LessonDetail } from "@/lib/api/lessons";
import type { Pairing } from "@/lib/api/pairings";

const schema = z.object({
  pairing_id: z.string().min(1, "Select a pairing"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduled_date: z.string().min(1, "Date is required"),
  scheduled_time: z.string().optional(),
  duration_minutes: z.string().optional(),
  student_notes: z.string().optional(),
  teacher_notes: z.string().optional(),
  homework: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateLessonSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lesson: LessonDetail) => void;
  defaultPairingId?: string;
}

export function CreateLessonSheet({ open, onClose, onCreated, defaultPairingId }: CreateLessonSheetProps) {
  const [loading, setLoading] = useState(false);
  const [pairings, setPairings] = useState<Pairing[]>([]);

  useEffect(() => {
    if (open) {
      pairingsApi.getMyStudents().then(setPairings).catch(() => {});
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pairing_id: defaultPairingId ?? "",
      title: "", description: "", scheduled_date: "",
      scheduled_time: "", duration_minutes: "60",
      student_notes: "", teacher_notes: "", homework: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const lesson = await lessonsApi.create({
        pairing_id: values.pairing_id,
        title: values.title,
        ...(values.description && { description: values.description }),
        scheduled_date: values.scheduled_date,
        ...(values.scheduled_time && { scheduled_time: values.scheduled_time }),
        ...(values.duration_minutes && { duration_minutes: Number(values.duration_minutes) }),
        ...(values.student_notes && { student_notes: values.student_notes }),
        ...(values.teacher_notes && { teacher_notes: values.teacher_notes }),
        ...(values.homework && { homework: values.homework }),
      });
      toast.success("Lesson created");
      form.reset();
      onCreated(lesson);
      onClose();
    } catch {
      toast.error("Failed to create lesson");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Plan a Lesson</SheetTitle>
          <SheetDescription>Schedule a new lesson for one of your students.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="pairing_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Student & Subject</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select pairing" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pairings.filter(p => p.status === "active").map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.student.first_name} {p.student.last_name} — {p.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g. Introduction to Algebra" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="scheduled_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="scheduled_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="duration_minutes" render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl><Input type="number" min={15} step={15} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="student_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Student Notes (shared)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Notes visible to student..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="teacher_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Notes (private)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Your private notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="homework" render={({ field }) => (
              <FormItem>
                <FormLabel>Homework (optional)</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
