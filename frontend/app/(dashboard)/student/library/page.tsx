"use client";
import { Library } from "lucide-react";
import { ResourceBrowser } from "@/components/resources/resource-browser";

export default function StudentLibraryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Library</h1>
        <p className="text-muted-foreground">Browse notes and past questions shared with all students.</p>
      </div>
      <ResourceBrowser
        source="library"
        icon={Library}
        emptyTitle="Library is empty"
        emptyDescription="No resources have been added to the library yet."
      />
    </div>
  );
}
