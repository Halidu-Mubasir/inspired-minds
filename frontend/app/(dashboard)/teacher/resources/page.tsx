"use client";
import { useEffect, useState, useCallback } from "react";
import { Upload, FolderOpen, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceCard } from "@/components/resources/resource-card";
import { UploadResourceSheet } from "@/components/resources/upload-resource-sheet";
import { resourcesApi } from "@/lib/api/resources";
import type { Resource } from "@/lib/api/resources";

export default function TeacherResourcesPage() {
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [library, setLibrary] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-uploads");

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, libRes] = await Promise.all([
        resourcesApi.getAll(),
        resourcesApi.getLibrary(),
      ]);
      setMyResources(myRes.results ?? (myRes as unknown as Resource[]));
      setLibrary(libRes.results ?? (libRes as unknown as Resource[]));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadResources(); }, [loadResources]);

  function handleUploaded(resource: Resource) {
    if (resource.visibility === "library") {
      setLibrary((prev) => [resource, ...prev]);
      setActiveTab("library");
    } else {
      setMyResources((prev) => [resource, ...prev]);
      setActiveTab("my-uploads");
    }
  }

  function handleDeleted(id: string) {
    setMyResources((prev) => prev.filter((r) => r.id !== id));
    setLibrary((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resources"
        subtitle="Upload notes, documents, and files for your students or the shared library."
        action={
          <Button
            className="gap-2 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => setSheetOpen(true)}
          >
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="library">Shared Library</TabsTrigger>
        </TabsList>

        <TabsContent value="my-uploads" className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : myResources.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No uploads yet"
              description="Upload your first file to share with a student."
              action={
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
                  <Upload className="h-4 w-4" /> Upload File
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myResources.map((r) => (
                <ResourceCard key={r.id} resource={r} canDelete onDeleted={handleDeleted} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : library.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Library is empty"
              description="Upload resources with 'Library' visibility to share them with everyone."
              action={
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
                  <Upload className="h-4 w-4" /> Add to Library
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {library.map((r) => (
                <ResourceCard key={r.id} resource={r} canDelete onDeleted={handleDeleted} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UploadResourceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
