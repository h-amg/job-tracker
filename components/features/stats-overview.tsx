import {
  BriefcaseIcon,
  ClockIcon,
  CheckCircle2Icon,
  TrophyIcon,
  XCircleIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  type Application,
  getApplicationStats,
} from "@/lib/data/job-applications-data";

interface StatsOverviewProps {
  applications: Application[];
}

export function StatsOverview({ applications }: StatsOverviewProps) {
  const stats = getApplicationStats(applications);
  const activeApplications = applications.filter(
    (app) => !["Rejected", "Withdrawn", "Archived"].includes(app.status)
  );

  // Calculate success rate (offers / total non-archived)
  const nonArchivedCount = applications.filter(
    (app) => app.status !== "Archived"
  ).length;
  const successRate =
    nonArchivedCount > 0
      ? Math.round((stats.offer / nonArchivedCount) * 100)
      : 0;

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: BriefcaseIcon,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      label: "Active",
      value: stats.active,
      icon: ClockIcon,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      label: "Interviews",
      value: stats.interview,
      icon: CheckCircle2Icon,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
    },
    {
      label: "Offers",
      value: stats.offer,
      icon: TrophyIcon,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircleIcon,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUpIcon,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
