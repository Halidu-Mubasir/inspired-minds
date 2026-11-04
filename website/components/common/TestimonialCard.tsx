import { Quote, Star } from "lucide-react";
import { Testimonial } from "@/lib/data/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const initials = testimonial.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <figure className="relative flex flex-col rounded-3xl border bg-card p-7 shadow-xs">
      <Quote className="absolute right-6 top-6 h-10 w-10 text-gold/40" aria-hidden />
      <div className="flex gap-0.5" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-gold text-gold" aria-hidden />
        ))}
      </div>

      <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-foreground/85">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">{testimonial.name}</span>
          <span className="block text-xs text-muted-foreground">{testimonial.role}</span>
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {testimonial.subject}
        </span>
      </figcaption>
    </figure>
  );
}
