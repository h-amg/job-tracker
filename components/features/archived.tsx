"use client";

import { useEffect, useState, useCallback } from "react";
import { applicationApi, type PaginationInfo } from "@/lib/api-client";
import { ApplicationCard } from "@/components/features/application-card";
import { type Application } from "@/lib/data/job-applications-data";
import { ApplicationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveIcon, SearchIcon, LoaderIcon } from "lucide-react";
import { ApplicationCardSkeleton } from "@/components/features/skeleton-components";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { toast } from "sonner";

// Type for API application data
interface ApiApplicationData {
  id: string;
  status: string;
  resumeUrl?: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  interviewDate?: string;
  [key: string]: unknown;
}

export function Archived() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadArchivedApplications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await applicationApi.getApplications({
        status: ApplicationStatus.Archived,
        search: debouncedSearchQuery || undefined,
        page,
        limit: 10,
      });
      
      if (response.success && response.data) {
        const responseData = response as { data: unknown[]; pagination?: PaginationInfo };
        // No need to filter since API returns only archived applications
        const converted = responseData.data.map((a) => ({
          ...(a as ApiApplicationData),
          resumeLink: (a as ApiApplicationData).resumeUrl,
          deadline: new Date((a as ApiApplicationData).deadline),
          createdAt: new Date((a as ApiApplicationData).createdAt),
          updatedAt: new Date((a as ApiApplicationData).updatedAt),
          interviewDate: (a as ApiApplicationData).interviewDate ? new Date((a as ApiApplicationData).interviewDate!) : undefined,
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
  }, [debouncedSearchQuery]);

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
  }, [debouncedSearchQuery]);

  // Fetch applications on component mount
  useEffect(() => {
    loadArchivedApplications(1, false);
  }, []);

  // Infinite scroll hook
  const { elementRef } = useInfiniteScroll({
    hasNextPage: hasNextPage,
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
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Applications List Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ApplicationCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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

        {/* Error State */}
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => loadArchivedApplications(1, false)}>
            Try Again
          </Button>
        </div>
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
              {searchQuery
                ? "No applications match your search"
                : "Applications are automatically archived after the grace period expires"}
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
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedApplications.map((app) => (
                  <ApplicationCard
                    key={`${app.id}-${app.updatedAt}`}
                    application={app}
                    showActions={true}
                  />
                ))}
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
              
              {/* Infinite Scroll Trigger - Only show if there are more pages */}
              {hasNextPage && (
                <div ref={elementRef} className="h-20 flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">
                    Scroll to load more applications
                  </div>
                </div>
              )}
              
              {/* Fallback Load More Button */}
              {hasNextPage && !loadingMore && (
                <div className="flex justify-center py-8">
                  <Button 
                    onClick={loadMoreApplications}
                    variant="outline"
                    className="gap-2"
                  >
                    <LoaderIcon className="h-4 w-4" />
                    Load More Applications
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
