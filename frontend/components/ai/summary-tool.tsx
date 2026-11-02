"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AiFileSelect } from "@/components/ai/ai-file-select";
import { GenerationView } from "@/components/ai/generation-view";
import { LessonSelect } from "@/components/ai/lesson-select";
import { aiApi } from "@/lib/api/ai";
import type { AIUsage, SummaryRequest } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";

type Source = "lesson" | "file" | "text";

export function SummaryTool() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<Source>("lesson");
  const [lessonId, setLessonId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<SummaryRequest["format"]>("revision_sheet");
  const [length, setLength] = useState<SummaryRequest["length"]>("medium");

  const ready = (source === "lesson" && lessonId) || (source === "file" && resourceId) || (source === "text" && text.trim());

  const summarise = useMutation({
    mutationFn: () =>
      aiApi.summarise({
        format,
        length,
        ...(source === "lesson" && { lesson_id: lessonId }),
        ...(source === "file" && { resource_id: resourceId }),
        ...(source === "text" && { text }),
      }),
    onSuccess: (generation) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "generations"] });
      if (generation.usage) {
        queryClient.setQueryData<AIUsage>(queryKeys.ai.usage, (prev) => prev && { ...prev, teacher_tools: generation.usage });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create the summary.")),
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Summarise</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">A lesson&apos;s notes</SelectItem>
                <SelectItem value="file">A file (PDF, image or .txt)</SelectItem>
                <SelectItem value="text">Notes I paste in</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {source === "lesson" && <LessonSelect value={lessonId} onChange={setLessonId} />}
          {source === "file" && <AiFileSelect value={resourceId} onChange={setResourceId} />}
          {source === "text" && (
            <Textarea rows={8} maxLength={30000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste notes here…" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as SummaryRequest["format"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revision_sheet">Student revision sheet</SelectItem>
                  <SelectItem value="teacher_summary">Teacher summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as SummaryRequest["length"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full gap-1.5" disabled={!ready || summarise.isPending} onClick={() => summarise.mutate()}>
            <FileText className="h-4 w-4" />
            {summarise.isPending ? "Summarising…" : "Create summary"}
          </Button>
        </CardContent>
      </Card>

      <div className="min-w-0">
        {summarise.data ? (
          <GenerationView generation={summarise.data} />
        ) : (
          <div className="h-full min-h-48 rounded-xl border-2 border-dashed flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            The summary appears here. It&apos;s also saved under Saved.
          </div>
        )}
      </div>
    </div>
  );
}
