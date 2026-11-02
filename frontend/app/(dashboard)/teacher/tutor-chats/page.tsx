import { Suspense } from "react";
import { TutorChatReview } from "@/components/ai/tutor-chat-review";

export default function TeacherTutorChatsPage() {
  return (
    <Suspense>
      <TutorChatReview subtitle="Read your students' AI tutor chats and follow up on safety flags." />
    </Suspense>
  );
}
