"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaqSection } from "./FaqSection";
import { APPLY_FAQ } from "@/lib/data/faq";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Phone number is required"),
  subjects: z.string().min(2, "Please list at least one subject"),
  qualification: z.string().min(1, "Please select your highest qualification"),
  experience: z.string().min(1, "Please select your experience level"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ExpressInterestForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    console.log("Tutor application:", data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-6">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0c2340] mb-3">
              Application Received!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for your interest in joining Inspired Minds. Our team will
              review your application and be in touch within{" "}
              <strong>2–3 business days</strong>.
            </p>
          </div>
        </div>
        <FaqSection
          items={APPLY_FAQ}
          title="Questions About Joining?"
          subtitle="Answers to common questions from prospective tutors."
        />
      </section>
    );
  }

  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-[#0c2340] mb-2">
            Express Your Interest
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Fill in the form below and we&apos;ll be in touch to discuss the next steps.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g. Kwame Asante"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0550 583 636"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-1.5">
              <Label htmlFor="subjects">Subjects You Teach *</Label>
              <Textarea
                id="subjects"
                placeholder="e.g. Mathematics, Physics, Further Mathematics"
                rows={2}
                {...register("subjects")}
              />
              {errors.subjects && (
                <p className="text-xs text-red-500">{errors.subjects.message}</p>
              )}
            </div>

            {/* Qualification + Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Highest Qualification *</Label>
                <Select onValueChange={(v) => setValue("qualification", v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hnd">HND</SelectItem>
                    <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="master">Master&apos;s Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.qualification && (
                  <p className="text-xs text-red-500">{errors.qualification.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Years of Teaching Experience *</Label>
                <Select onValueChange={(v) => setValue("experience", v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1 – 3 years</SelectItem>
                    <SelectItem value="3-5">3 – 5 years</SelectItem>
                    <SelectItem value="5-plus">5+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.experience && (
                  <p className="text-xs text-red-500">{errors.experience.message}</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="message">
                Why do you want to join Inspired Minds?{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us a bit about yourself and your teaching philosophy..."
                rows={4}
                {...register("message")}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold"
            >
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-12">
        <FaqSection
          items={APPLY_FAQ}
          title="Questions About Joining?"
          subtitle="Answers to common questions from prospective tutors."
        />
      </div>
    </section>
  );
}
