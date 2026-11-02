"use client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { QuestionGenerator } from "@/components/ai/question-generator";
import { SavedGenerations } from "@/components/ai/saved-generations";
import { SummaryTool } from "@/components/ai/summary-tool";
import { aiApi } from "@/lib/api/ai";
import { queryKeys } from "@/lib/query-keys";

export default function TeacherAiToolsPage() {
  const { data: usage } = useQuery({ queryKey: queryKeys.ai.usage, queryFn: aiApi.getUsage });
  const quota = usage?.teacher_tools;

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Tools"
        subtitle={
          quota
            ? `Generate practice questions and summaries. ${quota.remaining} of ${quota.limit} runs left today.`
            : "Generate practice questions and summaries."
        }
      />
      {usage && !usage.configured ? (
        <AiNotConfigured />
      ) : (
        <Tabs defaultValue="questions">
          <TabsList>
            <TabsTrigger value="questions">Question generator</TabsTrigger>
            <TabsTrigger value="summary">Summarise notes</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          <TabsContent value="questions" className="mt-4"><QuestionGenerator /></TabsContent>
          <TabsContent value="summary" className="mt-4"><SummaryTool /></TabsContent>
          <TabsContent value="saved" className="mt-4"><SavedGenerations /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
