"use client";

import { AlertCircleIcon, ClockIcon, XIcon } from "lucide-react";
import {
  type Application,
  getDaysUntilDeadline,
  isOverdue,
  isInGracePeriod,
} from "@/lib/data/job-applications-data";
import { Button } from "@/components/ui/button";

interface ReminderBannerProps {
  applications: Application[];
  onDismiss?: (applicationId: string) => void;
  onViewApplication?: (applicationId: string) => void;
}

export function ReminderBanner({
  applications,
  onDismiss,
  onViewApplication,
}: ReminderBannerProps) {
  // Filter applications that need reminders
  const overdueApps = applications.filter(
    (app) =>
      isOverdue(app.deadline) &&
      !["Rejected", "Withdrawn", "Archived", "Offer"].includes(app.status)
  );

  const gracePeriodApps = overdueApps.filter((app) =>
    isInGracePeriod(app.deadline)
  );
  const urgentApps = applications.filter((app) => {
    const days = getDaysUntilDeadline(app.deadline);
    return (
      days >= 0 &&
      days <= 2 &&
      !["Rejected", "Withdrawn", "Archived", "Offer"].includes(app.status)
    );
  });

  if (overdueApps.length === 0 && urgentApps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Grace Period Warnings */}
      {gracePeriodApps.map((app) => (
        <div
          key={app.id}
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Grace Period: {app.company} - {app.role}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This application is {Math.abs(getDaysUntilDeadline(app.deadline))}{" "}
              days overdue. It will be auto-archived in{" "}
              {3 - Math.abs(getDaysUntilDeadline(app.deadline))} days if not
              updated.
            </p>
            {onViewApplication && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-white dark:bg-red-900 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800"
                onClick={() => onViewApplication(app.id)}
              >
                Update Status
              </Button>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={() => onDismiss(app.id)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Overdue (not in grace period) */}
      {overdueApps
        .filter((app) => !isInGracePeriod(app.deadline))
        .map((app) => (
          <div
            key={app.id}
            className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <AlertCircleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Deadline Passed: {app.company} - {app.role}
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                This application deadline was{" "}
                {Math.abs(getDaysUntilDeadline(app.deadline))} days ago.
              </p>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900"
                onClick={() => onDismiss(app.id)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

      {/* Urgent (2 days or less) */}
      {urgentApps.map((app) => (
        <div
          key={app.id}
          className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Deadline Approaching: {app.company} - {app.role}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Only {getDaysUntilDeadline(app.deadline)} day
              {getDaysUntilDeadline(app.deadline) !== 1 ? "s" : ""} remaining
              until deadline.
            </p>
            {onViewApplication && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-white dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-800"
                onClick={() => onViewApplication(app.id)}
              >
                View Application
              </Button>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900"
              onClick={() => onDismiss(app.id)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
