"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { resourcesApi, RESOURCE_TYPE_LABELS } from "@/lib/api/resources";
import { pairingsApi } from "@/lib/api/pairings";
import type { Resource, ResourceType } from "@/lib/api/resources";
import type { Pairing } from "@/lib/api/pairings";

const RESOURCE_TYPES: ResourceType[] = ["note", "document", "past_question", "answer_sheet", "worksheet"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  resource_type: z.enum(["note", "document", "past_question", "answer_sheet", "worksheet"]),
  subject: z.string().optional(),
  visibility: z.enum(["private", "library"]),
  pairing_id: z.string().optional(),
  lesson_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface UploadResourceSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (resource: Resource) => void;
  /** Pre-fill context when opened from a lesson detail page */
  defaultPairingId?: string;
  defaultLessonId?: string;
  /** If true, always upload to library (student/library page) */
  libraryOnly?: boolean;
}

export function UploadResourceSheet({
  open,
  onClose,
  onUploaded,
  defaultPairingId,
  defaultLessonId,
  libraryOnly = false,
}: UploadResourceSheetProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      resource_type: "document",
      subject: "",
      visibility: libraryOnly ? "library" : "private",
      pairing_id: defaultPairingId ?? "",
      lesson_id: defaultLessonId ?? "",
    },
  });

  const visibility = form.watch("visibility");

  useEffect(() => {
    if (open && !libraryOnly) {
      pairingsApi.getMyStudents().then(setPairings).catch(() => {});
    }
  }, [open, libraryOnly]);

  // Reset form when sheet opens with new context
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        resource_type: "document",
        subject: "",
        visibility: libraryOnly ? "library" : "private",
        pairing_id: defaultPairingId ?? "",
        lesson_id: defaultLessonId ?? "",
      });
      setFile(null);
    }
  }, [open, defaultPairingId, defaultLessonId, libraryOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }

  async function onSubmit(values: FormValues) {
    if (!file) { toast.error("Please select a file"); return; }

    setLoading(true);
    try {
      const uploadData = {
        title: values.title,
        resource_type: values.resource_type,
        visibility: values.visibility,
        file,
        ...(values.description && { description: values.description }),
        ...(values.subject && { subject: values.subject }),
        ...(values.pairing_id && { pairing_id: values.pairing_id }),
        ...(values.lesson_id && { lesson_id: values.lesson_id }),
      };

      const resource = libraryOnly
        ? await resourcesApi.uploadToLibrary(uploadData)
        : await resourcesApi.upload(uploadData);

      toast.success("File uploaded successfully");
      onUploaded(resource);
      onClose();
    } catch {
      toast.error("Upload failed. Check file size (max 50MB) and format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Upload Resource</SheetTitle>
          <SheetDescription>
            {libraryOnly
              ? "Add a resource to the shared library."
              : "Upload a file for your student or the shared library."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">Drag & drop or <span className="text-primary underline">browse</span></p>
                  <p className="text-xs">PDF, Word, Excel, PowerPoint, images, text — max 50MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                onChange={handleFileChange}
              />
            </div>

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g. Chapter 3 Notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="resource_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Mathematics" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Brief description..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Visibility toggle — hidden if library-only */}
            {!libraryOnly && (
              <FormField control={form.control} name="visibility" render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private (shared with student only)</SelectItem>
                      <SelectItem value="library">Library (visible to all users)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Pairing selector — shown only for private resources when not pre-filled */}
            {!libraryOnly && visibility === "private" && !defaultPairingId && (
              <FormField control={form.control} name="pairing_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Student & Subject</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select pairing (optional)" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pairings.filter((p) => p.status === "active").map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.student.first_name} {p.student.last_name} — {p.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading || !file}>
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
