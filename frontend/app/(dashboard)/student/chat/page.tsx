import { Suspense } from "react";
import { ChatPage } from "@/components/chat/chat-page";

export default function StudentChatPage() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}
