"use client";
import { useEffect, useState } from "react";
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
import { SubjectsMultiSelect } from "@/components/admin/subjects-multi-select";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";

const EDUCATION_LEVELS = [
  { value: "primary",    label: "Primary" },
  { value: "jhs",        label: "JHS" },
  { value: "shs",        label: "SHS" },
  { value: "university", label: "University" },
  { value: "other",      label: "Other" },
];

const GRADE_OPTIONS: Record<string, string[]> = {
  primary:    ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"],
  jhs:        ["JHS 1", "JHS 2", "JHS 3"],
  shs:        ["SHS 1", "SHS 2", "SHS 3"],
  university: ["Level 100", "Level 200", "Level 300", "Level 400", "Level 500", "Level 600"],
};

const schema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone_number: z.string().optional(),
  password: z.string().min(8, "At least 8 characters"),
  education_level: z.string().min(1, "Required"),
  school_name: z.string().optional(),
  grade_or_year: z.string().optional(),
  subjects_of_interest: z.array(z.string()).optional(),
  parent_guardian_name: z.string().optional(),
  parent_guardian_phone: z.string().optional(),
  parent_guardian_email: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddStudentSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

export function AddStudentSheet({ open, onClose, onCreated }: AddStudentSheetProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "", first_name: "", last_name: "", phone_number: "",
      password: "", education_level: "", school_name: "", grade_or_year: "",
      subjects_of_interest: [], parent_guardian_name: "",
      parent_guardian_phone: "", parent_guardian_email: "",
    },
  });

  const educationLevel = form.watch("education_level");

  // Reset grade/year whenever education level changes
  useEffect(() => {
    form.setValue("grade_or_year", "");
  }, [educationLevel, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        education_level: values.education_level,
        subjects_of_interest: values.subjects_of_interest ?? [],
        ...(values.phone_number && { phone_number: values.phone_number }),
        ...(values.school_name && { school_name: values.school_name }),
        ...(values.grade_or_year && { grade_or_year: values.grade_or_year }),
        ...(values.parent_guardian_name && { parent_guardian_name: values.parent_guardian_name }),
        ...(values.parent_guardian_phone && { parent_guardian_phone: values.parent_guardian_phone }),
        ...(values.parent_guardian_email && { parent_guardian_email: values.parent_guardian_email }),
      };

      const user = await usersApi.createStudent(payload);
      toast.success("Student created successfully");
      form.reset();
      onCreated(user);
      onClose();
    } catch {
      toast.error("Failed to create student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Student</SheetTitle>
          <SheetDescription>Create a new student account.</SheetDescription>
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
            <FormField control={form.control} name="education_level" render={({ field }) => (
              <FormItem>
                <FormLabel>Education Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="school_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <FormControl><Input placeholder="School name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="grade_or_year" render={({ field }) => {
                const gradeOptions = educationLevel ? GRADE_OPTIONS[educationLevel] : null;
                const isOther = educationLevel === "other";
                return (
                  <FormItem>
                    <FormLabel>Grade / Year</FormLabel>
                    {isOther ? (
                      <FormControl>
                        <Input placeholder="Enter grade or year" {...field} />
                      </FormControl>
                    ) : gradeOptions ? (
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level first" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent />
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }} />
            </div>
            <FormField control={form.control} name="subjects_of_interest" render={({ field }) => (
              <FormItem>
                <FormLabel>Subjects of Interest</FormLabel>
                <SubjectsMultiSelect
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )} />
            <p className="text-xs font-medium text-muted-foreground pt-1">Parent / Guardian (optional)</p>
            <FormField control={form.control} name="parent_guardian_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="parent_guardian_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="parent_guardian_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Student"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
