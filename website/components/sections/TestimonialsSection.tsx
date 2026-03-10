import { SectionHeader } from "@/components/common/SectionHeader";
import { TestimonialCard } from "@/components/common/TestimonialCard";
import { TESTIMONIALS } from "@/lib/data/testimonials";

export function TestimonialsSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#0c2340" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="What Parents & Students Say"
          subtitle="Hear from the families and students whose lives we've helped transform."
          light
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
