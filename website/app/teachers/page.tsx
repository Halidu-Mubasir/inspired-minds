import { TutorsHeroSection } from "@/components/sections/TutorsHeroSection";
import { TutorsGridSection } from "@/components/sections/TutorsGridSection";
import { CtaSection } from "@/components/sections/CtaSection";

export const metadata = {
  title: "Our Tutors — Inspired Minds",
  description:
    "Browse our team of qualified, vetted home tutors. Find the right tutor for your child's subject and level.",
};

export default function TeachersPage() {
  return (
    <>
      <TutorsHeroSection />
      <TutorsGridSection />
      <CtaSection
        title="Interested in Joining Our Team?"
        subtitle="Are you a qualified teacher or university graduate? We'd love to hear from you."
        primaryLabel="Become a Tutor"
        primaryHref="/become-a-tutor"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
