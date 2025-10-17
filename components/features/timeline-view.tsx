type ApplicationStatus =
  | "Active"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn"
  | "Archived";

interface TimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  note?: string;
  timestamp: Date;
}
import {
  CheckCircle2Icon,
  ClockIcon,
  TrophyIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArchiveIcon,
} from "lucide-react";

interface TimelineViewProps {
  events: TimelineEvent[];
  compact?: boolean;
}

const statusConfig = {
  Active: {
    label: "Application Submitted",
    icon: ClockIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    lineColor: "bg-blue-300 dark:bg-blue-700",
  },
  Interview: {
    label: "Interview Stage",
    icon: CheckCircle2Icon,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    lineColor: "bg-purple-300 dark:bg-purple-700",
  },
  Offer: {
    label: "Offer Received",
    icon: TrophyIcon,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900",
    lineColor: "bg-green-300 dark:bg-green-700",
  },
  Rejected: {
    label: "Application Rejected",
    icon: XCircleIcon,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900",
    lineColor: "bg-red-300 dark:bg-red-700",
  },
  Withdrawn: {
    label: "Application Withdrawn",
    icon: MinusCircleIcon,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    lineColor: "bg-orange-300 dark:bg-orange-700",
  },
  Archived: {
    label: "Application Archived",
    icon: ArchiveIcon,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    lineColor: "bg-gray-300 dark:bg-gray-700",
  },
};

function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TimelineView({ events, compact = false }: TimelineViewProps) {
  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => {
        const config = statusConfig[event.status];
        const Icon = config.icon;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-12 bottom-0 w-0.5 ${config.lineColor}`}
              />
            )}

            {/* Event content */}
            <div className="flex gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center z-10`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{config.label}</h3>
                      {event.note && !compact && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.note}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </time>
                  </div>
                  {compact && event.note && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
