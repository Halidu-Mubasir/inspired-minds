"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FolderOpen, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceBrowser } from "@/components/resources/resource-browser";
import { UploadResourceSheet } from "@/components/resources/upload-resource-sheet";
import { useAuth } from "@/hooks/use-auth";
import type { Resource } from "@/lib/api/resources";
import { queryKeys } from "@/lib/query-keys";

export default function TeacherResourcesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-uploads");

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
  // The API only lets teachers delete their own uploads, so only offer it for those.
  const isMine = (resource: Resource) => resource.uploaded_by?.id === user?.id;

  function handleUploaded(resource: Resource) {
    refresh();
    setActiveTab(resource.visibility === "library" ? "library" : "my-uploads");
  }

  const uploadButton = (label: string) => (
    <Button size="sm" variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
      <Upload className="h-4 w-4" /> {label}
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resources"
        subtitle="Upload notes, documents, and files for your students or the shared library."
        action={
          <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={() => setSheetOpen(true)}>
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-uploads">My Students&apos; Files</TabsTrigger>
          <TabsTrigger value="library">Shared Library</TabsTrigger>
        </TabsList>

        <TabsContent value="my-uploads" className="mt-4">
          <ResourceBrowser
            source="resources"
            icon={FolderOpen}
            emptyTitle="No uploads yet"
            emptyDescription="Upload your first file to share with a student."
            emptyAction={uploadButton("Upload File")}
            canDelete={isMine}
            onDeleted={refresh}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <ResourceBrowser
            source="library"
            icon={Library}
            emptyTitle="Library is empty"
            emptyDescription="Upload resources with 'Library' visibility to share them with everyone."
            emptyAction={uploadButton("Add to Library")}
            canDelete={isMine}
            onDeleted={refresh}
          />
        </TabsContent>
      </Tabs>

      <UploadResourceSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
}
