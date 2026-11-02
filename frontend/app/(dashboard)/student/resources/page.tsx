"use client";
import { FolderOpen } from "lucide-react";
import { ResourceBrowser } from "@/components/resources/resource-browser";

export default function StudentResourcesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Resources</h1>
        <p className="text-muted-foreground">Files shared with you by your teacher, plus the general library.</p>
      </div>
      <ResourceBrowser
        source="resources"
        icon={FolderOpen}
        emptyTitle="No resources yet"
        emptyDescription="Your teacher hasn't shared any files with you yet."
      />
    </div>
  );
}
