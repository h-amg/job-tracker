type ApplicationStatus =
  | "Active"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn"
  | "Archived";
import {
  CheckCircle2Icon,
  ClockIcon,
  TrophyIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArchiveIcon,
} from "lucide-react";

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig = {
  Active: {
    label: "Active",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: ClockIcon,
  },
  Interview: {
    label: "Interview",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    icon: CheckCircle2Icon,
  },
  Offer: {
    label: "Offer",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    icon: TrophyIcon,
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    icon: XCircleIcon,
  },
  Withdrawn: {
    label: "Withdrawn",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: MinusCircleIcon,
  },
  Archived: {
    label: "Archived",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: ArchiveIcon,
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
