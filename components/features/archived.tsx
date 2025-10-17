"use client";

import { useEffect, useState } from "react";
import { applicationApi } from "@/lib/api-client";
import { ApplicationCard } from "@/components/features/application-card";
import { type Application } from "@/lib/data/job-applications-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveIcon, SearchIcon } from "lucide-react";
import { ApplicationCardSkeleton, SearchBarSkeleton } from "@/components/features/skeleton-components";

export function Archived() {
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await applicationApi.getApplications({ includeArchived: true });
        if (res.success && res.data) {
          const archivedOnly = res.data.filter((a) => a.status === "Archived");
          const converted = archivedOnly.map((a) => ({
            ...a,
            resumeLink: a.resumeUrl,
            deadline: new Date(a.deadline),
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
            interviewDate: a.interviewDate ? new Date(a.interviewDate) : undefined,
          })) as Application[];
          setApplications(converted);
        } else {
          throw new Error(res.error || "Failed to fetch archived applications");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load archived applications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter archived applications
  const archivedApplications = applications;

  // Apply search
  const filteredApplications = archivedApplications.filter((app) => {
    if (searchQuery === "") return true;
    return (
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ArchiveIcon className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Archived Applications</h1>
          </div>
          <p className="text-muted-foreground">
            Applications that have been automatically archived or manually closed
          </p>
        </div>

        {/* Search Skeleton */}
        <SearchBarSkeleton />

        {/* Applications List Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Loading...</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ApplicationCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ArchiveIcon className="h-8 w-8 text-muted-foreground" />

          <h1 className="text-3xl font-bold">Archived Applications</h1>
        </div>
        <p className="text-muted-foreground">
          Applications that have been automatically archived or manually closed
        </p>
      </div>

      {/* Search */}
      {archivedApplications.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search archived applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Applications List */}
      <div>
        {archivedApplications.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <ArchiveIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

            <h3 className="text-lg font-semibold mb-2">
              No Archived Applications
            </h3>
            <p className="text-muted-foreground mb-4">
              Applications are automatically archived after the grace period
              expires
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">
              No archived applications match your search
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {filteredApplications.length} Archived Application
                {filteredApplications.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  showActions={false}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
