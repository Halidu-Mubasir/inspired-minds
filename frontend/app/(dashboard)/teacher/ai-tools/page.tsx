"use client";
import { useState } from "react";
import { Brain, BookOpen, FileText, Lightbulb, Copy, Check, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { aiChatApi } from "@/lib/api/ai-chat";
import { toast } from "sonner";

// ── Shared result box ────────────────────────────────────────────────────────

function ResultBox({ result }: { result: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative mt-4 rounded-xl border bg-muted/40 p-4">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="absolute right-2 top-2 h-7 gap-1 text-xs"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed pr-16">{result}</pre>
    </div>
  );
}

// ── Question Generator ───────────────────────────────────────────────────────

function QuestionGeneratorPanel() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("general");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const conv = await aiChatApi.createConversation({ conversation_type: "question_generator" });
      const prompt = `Generate ${count} questions about "${topic}"${
        subject ? ` for ${subject}` : ""
      }. Level: ${level}. Number each question and include the answer after it.`;
      const res = await aiChatApi.sendMessage(conv.id, prompt);
      setResult(res.ai_message.content);
    } catch {
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            placeholder="e.g. Photosynthesis"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject (optional)</Label>
          <Input
            id="subject"
            placeholder="e.g. Biology"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="Primary">Primary</SelectItem>
              <SelectItem value="JHS">JHS</SelectItem>
              <SelectItem value="SHS">SHS</SelectItem>
              <SelectItem value="University">University</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="count">Number of Questions</Label>
          <Input
            id="count"
            type="number"
            min={3}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading || !topic.trim()} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
        {loading ? "Generating…" : "Generate Questions"}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  );
}

// ── Note Summarizer ──────────────────────────────────────────────────────────

function NoteSummarizerPanel() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 50) {
      toast.error("Please enter at least 50 characters of text to summarize.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const conv = await aiChatApi.createConversation({ conversation_type: "note_summarizer" });
      const prompt = `Summarize the following notes:\n\n${text}`;
      const res = await aiChatApi.sendMessage(conv.id, prompt);
      setResult(res.ai_message.content);
    } catch {
      toast.error("Failed to summarize notes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="notes">Paste your notes here *</Label>
        <Textarea
          id="notes"
          placeholder="Paste the text you want summarized (minimum 50 characters)…"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">{text.length} characters</p>
      </div>
      <Button type="submit" disabled={loading || text.trim().length < 50} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {loading ? "Summarizing…" : "Summarize Notes"}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  );
}

// ── Problem Solver ───────────────────────────────────────────────────────────

function ProblemSolverPanel() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const conv = await aiChatApi.createConversation({ conversation_type: "problem_solver" });
      const prompt = `Solve the following problem step by step:\n\n${problem}`;
      const res = await aiChatApi.sendMessage(conv.id, prompt);
      setResult(res.ai_message.content);
    } catch {
      toast.error("Failed to solve problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="problem">Problem or Question *</Label>
        <Textarea
          id="problem"
          placeholder="Paste the problem or question you want solved…"
          rows={5}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading || !problem.trim()} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
        {loading ? "Solving…" : "Solve Step-by-Step"}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherAIToolsPage() {
  const [activeTab, setActiveTab] = useState("questions");

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Tools"
        subtitle="Generate questions, summarize notes, and solve problems with AI."
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
          <TabsList className="mb-6">
            <TabsTrigger value="questions" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Question Generator
            </TabsTrigger>
            <TabsTrigger value="summarizer" className="gap-2">
              <FileText className="h-4 w-4" />
              Note Summarizer
            </TabsTrigger>
            <TabsTrigger value="solver" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Problem Solver
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Question Generator</h2>
              <p className="text-sm text-muted-foreground">
                Generate exam or homework questions on any topic for your students.
              </p>
            </div>
            <QuestionGeneratorPanel />
          </TabsContent>

          <TabsContent value="summarizer">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Note Summarizer</h2>
              <p className="text-sm text-muted-foreground">
                Paste your lesson notes to get a clear, concise summary.
              </p>
            </div>
            <NoteSummarizerPanel />
          </TabsContent>

          <TabsContent value="solver">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Problem Solver</h2>
              <p className="text-sm text-muted-foreground">
                Paste any problem and get a step-by-step solution and explanation.
              </p>
            </div>
            <ProblemSolverPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
