"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applicationApi } from "@/lib/api-client";
import { getDaysUntilDeadline, isOverdue, type Application, type ApplicationStatus, type TimelineEvent } from "@/lib/data/job-applications-data";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ApplicationDetailSkeleton } from "@/components/features/skeleton-components";
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
  Loader2Icon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
} from "lucide-react";

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<'job-description' | 'cover-letter'>('job-description');
  const [coverLetterContent, setCoverLetterContent] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  
  // Form submission state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Timeline collapsible state
  const [timelineOpen, setTimelineOpen] = useState(false);
  
  // Details collapsible state
  const [detailsOpen, setDetailsOpen] = useState(true);
  
  // Auto-expand/collapse behavior: when one is collapsed, the other expands
  useEffect(() => {
    if (!timelineOpen) {
      setDetailsOpen(true);
    }
  }, [timelineOpen]);
  
  useEffect(() => {
    if (!detailsOpen) {
      setTimelineOpen(true);
    }
  }, [detailsOpen]);
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await applicationApi.getApplication(applicationId);
        if (!res.success || !res.data) throw new Error(res.error || "Failed to load application");
        // API returns dates as strings, convert them to Date objects
        const apiApp = res.data;
        const converted: Application = {
          ...apiApp,
          status: apiApp.status as ApplicationStatus,
          resumeLink: apiApp.resumeUrl || '',
          coverLetterLink: apiApp.coverLetterUrl,
          deadline: new Date(apiApp.deadline),
          createdAt: new Date(apiApp.createdAt),
          updatedAt: new Date(apiApp.updatedAt),
          interviewDate: apiApp.interviewDate ? new Date(apiApp.interviewDate) : undefined,
          jobType: apiApp.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
        };
        setApplication(converted);

        const timelineRes = await applicationApi.getTimeline(applicationId);
        if (timelineRes.success && timelineRes.data) {
          const events = (timelineRes.data as TimelineEvent[]).map((e) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }));
          setTimelineEvents(events);
        } else {
          setTimelineEvents([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId]);

  // Fetch cover letter content when cover letter tab is selected
  useEffect(() => {
    if (selectedDocument === 'cover-letter' && application && !coverLetterContent && !coverLetterLoading && !coverLetterError) {
      const fetchCoverLetterContent = async () => {
        setCoverLetterLoading(true);
        setCoverLetterError(null);
        try {
          const response = await applicationApi.getCoverLetterContent(applicationId);
          if (response.success && response.data) {
            setCoverLetterContent(response.data.content);
          } else {
            setCoverLetterError(response.error || 'Failed to load cover letter content');
          }
        } catch (error) {
          setCoverLetterError(error instanceof Error ? error.message : 'Failed to load cover letter content');
        } finally {
          setCoverLetterLoading(false);
        }
      };
      fetchCoverLetterContent();
    }
  }, [selectedDocument, application, applicationId, coverLetterContent, coverLetterLoading, coverLetterError]);

  // Copy cover letter to clipboard
  const copyCoverLetterToClipboard = async () => {
    if (!coverLetterContent) return;
    
    try {
      await navigator.clipboard.writeText(coverLetterContent);
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle application update
  const handleApplicationUpdate = async (data: any) => {
    if (!application) return;
    
    setIsUpdating(true);
    try {
      const response = await applicationApi.updateApplication(applicationId, data);
      if (response.success && response.data) {
        // Update local state with the new data
        const updatedApp: Application = {
          ...application,
          ...response.data,
          status: response.data.status as ApplicationStatus,
          jobType: response.data.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
          deadline: new Date(response.data.deadline),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          interviewDate: response.data.interviewDate ? new Date(response.data.interviewDate) : undefined,
        };
        setApplication(updatedApp);
        setEditFormOpen(false);
        
        // Refresh timeline events
        try {
          const timelineRes = await applicationApi.getTimeline(applicationId);
          if (timelineRes.success && timelineRes.data) {
            const events = (timelineRes.data as TimelineEvent[]).map((e) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            }));
            setTimelineEvents(events);
          }
        } catch (timelineError) {
          console.error('Failed to refresh timeline:', timelineError);
        }
      } else {
        console.error('Failed to update application:', response.error);
      }
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (data: any) => {
    if (!application) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await applicationApi.updateStatus(applicationId, data);
      
      if (response.success && response.data) {
        // Update local state with the new data
        const updatedApp: Application = {
          ...application,
          ...response.data,
          status: response.data.status as ApplicationStatus,
          jobType: response.data.jobType as "Full-time" | "Part-time" | "Contract" | "Internship" | undefined,
          deadline: new Date(response.data.deadline),
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          interviewDate: response.data.interviewDate ? new Date(response.data.interviewDate) : undefined,
        };
        setApplication(updatedApp);
        setStatusFormOpen(false);
        
        // Refresh timeline events
        try {
          const timelineRes = await applicationApi.getTimeline(applicationId);
          if (timelineRes.success && timelineRes.data) {
            const events = (timelineRes.data as TimelineEvent[]).map((e) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            }));
            setTimelineEvents(events);
          }
        } catch (timelineError) {
          console.error('Failed to refresh timeline:', timelineError);
        }
      } else {
        console.error('Failed to update status:', response.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ApplicationDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The application you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilDeadline = getDaysUntilDeadline(application.deadline);
  const deadlineOverdue = isOverdue(application.deadline);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <Button 
            variant="outline" 
            onClick={() => setEditFormOpen(true)}
            disabled={isUpdating || isUpdatingStatus}
          >
            {isUpdating ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <EditIcon className="h-4 w-4 mr-2" />
            )}
            {isUpdating ? 'Updating...' : 'Edit'}
          </Button>
          {!["Rejected", "Withdrawn", "Archived", "Offer"].includes(
            application.status
          ) && (
            <Button 
              onClick={() => setStatusFormOpen(true)}
              disabled={isUpdating || isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isUpdatingStatus ? 'Updating Status...' : 'Update Status'}
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
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedDocument} onValueChange={(value) => setSelectedDocument(value as 'job-description' | 'cover-letter')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="job-description">Job Description</TabsTrigger>
                  <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                </TabsList>
                
                <TabsContent value="job-description" className="mt-4">
                  <div className="max-h-[442px] overflow-y-auto text-muted-foreground whitespace-pre-wrap">
                    {application.jobDescription}
                  </div>
                </TabsContent>
                
                <TabsContent value="cover-letter" className="mt-4">
                  {coverLetterLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading cover letter content...</span>
                    </div>
                  ) : coverLetterError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2">{coverLetterError}</p>
                      <p className="text-sm text-muted-foreground">
                        {!application.coverLetterLink ? 'No cover letter generated for this application.' : 'Failed to load cover letter content.'}
                      </p>
                    </div>
                  ) : coverLetterContent ? (
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyCoverLetterToClipboard}
                          className="gap-2"
                        >
                          {coverLetterCopied ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <CopyIcon className="h-4 w-4" />
                              Copy to Clipboard
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="max-h-[442px] overflow-y-auto text-muted-foreground whitespace-pre-wrap">
                        {coverLetterContent}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {!application.coverLetterLink ? 'No cover letter generated for this application.' : 'Cover letter content not available.'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Timeline */}
          <Card>
            <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5" />
                      Application Timeline
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                  <CardDescription>
                    Track the progress of your application
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto px-1">
                    <TimelineView events={timelineEvents} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Key Details */}
          <Card>
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      Details
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 max-h-[380px] overflow-y-auto">
              {/* Status */}
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className={`h-2 w-2 rounded-full ${
                    application.status === 'Active' ? 'bg-blue-500' :
                    application.status === 'Interview' ? 'bg-purple-500' :
                    application.status === 'Offer' ? 'bg-green-500' :
                    application.status === 'Rejected' ? 'bg-red-500' :
                    application.status === 'Withdrawn' ? 'bg-gray-500' :
                    'bg-yellow-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {application.status}
                  </p>
                </div>
              </div>

              <Separator />

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

              {/* Resume */}
              {application.resumeLink && (
                <>
                  <div className="flex items-start gap-3">
                    <FileTextIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Resume</p>
                      <a
                        href={application.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                        Download Resume
                      </a>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Cover Letter Status */}
              <div className="flex items-start gap-3">
                <FileTextIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Cover Letter</p>
                  <p className="text-sm text-muted-foreground">
                    {application.coverLetterLink ? '✓ Generated' : '✗ Not generated'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Created: {application.createdAt.toLocaleDateString()}</p>
                <p>Updated: {application.updatedAt.toLocaleDateString()}</p>
              </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

        </div>
      </div>

      {/* Forms */}
      <ApplicationForm
        application={application}
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSubmit={handleApplicationUpdate}
        mode="edit"
        loading={isUpdating}
      />

      <ApplicationForm
        application={application}
        open={statusFormOpen}
        onOpenChange={setStatusFormOpen}
        onSubmit={handleStatusUpdate}
        mode="status"
        loading={isUpdatingStatus}
      />
      </div>
    </div>
  );
}
