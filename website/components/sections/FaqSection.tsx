import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FaqItem } from "@/lib/data/faq";

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
}

export function FaqSection({
  items,
  title = "Frequently asked questions",
  subtitle = "Have questions? We have answers.",
}: FaqSectionProps) {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <div>
          <SectionHeader centered={false} eyebrow="FAQ" title={title} subtitle={subtitle} />
          <p className="mt-6 text-sm text-muted-foreground">
            Still unsure?{" "}
            <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
              Ask us directly
            </Link>
            .
          </p>
        </div>

        <Accordion className="space-y-3">
          {items.map((item, i) => (
            <AccordionItem key={i} value={i} className="rounded-2xl border bg-card px-6 shadow-xs data-[open]:border-primary/25">
              <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
