"use client";

import { useState, useEffect, useCallback } from "react";
import { ApplicationStatus } from "@prisma/client";
import { applicationApi, useApiCall, type ApiApplication } from "@/lib/api-client";
import { type Application as AppData } from "@/lib/data/job-applications-data";
import { StatsOverview } from "@/components/features/stats-overview";
import { ReminderBanner } from "@/components/features/reminder-banner";
import { ApplicationCard } from "@/components/features/application-card";
import { ApplicationForm } from "@/components/features/application-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, FilterIcon, SortDescIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";

// Type definitions for API responses (dates as strings from API)
interface ApiApplicationData extends ApiApplication {
  timelineEvents?: TimelineEvent[];
  notifications?: Notification[];
}

interface TimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  note?: string;
  timestamp: string;
}

interface Notification {
  id: string;
  applicationId: string;
  type: string;
  title: string;
  message: string;
  status: string;
  timestamp: string;
  read: boolean;
}

export function Dashboard() {
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"deadline" | "created" | "updated">("deadline");
  const [formOpen, setFormOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API call hooks
  const { execute: fetchApplications } = useApiCall<ApiApplication[]>();
  const { execute: createApplication, loading: createLoading } = useApiCall<ApiApplication>();
  const { execute: updateStatus } = useApiCall<ApiApplication>();
  const { execute: archiveApplication } = useApiCall<ApiApplication>();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await fetchApplications(async () => {
        const response = await applicationApi.getApplications({
          status: statusFilter === "All" ? undefined : statusFilter,
          search: searchQuery || undefined,
          includeArchived: false,
        });
        
        if (response.success && response.data) {
          setApplications(response.data as ApiApplication[]);
        } else {
          throw new Error(response.error || 'Failed to fetch applications');
        }
        
        return response as any;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [fetchApplications, statusFilter, searchQuery]);

  // Fetch applications on component mount
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Filter applications (client-side filtering for better UX)
  const filteredApplications = applications.filter((app) => {
    // Exclude archived from main view
    if (app.status === "Archived") return false;

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const handleStatusUpdate = (id: string) => {
    setSelectedAppId(id);
    setStatusFormOpen(true);
  };

  const handleCreateApplication = async (data: any) => {
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
          toast.success('Application created successfully');
          setFormOpen(false);
        } else {
          throw new Error(response.error || 'Failed to create application');
        }
        
        return response as any;
      });
    } catch {
      toast.error('Failed to create application');
    }
  };

  const handleStatusUpdateSubmit = async (data: { status: ApplicationStatus; notes?: string; interviewDate?: Date }) => {
    if (!selectedAppId) return;

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
          setApplications(prev => 
            prev.map(app => 
              app.id === selectedAppId ? response.data as ApiApplication : app
            )
          );
          toast.success('Status updated successfully');
          setStatusFormOpen(false);
          setSelectedAppId(null);
        } else {
          throw new Error(response.error || 'Failed to update status');
        }
        
        return response as any;
      });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleArchiveApplication = async (id: string) => {
    try {
      await archiveApplication(async () => {
        const response = await applicationApi.updateStatus(id, { status: 'Archived' });
        
        if (response.success && response.data) {
          // Optimistically remove from the list
          setApplications(prev => prev.filter(app => app.id !== id));
          toast.success('Application archived successfully');
        } else {
          throw new Error(response.error || 'Failed to archive application');
        }
        
        return response as any;
      });
    } catch {
      toast.error('Failed to archive application');
    }
  };

  const selectedApp = applications.find((app) => app.id === selectedAppId);

  // Convert API data to match existing component expectations
  const convertedApplications: AppData[] = applications.map(app => ({
    ...app,
    status: app.status as ApplicationStatus,
    resumeLink: app.resumeUrl || '',
    deadline: new Date(app.deadline),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
    interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
    coverLetterLink: app.coverLetterUrl,
    jobType: app.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <LoaderIcon className="h-6 w-6 animate-spin" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadApplications}>Try Again</Button>
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
      <StatsOverview applications={convertedApplications} />

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

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ApplicationStatus | "All")
              }
            >
              <SelectTrigger>
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-full md:w-48">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "deadline" | "created" | "updated")
              }
            >
              <SelectTrigger>
                <SortDescIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Applications ({sortedApplications.length})
          </h2>
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

        {sortedApplications.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedApplications.map((app) => {
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
                  key={app.id}
                  application={convertedApp}
                  onStatusUpdate={handleStatusUpdate}
                  onArchive={handleArchiveApplication}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Forms */}
      <ApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateApplication as (data: Partial<AppData>) => void}
        mode="create"
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
        />
      )}
    </div>
  );
}
