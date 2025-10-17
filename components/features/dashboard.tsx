"use client";

import { useState } from "react";
import {
  mockApplications,
  type ApplicationStatus,
} from "@/lib/data/job-applications-data";
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
import { SearchIcon, FilterIcon, SortDescIcon } from "lucide-react";

export function Dashboard() {
  const [applications] = useState(mockApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">(
    "All"
  );
  const [sortBy, setSortBy] = useState<"deadline" | "created" | "updated">(
    "deadline"
  );
  const [formOpen, setFormOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Filter applications
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
        return a.deadline.getTime() - b.deadline.getTime();
      case "created":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "updated":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      default:
        return 0;
    }
  });

  const handleStatusUpdate = (id: string) => {
    setSelectedAppId(id);
    setStatusFormOpen(true);
  };

  const selectedApp = applications.find((app) => app.id === selectedAppId);

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
      <StatsOverview applications={applications} />

      {/* Reminders */}
      <ReminderBanner
        applications={applications}
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
          <Button onClick={() => setFormOpen(true)}>Add Application</Button>
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
            {sortedApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Forms */}
      <ApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => console.log("New application:", data)}
        mode="create"
      />

      {selectedApp && (
        <ApplicationForm
          application={selectedApp}
          open={statusFormOpen}
          onOpenChange={setStatusFormOpen}
          onSubmit={(data) => console.log("Status update:", data)}
          mode="status"
        />
      )}
    </div>
  );
}
