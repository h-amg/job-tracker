import {
  BriefcaseIcon,
  ClockIcon,
  CheckCircle2Icon,
  TrophyIcon,
  XCircleIcon,
  TrendingUpIcon,
  FilterIcon,
  InfoIcon,
} from "lucide-react";
import {
  type Application,
  getApplicationStats,
} from "@/lib/data/job-applications-data";

interface StatsOverviewProps {
  applications: Application[];
  onFilterChange?: (status: string) => void;
}

export function StatsOverview({ applications, onFilterChange }: StatsOverviewProps) {
  const stats = getApplicationStats(applications);

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
      filterValue: "All",
      clickable: true,
    },
    {
      label: "Active",
      value: stats.active,
      icon: ClockIcon,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      filterValue: "Active",
      clickable: true,
    },
    {
      label: "Interviews",
      value: stats.interview,
      icon: CheckCircle2Icon,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      filterValue: "Interview",
      clickable: true,
    },
    {
      label: "Offers",
      value: stats.offer,
      icon: TrophyIcon,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
      filterValue: "Offer",
      clickable: true,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircleIcon,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900",
      filterValue: "Rejected",
      clickable: true,
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUpIcon,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900",
      filterValue: null,
      clickable: false,
    },
  ];

  const handleCardClick = (stat: typeof statCards[0]) => {
    if (stat.clickable && onFilterChange && stat.filterValue !== null) {
      onFilterChange(stat.filterValue);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, stat: typeof statCards[0]) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(stat);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isSuccessRate = stat.label === "Success Rate";
        
        return (
          <div
            key={index}
            className={`bg-card rounded-lg p-4 text-center transition-all duration-200 ease-in-out ${
              stat.clickable 
                ? `border-2 border-border hover:border-primary hover:-translate-y-1 hover:shadow-lg active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2` 
                : `border-dashed border-border opacity-90 cursor-default hover:shadow-md`
            }`}
            onClick={() => handleCardClick(stat)}
            onKeyDown={(e) => handleKeyDown(e, stat)}
            role={stat.clickable ? "button" : "status"}
            tabIndex={stat.clickable ? 0 : -1}
            aria-label={stat.clickable ? `Filter by ${stat.label.toLowerCase()}` : `${stat.label}: ${stat.value}`}
          >
            <div className="flex items-center justify-center mb-2 relative">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              {stat.clickable && (
                <FilterIcon className="h-3 w-3 text-muted-foreground absolute top-0 right-0" />
              )}
              {isSuccessRate && (
                <InfoIcon className="h-3 w-3 text-muted-foreground absolute top-0 right-0" />
              )}
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
