"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { submitForm } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  level: z.string().min(1, "Please select student level"),
  subjects: z.string().min(2, "Please describe the subjects needed"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await submitForm("/enquiries/contact/", data);
    } catch {
      toast.error("Sorry, your message could not be sent.", {
        description: "Please try again shortly, or call or WhatsApp us directly.",
      });
      return;
    }
    toast.success("Message sent! We'll be in touch soon.", {
      description: "Our team typically responds within 24 hours.",
    });
    reset();
    setSubmitted(true);
  }

  return (
    <section className="py-16 lg:py-20 bg-cream">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl border shadow-sm p-8 sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-primary mb-2">
            Send Us a Message
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Tell us what you need and we&apos;ll find the right tutor for you.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-success-soft border border-success/20 p-6 text-center">
              <p className="font-semibold text-success">
                ✓ Message received!
              </p>
              <p className="text-success text-sm mt-1">
                We&apos;ll be in touch within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm text-success underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Abena Asante"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
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
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number{" "}
                    <span className="text-muted-foreground/80 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 0550 583 636"
                    {...register("phone")}
                  />
                </div>
              </div>

              {/* Student Level */}
              <div className="space-y-1.5">
                <Label>Student&apos;s Level *</Label>
                <Select onValueChange={(v) => setValue("level", v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nursery_kg">Nursery / Kindergarten</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="jhs">Junior High (JHS)</SelectItem>
                    <SelectItem value="shs">Senior High (SHS)</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="na">N/A</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-destructive">{errors.level.message}</p>
                )}
              </div>

              {/* Subjects */}
              <div className="space-y-1.5">
                <Label htmlFor="subjects">Subjects Needed *</Label>
                <Textarea
                  id="subjects"
                  placeholder="e.g. Mathematics, Science, English Language"
                  rows={2}
                  {...register("subjects")}
                />
                {errors.subjects && (
                  <p className="text-xs text-destructive">{errors.subjects.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message">
                  Additional Message{" "}
                  <span className="text-muted-foreground/80 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any other details about your needs or preferred schedule..."
                  rows={4}
                  {...register("message")}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
              >
                {isSubmitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
