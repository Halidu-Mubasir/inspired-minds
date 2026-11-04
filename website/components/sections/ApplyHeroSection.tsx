import { PageHero } from "@/components/common/PageHero";

export function ApplyHeroSection() {
  return (
    <PageHero
      eyebrow="Become a tutor"
      title="Teach on your schedule. We handle the rest."
      subtitle="Share your knowledge, earn on your own hours and make a real difference in students' lives. Inspired Minds handles the admin — you just teach."
      highlights={["Flexible hours", "Competitive rates", "Agency support", "Lesson tools in the tutor portal"]}
    />
  );
}
