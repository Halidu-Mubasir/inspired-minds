"use client";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonTopic } from "@/lib/api/lessons";

interface LessonTopicsProps {
  lessonId: string;
  topics: LessonTopic[];
  readOnly?: boolean;
  onChange: (topics: LessonTopic[]) => void;
}

export function LessonTopics({ lessonId, topics, readOnly = false, onChange }: LessonTopicsProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const topic = await lessonsApi.createTopic(lessonId, {
        title: newTitle.trim(),
        order: topics.length,
      });
      onChange([...topics, topic]);
      setNewTitle("");
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add topic");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(topic: LessonTopic) {
    try {
      const updated = await lessonsApi.updateTopic(lessonId, topic.id, {
        is_completed: !topic.is_completed,
      });
      onChange(topics.map((t) => (t.id === topic.id ? updated : t)));
    } catch {
      toast.error("Failed to update topic");
    }
  }

  async function handleDelete(topic: LessonTopic) {
    try {
      await lessonsApi.deleteTopic(lessonId, topic.id);
      onChange(topics.filter((t) => t.id !== topic.id));
    } catch {
      toast.error("Failed to delete topic");
    }
  }

  return (
    <div className="space-y-2">
      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No topics yet.</p>
      )}
      {topics.map((topic) => (
        <div
          key={topic.id}
          className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group"
        >
          <button
            onClick={() => !readOnly && handleToggle(topic)}
            className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            disabled={readOnly}
          >
            {topic.is_completed
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              : <Circle className="h-4 w-4" />
            }
          </button>
          <span className={`flex-1 text-sm ${topic.is_completed ? "line-through text-muted-foreground" : ""}`}>
            {topic.title}
          </span>
          {!readOnly && (
            <button
              onClick={() => handleDelete(topic)}
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="pt-1">
          {showAddForm ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Topic title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setShowAddForm(false); setNewTitle(""); }
                }}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAdd} disabled={adding || !newTitle.trim()} className="h-8 px-3">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTitle(""); }} className="h-8 px-3">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Topic
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
