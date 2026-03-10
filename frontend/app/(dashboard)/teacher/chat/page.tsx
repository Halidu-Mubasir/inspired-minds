import { Suspense } from "react";
import { ChatPage } from "@/components/chat/chat-page";

export default function TeacherChatPage() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}
