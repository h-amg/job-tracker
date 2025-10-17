"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ApplicationStatus } from "@prisma/client";
import { applicationApi, useApiCall, type ApiApplication, type PaginationInfo } from "@/lib/api-client";
import { type Application as AppData } from "@/lib/data/job-applications-data";
import { StatsOverview } from "@/components/features/stats-overview";
import { ReminderBanner } from "@/components/features/reminder-banner";
import { ApplicationCard } from "@/components/features/application-card";
import { ApplicationForm } from "@/components/features/application-form";
import { InterviewCalendar } from "@/components/features/interview-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, LoaderIcon, LayoutGridIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { ApplicationCardSkeleton, StatsOverviewSkeleton, SearchBarSkeleton } from "@/components/features/skeleton-components";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

// Type definitions for API responses (dates as strings from API)

export function Dashboard() {
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [allApplications, setAllApplications] = useState<ApiApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [formOpen, setFormOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingApplications, setUpdatingApplications] = useState<Set<string>>(new Set());
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  // API call hooks
  const { execute: fetchApplications } = useApiCall<ApiApplication[]>();
  const { execute: createApplication, loading: createLoading } = useApiCall<ApiApplication>();
  const { execute: updateStatus } = useApiCall<ApiApplication>();
  const { execute: archiveApplication } = useApiCall<ApiApplication>();

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadAllApplications = useCallback(async () => {
    try {
      const response = await applicationApi.getApplications({
        includeArchived: false,
        page: 1,
        limit: 1000, // Load all applications for stats
      });
      
      if (response.success && response.data) {
        const responseData = response as any;
        setAllApplications(responseData.data);
      }
    } catch (err) {
      console.error('Failed to load all applications for stats:', err);
    }
  }, []);

  const loadApplications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await applicationApi.getApplications({
        status: statusFilter === "All" ? undefined : statusFilter,
        search: debouncedSearchQuery || undefined,
        includeArchived: false,
        page,
        limit: 10,
      });
      
      if (response.success && response.data) {
        const responseData = response as any; // Type assertion for the actual response structure
        if (append) {
          setApplications(prev => {
            // Filter out duplicates by ID to prevent duplicate keys
            const existingIds = new Set(prev.map(app => app.id));
            const newApps = responseData.data.filter((app: any) => !existingIds.has(app.id));
            return [...prev, ...newApps];
          });
        } else {
          setApplications(responseData.data);
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
        throw new Error(response.error || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, debouncedSearchQuery]);

  const loadMoreApplications = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      loadApplications(currentPage + 1, true);
    }
  }, [loadApplications, currentPage, loadingMore, hasNextPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasNextPage(true);
    loadApplications(1, false);
  }, [statusFilter, debouncedSearchQuery]);

  // Reset to cards view when filter changes away from Interview
  useEffect(() => {
    if (statusFilter !== "Interview") {
      setViewMode('cards');
    }
  }, [statusFilter]);

  // Fetch applications on component mount
  useEffect(() => {
    loadAllApplications(); // Load all applications for stats
    loadApplications(1, false); // Load filtered applications for display
  }, []);

  // Infinite scroll hook
  const { elementRef } = useInfiniteScroll({
    hasNextPage: hasNextPage && paginationInfo !== null,
    isFetching: loadingMore,
    fetchNextPage: loadMoreApplications,
    threshold: 200,
  });

  // Handle "Rejected" filter to include both Rejected and Withdrawn applications
  const displayedApplications = useMemo(() => {
    if (statusFilter === "Rejected") {
      // Filter allApplications to show both Rejected and Withdrawn
      return allApplications.filter(app => 
        app.status === "Rejected" || app.status === "Withdrawn"
      );
    }
    return applications || [];
  }, [applications, allApplications, statusFilter]);

  const handleStatusUpdate = (id: string) => {
    setSelectedAppId(id);
    setStatusFormOpen(true);
  };

  const handleCreateApplication = async (data: Partial<AppData>) => {
    try {
      await createApplication(async () => {
        // Convert Date to string for API
        const apiData = {
          ...data,
          deadline: data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline,
          interviewDate: data.interviewDate instanceof Date ? data.interviewDate.toISOString() : data.interviewDate,
        };
        const response = await applicationApi.createApplication(apiData);
        
        if (response.success && response.data) {
          setApplications(prev => [response.data as ApiApplication, ...prev]);
          setAllApplications(prev => [response.data as ApiApplication, ...prev]);
          toast.success('Application created successfully');
          setFormOpen(false);
        } else {
          throw new Error(response.error || 'Failed to create application');
        }
        
        return response;
      });
    } catch {
      toast.error('Failed to create application');
    }
  };

  const handleStatusUpdateSubmit = async (data: { status: ApplicationStatus; notes?: string; interviewDate?: Date }) => {
    if (!selectedAppId) return;

    // Add to updating set
    setUpdatingApplications(prev => new Set(prev).add(selectedAppId));

    try {
      await updateStatus(async () => {
        // Convert Date to string for API
        const apiData = {
          status: data.status,
          notes: data.notes,
          interviewDate: data.interviewDate ? data.interviewDate.toISOString() : undefined,
        };
        const response = await applicationApi.updateStatus(selectedAppId, apiData);
        
        if (response.success && response.data) {
          const updatedApp = response.data as ApiApplication;
          setApplications(prev => 
            prev.map(app => 
              app.id === selectedAppId ? updatedApp : app
            )
          );
          setAllApplications(prev => 
            prev.map(app => 
              app.id === selectedAppId ? updatedApp : app
            )
          );
          toast.success('Status updated successfully');
          setStatusFormOpen(false);
          setSelectedAppId(null);
        } else {
          throw new Error(response.error || 'Failed to update status');
        }
        
        return response;
      });
    } catch {
      toast.error('Failed to update status');
    } finally {
      // Remove from updating set
      setUpdatingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedAppId);
        return newSet;
      });
    }
  };

  const handleArchiveApplication = async (id: string) => {
    // Add to updating set
    setUpdatingApplications(prev => new Set(prev).add(id));

    try {
      await archiveApplication(async () => {
        const response = await applicationApi.updateStatus(id, { status: 'Archived' });
        
        if (response.success && response.data) {
          // Optimistically remove from both lists
          setApplications(prev => prev.filter(app => app.id !== id));
          setAllApplications(prev => prev.filter(app => app.id !== id));
          toast.success('Application archived successfully');
        } else {
          throw new Error(response.error || 'Failed to archive application');
        }
        
        return response;
      });
    } catch {
      toast.error('Failed to archive application');
    } finally {
      // Remove from updating set
      setUpdatingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const selectedApp = applications?.find((app) => app.id === selectedAppId);

  // Convert API data to match existing component expectations
  const convertedApplications: AppData[] = applications?.map(app => ({
    ...app,
    status: app.status as ApplicationStatus,
    resumeLink: app.resumeUrl || '',
    deadline: new Date(app.deadline),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
    interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
    coverLetterLink: app.coverLetterUrl,
    jobType: app.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
  })) || [];

  // Convert all applications for stats (unfiltered)
  const convertedAllApplications: AppData[] = allApplications?.map(app => ({
    ...app,
    status: app.status as ApplicationStatus,
    resumeLink: app.resumeUrl || '',
    deadline: new Date(app.deadline),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
    interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
    coverLetterLink: app.coverLetterUrl,
    jobType: app.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your job applications in one place
          </p>
        </div>

        {/* Statistics Skeleton */}
        <StatsOverviewSkeleton />

        {/* Filters and Search Skeleton */}
        <SearchBarSkeleton />

        {/* Applications List Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
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
        <Button onClick={() => loadApplications()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Track and manage your job applications in one place
        </p>
      </div>

      {/* Statistics */}
      <StatsOverview 
        applications={convertedAllApplications} 
        onFilterChange={(status) => setStatusFilter(status as ApplicationStatus | "All")}
      />

      {/* Reminders */}
      <ReminderBanner
        applications={convertedApplications}
        onViewApplication={handleStatusUpdate}
      />

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

        </div>
      </div>

      {/* Applications List */}
      <div className={statusFilter === "Interview" && viewMode === 'calendar' ? "w-full" : ""}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              Applications ({paginationInfo?.totalCount || displayedApplications.length})
            </h2>
            {statusFilter === "Interview" && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="flex items-center gap-2"
                >
                  <LayoutGridIcon className="h-4 w-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </Button>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setFormOpen(true)}
            disabled={createLoading}
          >
            {createLoading ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Application'
            )}
          </Button>
        </div>

        {displayedApplications.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "All"
                ? "No applications match your filters"
                : "No applications yet"}
            </p>
            {!searchQuery && statusFilter === "All" && (
              <Button onClick={() => setFormOpen(true)}>
                Add Your First Application
              </Button>
            )}
          </div>
        ) : (
          <>
            {statusFilter === "Interview" && viewMode === 'calendar' ? (
              <InterviewCalendar 
                applications={convertedApplications}
              />
            ) : (
              <>
                <div className="max-h-[800px] overflow-y-auto mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayedApplications.map((app) => {
                      const convertedApp: AppData = {
                        ...app,
                        status: app.status as ApplicationStatus,
                        resumeLink: app.resumeUrl || '',
                        deadline: new Date(app.deadline),
                        createdAt: new Date(app.createdAt),
                        updatedAt: new Date(app.updatedAt),
                        interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
                        coverLetterLink: app.coverLetterUrl,
                        jobType: app.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
                      };
                      return (
                        <ApplicationCard
                          key={`${app.id}-${app.updatedAt}`}
                          application={convertedApp}
                          onStatusUpdate={handleStatusUpdate}
                          onArchive={handleArchiveApplication}
                          isUpdating={updatingApplications.has(app.id)}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Infinite Scroll Loading Indicator */}
                {loadingMore && (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                      <span>Loading more applications...</span>
                    </div>
                  </div>
                )}
                
                {/* Infinite Scroll Trigger */}
                <div ref={elementRef} className="h-4" />
              </>
            )}
          </>
        )}
      </div>

      {/* Forms */}
      <ApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateApplication as (data: Partial<AppData>) => void}
        mode="create"
        loading={createLoading}
      />

      {selectedApp && (
        <ApplicationForm
          application={{
            ...selectedApp,
            status: selectedApp.status as ApplicationStatus,
            resumeLink: selectedApp.resumeUrl || '',
            deadline: new Date(selectedApp.deadline),
            createdAt: new Date(selectedApp.createdAt),
            updatedAt: new Date(selectedApp.updatedAt),
            interviewDate: selectedApp.interviewDate ? new Date(selectedApp.interviewDate) : undefined,
            coverLetterLink: selectedApp.coverLetterUrl,
            jobType: selectedApp.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
          }}
          open={statusFormOpen}
          onOpenChange={setStatusFormOpen}
          onSubmit={handleStatusUpdateSubmit as (data: Partial<AppData>) => void}
          mode="status"
          loading={updatingApplications.has(selectedAppId || '')}
        />
      )}
    </div>
  );
}
