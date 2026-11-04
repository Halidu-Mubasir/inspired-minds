import { HeroSection } from "@/components/sections/HeroSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { SubjectsSection } from "@/components/sections/SubjectsSection";
import { StudentTypesSection } from "@/components/sections/StudentTypesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { HOME_FAQ } from "@/lib/data/faq";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <StudentTypesSection />
      <WhyChooseUsSection />
      <SubjectsSection />
      <TestimonialsSection />
      <FaqSection
        items={HOME_FAQ}
        title="Questions parents ask us"
        subtitle="Everything you need to know about working with Inspired Minds."
      />
      <CtaSection
        title="Ready to find the right tutor?"
        subtitle="Get matched with a qualified tutor within 48 hours. No stress, no hassle."
        primaryLabel="Request a tutor"
        primaryHref="/contact"
        secondaryLabel="Meet our tutors"
        secondaryHref="/teachers"
      />
    </>
  );
}
