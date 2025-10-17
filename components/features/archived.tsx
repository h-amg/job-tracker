"use client";

import { useState } from "react";
import { mockApplications } from "@/lib/data/job-applications-data";
import { ApplicationCard } from "@/components/features/application-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveIcon, SearchIcon } from "lucide-react";

export function Archived() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter archived applications
  const archivedApplications = mockApplications.filter(
    (app) => app.status === "Archived"
  );

  // Apply search
  const filteredApplications = archivedApplications.filter((app) => {
    if (searchQuery === "") return true;
    return (
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
