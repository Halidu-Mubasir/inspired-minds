import { PageHero } from "@/components/common/PageHero";

export function TutorsHeroSection() {
  return (
    <PageHero
      eyebrow="Our tutors"
      title="Meet the people who'll teach your child"
      subtitle="Every tutor is personally vetted, qualified and passionate about teaching. Browse the team and the expertise available to your child."
      highlights={["Qualification verified", "Subject assessed", "Panel interviewed", "Background checked"]}
    />
  );
}
