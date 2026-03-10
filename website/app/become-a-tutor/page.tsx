import { ApplyHeroSection } from "@/components/sections/ApplyHeroSection";
import { ExpressInterestForm } from "@/components/sections/ExpressInterestForm";

export const metadata = {
  title: "Become a Tutor — Inspired Minds",
  description:
    "Join the Inspired Minds team as a home tutor. Flexible hours, competitive rates, and full agency support. Apply today.",
};

export default function BecomeATutorPage() {
  return (
    <>
      <ApplyHeroSection />
      <ExpressInterestForm />
    </>
  );
}
