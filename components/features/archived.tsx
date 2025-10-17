"use client";

import { useEffect, useState, useCallback } from "react";
import { applicationApi, type ApiApplication, type PaginationInfo } from "@/lib/api-client";
import { ApplicationCard } from "@/components/features/application-card";
import { type Application } from "@/lib/data/job-applications-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveIcon, SearchIcon, LoaderIcon } from "lucide-react";
import { ApplicationCardSkeleton, SearchBarSkeleton } from "@/components/features/skeleton-components";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { toast } from "sonner";

export function Archived() {
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  const loadArchivedApplications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await applicationApi.getApplications({
        includeArchived: true,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });
      
      if (response.success && response.data) {
        const responseData = response as any; // Type assertion for the actual response structure
        // Filter to only archived applications
        const archivedOnly = responseData.data.filter((a: any) => a.status === "Archived");
        const converted = archivedOnly.map((a: any) => ({
          ...a,
          resumeLink: a.resumeUrl,
          deadline: new Date(a.deadline),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          interviewDate: a.interviewDate ? new Date(a.interviewDate) : undefined,
        })) as Application[];
        
        if (append) {
          setApplications(prev => {
            // Filter out duplicates by ID to prevent duplicate keys
            const existingIds = new Set(prev.map(app => app.id));
            const newApps = converted.filter(app => !existingIds.has(app.id));
            return [...prev, ...newApps];
          });
        } else {
          setApplications(converted);
        }
        
        // Safely set pagination info from response
        if (responseData.pagination) {
          setPaginationInfo(responseData.pagination);
          setHasNextPage(responseData.pagination.hasNextPage);
        } else {
          // Fallback if pagination data is missing
          setPaginationInfo(null);
          setHasNextPage(false);
        }
        setCurrentPage(page);
      } else {
        throw new Error(response.error || "Failed to fetch archived applications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archived applications");
      toast.error("Failed to load archived applications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  const loadMoreApplications = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      loadArchivedApplications(currentPage + 1, true);
    }
  }, [loadArchivedApplications, currentPage, loadingMore, hasNextPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setHasNextPage(true);
    loadArchivedApplications(1, false);
  }, [searchQuery]);

  // Fetch applications on component mount
  useEffect(() => {
    loadArchivedApplications(1, false);
  }, []);

  // Infinite scroll hook
  const { elementRef } = useInfiniteScroll({
    hasNextPage: hasNextPage && paginationInfo !== null,
    isFetching: loadingMore,
    fetchNextPage: loadMoreApplications,
    threshold: 200,
  });

  // Applications are already filtered and sorted by the API
  const displayedApplications = applications || [];

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

      {/* Applications List */}
      <div>
        {displayedApplications.length === 0 && !loading ? (
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
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {paginationInfo?.totalCount || displayedApplications.length} Archived Application
                {(paginationInfo?.totalCount || displayedApplications.length) !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="max-h-[800px] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedApplications.map((app) => (
                  <ApplicationCard
                    key={`${app.id}-${app.updatedAt}`}
                    application={app}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
            
            {/* Infinite Scroll Loading Indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  <span>Loading more archived applications...</span>
                </div>
              </div>
            )}
            
            {/* Infinite Scroll Trigger */}
            <div ref={elementRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}
