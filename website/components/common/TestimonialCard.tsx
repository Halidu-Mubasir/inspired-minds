import { Testimonial } from "@/lib/data/testimonials";

const AVATAR_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  const initials = testimonial.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="flex flex-col bg-white/10 rounded-2xl p-6 border border-white/15">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-4 h-4 text-amber-400 fill-amber-400"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-white/85 text-sm leading-relaxed flex-1 italic">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/15">
        <div
          className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
        >
          {initials}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{testimonial.name}</p>
          <p className="text-white/60 text-xs">{testimonial.role}</p>
        </div>
        <span className="ml-auto text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
          {testimonial.subject}
        </span>
      </div>
    </div>
  );
}
