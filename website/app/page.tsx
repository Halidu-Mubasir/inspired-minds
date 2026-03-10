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
      <SubjectsSection />
      <StudentTypesSection />
      <TestimonialsSection />
      <WhyChooseUsSection />
      <FaqSection
        items={HOME_FAQ}
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about working with Inspired Minds."
      />
      <CtaSection
        title="Ready to Find the Perfect Tutor?"
        subtitle="Get matched with a qualified tutor within 48 hours. No stress, no hassle."
        primaryLabel="Contact Us Today"
        primaryHref="/contact"
        secondaryLabel="Meet Our Tutors"
        secondaryHref="/teachers"
      />
    </>
  );
}
