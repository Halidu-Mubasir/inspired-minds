"use client";
import { useState } from "react";
import {
  FileText, FileSpreadsheet, Image, File, Download, Trash2, BookOpen, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resourcesApi, RESOURCE_TYPE_LABELS } from "@/lib/api/resources";
import type { Resource, ResourceType } from "@/lib/api/resources";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string, resourceType: ResourceType) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || resourceType === "worksheet")
    return FileSpreadsheet;
  if (resourceType === "past_question" || resourceType === "answer_sheet") return ClipboardList;
  if (resourceType === "note") return BookOpen;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document"))
    return FileText;
  return File;
}

const typeColors: Record<ResourceType, string> = {
  note: "bg-purple-100 text-purple-700",
  document: "bg-blue-100 text-blue-700",
  past_question: "bg-amber-100 text-amber-700",
  answer_sheet: "bg-emerald-100 text-emerald-700",
  worksheet: "bg-cyan-100 text-cyan-700",
};

interface ResourceCardProps {
  resource: Resource;
  canDelete?: boolean;
  onDeleted?: (id: string) => void;
}

export function ResourceCard({ resource, canDelete = false, onDeleted }: ResourceCardProps) {
  const [deleting, setDeleting] = useState(false);
  const Icon = getFileIcon(resource.mime_type, resource.resource_type);

  async function handleDelete() {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    setDeleting(true);
    try {
      await resourcesApi.delete(resource.id);
      toast.success("Resource deleted");
      onDeleted?.(resource.id);
    } catch {
      toast.error("Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted rounded-lg p-2.5 flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{resource.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(resource.file_size)}</p>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge className={`text-xs ${typeColors[resource.resource_type]}`}>
                {RESOURCE_TYPE_LABELS[resource.resource_type]}
              </Badge>
              {resource.subject && (
                <Badge variant="outline" className="text-xs">{resource.subject}</Badge>
              )}
              {resource.visibility === "library" && (
                <Badge className="text-xs bg-slate-100 text-slate-600">Library</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <a
            href={resourcesApi.getDownloadUrl(resource.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </a>
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive gap-1.5 text-xs"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
