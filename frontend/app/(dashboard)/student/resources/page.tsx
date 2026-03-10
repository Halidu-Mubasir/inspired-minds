"use client";
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceCard } from "@/components/resources/resource-card";
import { resourcesApi, RESOURCE_TYPE_LABELS } from "@/lib/api/resources";
import type { Resource, ResourceType } from "@/lib/api/resources";

const ALL_TYPES: ResourceType[] = ["note", "document", "past_question", "answer_sheet", "worksheet"];

export default function StudentResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    resourcesApi.getAll()
      .then((res) => setResources(res.results ?? (res as unknown as Resource[])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.resource_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Resources</h1>
        <p className="text-muted-foreground">Files shared with you by your teacher.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={resources.length === 0 ? "No resources yet" : "No results"}
          description={
            resources.length === 0
              ? "Your teacher hasn't shared any files with you yet."
              : "Try adjusting your search or filter."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
