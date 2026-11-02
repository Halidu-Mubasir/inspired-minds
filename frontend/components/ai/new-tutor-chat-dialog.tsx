"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AiFileSelect } from "@/components/ai/ai-file-select";
import { useSubjects } from "@/hooks/use-subjects";
import { aiApi } from "@/lib/api/ai";
import type { TutorConversation } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/api/errors";

const ANY = "__any__";

interface NewTutorChatDialogProps {
  open: boolean;
  onClose: () => void;
  onStarted: (conversation: TutorConversation) => void;
}

export function NewTutorChatDialog({ open, onClose, onStarted }: NewTutorChatDialogProps) {
  const subjects = useSubjects(open);
  const [subject, setSubject] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    try {
      const conversation = await aiApi.startConversation({
        ...(subject && { subject }),
        ...(resourceId && { resource_id: resourceId }),
      });
      setSubject("");
      setResourceId("");
      onStarted(conversation);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't start a new chat."));
    } finally {
      setStarting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New study chat</DialogTitle>
          <DialogDescription>
            Both are optional. Attach a past question or worksheet (PDF, image or .txt) to ask about it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject || ANY} onValueChange={(v) => setSubject(v === ANY ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any subject</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File to ask about</Label>
            <AiFileSelect value={resourceId} onChange={setResourceId} enabled={open} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={start} disabled={starting}>{starting ? "Starting…" : "Start chat"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
