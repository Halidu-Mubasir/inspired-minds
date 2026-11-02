import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function AiNotConfigured() {
  return (
    <EmptyState
      icon={Sparkles}
      title="AI isn't set up yet"
      description="An administrator needs to add the AI service key before these tools can be used."
    />
  );
}
