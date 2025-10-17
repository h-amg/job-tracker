"use client";

import { useState } from "react";
import { getDaysUntilDeadline, isOverdue } from "@/lib/data/job-applications-data";
import { StatusBadge } from "@/components/features/status-badge";
import { CoverLetterModal } from "@/components/features/cover-letter-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  FileTextIcon,
  ArchiveIcon,
} from "lucide-react";
import Link from "next/link";

interface ApplicationCardProps {
  application: {
    id: string;
    company: string;
    role: string;
    status: "Active" | "Interview" | "Offer" | "Rejected" | "Withdrawn" | "Archived";
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
    notes?: string;
    interviewDate?: Date;
    salary?: string;
    location?: string;
    jobType?: string;
  };
  onStatusUpdate?: (id: string) => void;
  onArchive?: (id: string) => void;
  showActions?: boolean;
  isUpdating?: boolean;
}

export function ApplicationCard({
  application,
  onStatusUpdate,
  onArchive,
  showActions = true,
  isUpdating = false,
}: ApplicationCardProps) {
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const daysUntilDeadline = getDaysUntilDeadline(application.deadline);
  const deadlineOverdue = isOverdue(application.deadline);
  const deadlineUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 3;

  if (isUpdating) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Details Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Interview Date Skeleton */}
        <div className="mb-4 p-3 bg-muted/30 border border-border rounded-md">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Notes Skeleton */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Actions Skeleton */}
        {showActions && (
          <div className="flex flex-col gap-2.5 pt-4 border-t border-border mt-auto">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {application.id ? (
            <Link href={`/application/${application.id}`} className="group">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {application.role}
              </h3>
            </Link>
          ) : (
            <h3 className="text-lg font-semibold">
              {application.role}
            </h3>
          )}
          <p className="text-muted-foreground">{application.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={application.status} size="sm" />
          {showActions && 
           onArchive && 
           ["Rejected", "Offer", "Withdrawn"].includes(application.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(application.id)}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Archive application"
            >
              <ArchiveIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {application.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />

            <span className="truncate">{application.location}</span>
          </div>
        )}
        {application.jobType && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BriefcaseIcon className="h-4 w-4 flex-shrink-0" />

            <span className="truncate">{application.jobType}</span>
          </div>
        )}
        {application.salary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSignIcon className="h-4 w-4 flex-shrink-0" />

            <span className="truncate">{application.salary}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />

          <span
            className={`truncate ${
              deadlineOverdue
                ? "text-red-600 dark:text-red-400 font-medium"
                : deadlineUrgent
                  ? "text-yellow-600 dark:text-yellow-400 font-medium"
                  : "text-muted-foreground"
            }`}
          >
            {deadlineOverdue
              ? `${Math.abs(daysUntilDeadline)}d overdue`
              : `${daysUntilDeadline}d left`}
          </span>
        </div>
      </div>

      {/* Interview Date */}
      {application.interviewDate && application.status === "Interview" && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
          <div className="flex items-center gap-2 text-sm text-purple-900 dark:text-purple-100">
            <CalendarIcon className="h-4 w-4" />

            <span className="font-medium">
              Interview:{" "}
              {application.interviewDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {application.notes && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {application.notes}
        </p>
      )}

      {/* Deadline Warning */}
      {(deadlineOverdue || deadlineUrgent) &&
        !["Rejected", "Withdrawn", "Archived", "Offer"].includes(
          application.status
        ) && (
          <div
            className={`mb-4 p-3 rounded-md flex items-start gap-2 ${
              deadlineOverdue
                ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                : "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
            }`}
          >
            <AlertCircleIcon
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                deadlineOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            />

            <span
              className={`text-sm ${
                deadlineOverdue
                  ? "text-red-900 dark:text-red-100"
                  : "text-yellow-900 dark:text-yellow-100"
              }`}
            >
              {deadlineOverdue
                ? "Deadline has passed. Update status or this will be auto-archived."
                : "Deadline approaching soon!"}
            </span>
          </div>
        )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-col gap-2.5 pt-4 border-t border-border mt-auto">
          {/* Primary Action */}
          {application.id ? (
            <Link href={`/application/${application.id}`} className="w-full">
              <Button variant="default" size="sm" className="w-full">
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          ) : (
            <Button variant="default" size="sm" className="w-full" disabled>
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCoverLetterOpen(true)}
              className="gap-1.5"
            >
              <FileTextIcon className="h-3.5 w-3.5" />
              Cover Letter
            </Button>

            {onStatusUpdate &&
            !["Rejected", "Withdrawn", "Archived", "Offer"].includes(
              application.status
            ) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(application.id)}
                className="gap-1.5"
              >
                Update Status
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 opacity-50"
              >
                {application.status === "Offer"
                  ? "Offer Received"
                  : application.status}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      <CoverLetterModal
        application={application}
        open={coverLetterOpen}
        onOpenChange={setCoverLetterOpen}
      />
    </div>
  );
}
