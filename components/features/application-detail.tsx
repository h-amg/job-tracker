"use client";

import { useState } from "react";
import Link from "next/link";
import {
  mockApplications,
  mockTimelineEvents,
  getDaysUntilDeadline,
  isOverdue,
} from "@/lib/data/job-applications-data";
import { StatusBadge } from "@/components/features/status-badge";
import { TimelineView } from "@/components/features/timeline-view";
import { ApplicationForm } from "@/components/features/application-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftIcon,
  EditIcon,
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  BriefcaseIcon,
  FileTextIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  ClockIcon,
} from "lucide-react";

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);

  // Find application
  const application = mockApplications.find((app) => app.id === applicationId);

  // Get timeline events for this application
  const timelineEvents = mockTimelineEvents.filter(
    (event) => event.applicationId === applicationId
  );

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The application you're looking for doesn't exist.
        </p>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const daysUntilDeadline = getDaysUntilDeadline(application.deadline);
  const deadlineOverdue = isOverdue(application.deadline);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{application.role}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xl text-muted-foreground">{application.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditFormOpen(true)}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {!["Rejected", "Withdrawn", "Archived", "Offer"].includes(
            application.status
          ) && (
            <Button onClick={() => setStatusFormOpen(true)}>
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Deadline Warning */}
      {(deadlineOverdue || daysUntilDeadline <= 3) &&
        !["Rejected", "Withdrawn", "Archived", "Offer"].includes(
          application.status
        ) && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              deadlineOverdue
                ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                : "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
            }`}
          >
            <AlertCircleIcon
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                deadlineOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            />

            <div>
              <h3
                className={`font-semibold ${
                  deadlineOverdue
                    ? "text-red-900 dark:text-red-100"
                    : "text-yellow-900 dark:text-yellow-100"
                }`}
              >
                {deadlineOverdue ? "Deadline Passed" : "Deadline Approaching"}
              </h3>
              <p
                className={`text-sm ${
                  deadlineOverdue
                    ? "text-red-700 dark:text-red-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {deadlineOverdue
                  ? `This application is ${Math.abs(daysUntilDeadline)} days overdue. Update the status to avoid auto-archiving.`
                  : `Only ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""} remaining until deadline.`}
              </p>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {application.jobDescription}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Application Timeline
              </CardTitle>
              <CardDescription>
                Track the progress of your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineView events={timelineEvents} />
            </CardContent>
          </Card>

          {/* Notes */}
          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{application.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deadline */}
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Deadline</p>
                  <p
                    className={`text-sm ${
                      deadlineOverdue
                        ? "text-red-600 dark:text-red-400"
                        : daysUntilDeadline <= 3
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {application.deadline.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <br />

                    <span className="text-xs">
                      (
                      {deadlineOverdue
                        ? `${Math.abs(daysUntilDeadline)}d overdue`
                        : `${daysUntilDeadline}d remaining`}
                      )
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Location */}
              {application.location && (
                <>
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {application.location}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Job Type */}
              {application.jobType && (
                <>
                  <div className="flex items-start gap-3">
                    <BriefcaseIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Job Type</p>
                      <p className="text-sm text-muted-foreground">
                        {application.jobType}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Salary */}
              {application.salary && (
                <>
                  <div className="flex items-start gap-3">
                    <DollarSignIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Salary Range</p>
                      <p className="text-sm text-muted-foreground">
                        {application.salary}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Interview Date */}
              {application.interviewDate &&
                application.status === "Interview" && (
                  <>
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Interview Scheduled
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {application.interviewDate.toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

              {/* Dates */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Created: {application.createdAt.toLocaleDateString()}</p>
                <p>Updated: {application.updatedAt.toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                View Resume
              </Button>
              {application.coverLetterLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  View Cover Letter
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms */}
      <ApplicationForm
        application={application}
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSubmit={(data) => console.log("Edit application:", data)}
        mode="edit"
      />

      <ApplicationForm
        application={application}
        open={statusFormOpen}
        onOpenChange={setStatusFormOpen}
        onSubmit={(data) => console.log("Status update:", data)}
        mode="status"
      />
    </div>
  );
}
