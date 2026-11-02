"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Library, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceBrowser } from "@/components/resources/resource-browser";
import { UploadResourceSheet } from "@/components/resources/upload-resource-sheet";
import { queryKeys } from "@/lib/query-keys";

/** Admin: curate the shared library every student can see. Admins may remove any item. */
export default function AdminLibraryPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Library"
        subtitle="Notes, past questions and worksheets shared with every student."
        action={
          <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={() => setSheetOpen(true)}>
            <Upload className="h-4 w-4" /> Add to Library
          </Button>
        }
      />

      <ResourceBrowser
        source="library"
        icon={Library}
        emptyTitle="Library is empty"
        emptyDescription="Add notes and past questions for all students."
        emptyAction={
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
            <Upload className="h-4 w-4" /> Add to Library
          </Button>
        }
        canDelete={() => true}
        onDeleted={refresh}
      />

      <UploadResourceSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onUploaded={refresh} libraryOnly />
    </div>
  );
}
