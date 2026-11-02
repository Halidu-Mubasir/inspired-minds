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
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SubjectPicker } from "@/components/shared/subject-picker";
import { useSubjects } from "@/hooks/use-subjects";
import { getErrorMessage } from "@/lib/api/errors";
import { EDUCATION_LEVEL_LABELS, usersApi } from "@/lib/api/users";
import type { EducationLevel, User, UserUpdate } from "@/lib/api/users";

// Radix Select items can't have an empty value, so "not set" needs a sentinel.
const NOT_SET = "__none__";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone_number: z.string(),
  address: z.string(),
  subjects: z.array(z.string()),
  // Teacher
  years_of_experience: z.string().regex(/^\d*$/, "Whole number of years"),
  hourly_rate: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, "e.g. 50 or 50.00"),
  qualifications: z.string(),
  bio: z.string(),
  is_available: z.enum(["yes", "no"]),
  // Student
  education_level: z.string(),
  school_name: z.string(),
  grade_or_year: z.string(),
  parent_guardian_name: z.string(),
  parent_guardian_phone: z.string(),
  parent_guardian_email: z.union([z.literal(""), z.string().email("Invalid email")]),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(user: User): FormValues {
  const t = user.teacher_profile;
  const s = user.student_profile;
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_number: user.phone_number ?? "",
    address: user.address ?? "",
    subjects: t?.subjects ?? s?.subjects_of_interest ?? [],
    years_of_experience: String(t?.years_of_experience ?? 0),
    hourly_rate: t?.hourly_rate ?? "",
    qualifications: t?.qualifications ?? "",
    bio: t?.bio ?? "",
    is_available: t?.is_available === false ? "no" : "yes",
    education_level: s?.education_level ?? NOT_SET,
    school_name: s?.school_name ?? "",
    grade_or_year: s?.grade_or_year ?? "",
    parent_guardian_name: s?.parent_guardian_name ?? "",
    parent_guardian_phone: s?.parent_guardian_phone ?? "",
    parent_guardian_email: s?.parent_guardian_email ?? "",
  };
}

function toPayload(role: "teacher" | "student", v: FormValues): UserUpdate {
  const account = {
    first_name: v.first_name,
    last_name: v.last_name,
    email: v.email,
    phone_number: v.phone_number,
    address: v.address,
  };
  if (role === "teacher") {
    return {
      ...account,
      teacher_profile: {
        subjects: v.subjects,
        years_of_experience: Number(v.years_of_experience || 0),
        hourly_rate: v.hourly_rate || null,
        qualifications: v.qualifications,
        bio: v.bio,
        is_available: v.is_available === "yes",
      },
    };
  }
  return {
    ...account,
    student_profile: {
      subjects_of_interest: v.subjects,
      education_level: v.education_level === NOT_SET ? null : (v.education_level as EducationLevel),
      school_name: v.school_name,
      grade_or_year: v.grade_or_year,
      parent_guardian_name: v.parent_guardian_name,
      parent_guardian_phone: v.parent_guardian_phone,
      parent_guardian_email: v.parent_guardian_email || null,
    },
  };
}

interface EditUserSheetProps {
  user: User | null;
  role: "teacher" | "student";
  onClose: () => void;
  onSaved: (user: User) => void;
}

/** Admin edit of an account and its role profile. Open by passing a user; close with onClose. */
export function EditUserSheet({ user, role, onClose, onSaved }: EditUserSheetProps) {
  const open = user !== null;
  const [saving, setSaving] = useState(false);
  const subjectOptions = useSubjects(open);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) form.reset(toFormValues(user));
  }, [user, form]);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    try {
      const update = role === "teacher" ? usersApi.updateTeacher : usersApi.updateStudent;
      const saved = await update(user.id, toPayload(role, values));
      toast.success("Changes saved");
      onSaved(saved);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  }

  const text = (name: keyof FormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input {...props} {...field} value={field.value as string} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {role === "teacher" ? "Teacher" : "Student"}</SheetTitle>
          <SheetDescription>
            {user ? `${user.first_name} ${user.last_name}` : ""} — changes apply immediately.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              {text("first_name", "First Name")}
              {text("last_name", "Last Name")}
            </div>
            {text("email", "Email", { type: "email" })}
            {text("phone_number", "Phone")}
            {text("address", "Address")}

            <FormField control={form.control} name="subjects" render={({ field }) => (
              <FormItem>
                <FormLabel>{role === "teacher" ? "Subjects" : "Subjects of Interest"}</FormLabel>
                <SubjectPicker subjects={subjectOptions} value={field.value ?? []} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )} />

            {role === "teacher" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {text("years_of_experience", "Years Exp.", { inputMode: "numeric" })}
                  {text("hourly_rate", "Hourly Rate (GHS)", { placeholder: "50.00" })}
                </div>
                <FormField control={form.control} name="is_available" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Available for new students</SelectItem>
                        <SelectItem value="no">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                {text("qualifications", "Qualifications")}
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            ) : (
              <>
                <FormField control={form.control} name="education_level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={NOT_SET}>Not set</SelectItem>
                        {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  {text("school_name", "School")}
                  {text("grade_or_year", "Grade / Year")}
                </div>
                <p className="text-xs font-medium text-muted-foreground pt-1">Parent / Guardian</p>
                {text("parent_guardian_name", "Name")}
                <div className="grid grid-cols-2 gap-3">
                  {text("parent_guardian_phone", "Phone")}
                  {text("parent_guardian_email", "Email", { type: "email" })}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
