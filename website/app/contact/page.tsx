import { ContactHeroSection } from "@/components/sections/ContactHeroSection";
import { ContactInfoSection } from "@/components/sections/ContactInfoSection";
import { ContactForm } from "@/components/sections/ContactForm";

export const metadata = {
  title: "Contact Us — Inspired Minds",
  description:
    "Get in touch with Inspired Minds. Find a tutor, ask about our services, or request a callback.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHeroSection />
      <ContactInfoSection />
      <ContactForm />
    </>
  );
}
