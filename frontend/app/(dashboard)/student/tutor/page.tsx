import { Suspense } from "react";
import { TutorPage } from "@/components/ai/tutor-page";

export default function StudentTutorPage() {
  return (
    <Suspense>
      <TutorPage />
    </Suspense>
  );
}
