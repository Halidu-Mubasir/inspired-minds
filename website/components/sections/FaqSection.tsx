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
  dark?: boolean;
}

export function FaqSection({
  items,
  title = "Frequently Asked Questions",
  subtitle = "Have questions? We have answers.",
  dark = false,
}: FaqSectionProps) {
  return (
    <section className={`py-20 ${dark ? "" : "bg-white"}`} style={dark ? { backgroundColor: "#0c2340" } : {}}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} subtitle={subtitle} light={dark} />

        <div className="mt-12">
          <Accordion className="space-y-3">
            {items.map((item, i) => (
              <AccordionItem
                key={i}
                value={i}
                className={`rounded-xl border px-5 ${
                  dark
                    ? "border-white/15 bg-white/5"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <AccordionTrigger
                  className={`text-left font-semibold text-sm hover:no-underline py-4 ${
                    dark ? "text-white" : "text-[#0c2340]"
                  }`}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className={`text-sm leading-relaxed pb-4 ${
                    dark ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
