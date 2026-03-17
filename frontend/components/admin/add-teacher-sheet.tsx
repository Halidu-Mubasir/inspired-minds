"use client";
import { useState } from "react";
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
import { SubjectsMultiSelect } from "@/components/admin/subjects-multi-select";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";

// ── Qualification options ─────────────────────────────────────────────────────

const DEGREE_OPTIONS = [
  "BSc", "BA", "BEd", "HND", "Diploma", "Certificate",
  "MSc", "MA", "MEd", "MBA", "PhD", "Other",
];

const COURSE_OPTIONS = [
  "Mathematics",
  "English / Literature",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics / Business",
  "Computer Science / ICT",
  "History / Social Studies",
  "Geography",
  "French / Languages",
  "Education / Pedagogy",
  "Accounting / Finance",
  "Other",
];

const schema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone_number: z.string().optional(),
  password: z.string().min(8, "At least 8 characters"),
  subjects: z.array(z.string()).optional(),
  qualification_degree: z.string().optional(),
  qualification_course: z.string().optional(),
  custom_degree: z.string().optional(),
  custom_course: z.string().optional(),
  bio: z.string().optional(),
  years_of_experience: z.string().optional(),
  hourly_rate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddTeacherSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

export function AddTeacherSheet({ open, onClose, onCreated }: AddTeacherSheetProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "", first_name: "", last_name: "", phone_number: "",
      password: "", subjects: [], qualification_degree: "",
      qualification_course: "", custom_degree: "", custom_course: "",
      bio: "", years_of_experience: "0", hourly_rate: "",
    },
  });

  const qualDegree = form.watch("qualification_degree");
  const qualCourse = form.watch("qualification_course");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      // Build qualifications string: e.g. "BSc Mathematics"
      const degree = values.qualification_degree === "Other"
        ? values.custom_degree
        : values.qualification_degree;
      const course = values.qualification_course === "Other"
        ? values.custom_course
        : values.qualification_course;
      const qualifications = [degree, course].filter(Boolean).join(" ");

      const payload: Record<string, unknown> = {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        ...(values.phone_number && { phone_number: values.phone_number }),
        subjects: values.subjects ?? [],
        ...(qualifications && { qualifications }),
        ...(values.bio && { bio: values.bio }),
        ...(values.years_of_experience !== undefined && values.years_of_experience !== "" && { years_of_experience: Number(values.years_of_experience) }),
        ...(values.hourly_rate && { hourly_rate: values.hourly_rate }),
      };

      const user = await usersApi.createTeacher(payload);
      toast.success("Teacher created successfully");
      form.reset();
      onCreated(user);
      onClose();
    } catch {
      toast.error("Failed to create teacher");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Teacher</SheetTitle>
          <SheetDescription>Create a new teacher account.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Subjects multi-select */}
            <FormField control={form.control} name="subjects" render={({ field }) => (
              <FormItem>
                <FormLabel>Subjects</FormLabel>
                <SubjectsMultiSelect
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="years_of_experience" render={({ field }) => (
                <FormItem>
                  <FormLabel>Years Exp.</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hourly_rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (GHS)</FormLabel>
                  <FormControl><Input placeholder="50.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Qualification — Degree */}
            <FormField control={form.control} name="qualification_degree" render={({ field }) => (
              <FormItem>
                <FormLabel>Qualification — Degree</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEGREE_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {qualDegree === "Other" && (
              <FormField control={form.control} name="custom_degree" render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Degree</FormLabel>
                  <FormControl><Input placeholder="e.g. HNC" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Qualification — Course / Field of Study */}
            <FormField control={form.control} name="qualification_course" render={({ field }) => (
              <FormItem>
                <FormLabel>Field of Study</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select field of study" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COURSE_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {qualCourse === "Other" && (
              <FormField control={form.control} name="custom_course" render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Field of Study</FormLabel>
                  <FormControl><Input placeholder="e.g. Agricultural Science" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (optional)</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Teacher"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
