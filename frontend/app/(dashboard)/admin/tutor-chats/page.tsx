import { Suspense } from "react";
import { TutorChatReview } from "@/components/ai/tutor-chat-review";

export default function AdminTutorChatsPage() {
  return (
    <Suspense>
      <TutorChatReview subtitle="Every student's AI tutor chats, with safety flags to follow up." />
    </Suspense>
  );
}
