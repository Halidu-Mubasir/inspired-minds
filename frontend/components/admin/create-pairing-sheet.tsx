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
import { pairingsApi } from "@/lib/api/pairings";
import { usersApi } from "@/lib/api/users";
import type { Pairing } from "@/lib/api/pairings";
import type { User } from "@/lib/api/users";

const schema = z.object({
  teacher_id: z.string().min(1, "Select a teacher"),
  student_id: z.string().min(1, "Select a student"),
  subject: z.string().min(1, "Subject is required"),
  start_date: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreatePairingSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (pairing: Pairing) => void;
}

export function CreatePairingSheet({ open, onClose, onCreated }: CreatePairingSheetProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    if (open) {
      usersApi.getTeachers({ is_active: "true", page_size: "100" }).then((r) => setTeachers(r.results)).catch(() => {});
      usersApi.getStudents({ is_active: "true", page_size: "100" }).then((r) => setStudents(r.results)).catch(() => {});
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { teacher_id: "", student_id: "", subject: "", start_date: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const pairing = await pairingsApi.create({
        teacher_id: values.teacher_id,
        student_id: values.student_id,
        subject: values.subject,
        start_date: values.start_date,
        ...(values.notes && { notes: values.notes }),
      });
      toast.success("Pairing created");
      form.reset();
      onCreated(pairing);
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { non_field_errors?: string[] } };
      const msg = e?.data?.non_field_errors?.[0] ?? "Failed to create pairing";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Pairing</SheetTitle>
          <SheetDescription>Assign a teacher to a student for a subject.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="teacher_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="student_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Student</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl><Input placeholder="e.g. Mathematics" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="start_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Any admin notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Pairing"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
