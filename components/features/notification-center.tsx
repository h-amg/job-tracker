"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  FileTextIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type NotificationType =
  | "cover-letter"
  | "deadline-reminder"
  | "interview-reminder"
  | "success"
  | "warning";

export type NotificationStatus = "pending" | "completed" | "failed";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  timestamp: Date;
  applicationId?: string;
  applicationTitle?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onDismiss?: (id: string) => void;
  onViewApplication?: (applicationId: string) => void;
}

export function NotificationCenter({
  notifications = [],
  onDismiss,
  onViewApplication,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] =
    useState<Notification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const pendingCount = localNotifications.filter(
    (n) => n.status === "pending"
  ).length;
  const unreadCount = localNotifications.length;

  const handleDismiss = (id: string) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  };

  const getNotificationIcon = (
    type: NotificationType,
    status: NotificationStatus
  ) => {
    if (status === "pending") {
      return (
        <LoaderIcon className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
      );
    }
    if (status === "completed") {
      return (
        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      );
    }

    switch (type) {
      case "cover-letter":
        return (
          <FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );

      case "deadline-reminder":
        return (
          <AlertCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        );

      case "interview-reminder":
        return (
          <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        );

      default:
        return <BellIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            In Progress
          </Badge>
        );

      case "completed":
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-600 dark:bg-green-700"
          >
            Completed
          </Badge>
        );

      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
        );
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 dark:bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-base">Notifications</h3>
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingCount} background task{pendingCount > 1 ? "s" : ""}{" "}
                running
              </p>
            )}
          </div>
          {localNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalNotifications([]);
                localNotifications.forEach((n) => onDismiss?.(n.id));
              }}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {localNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />

              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see updates about your applications here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(
                        notification.type,
                        notification.status
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDismiss(notification.id)}
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.applicationTitle && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">
                            {notification.applicationTitle}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(notification.status)}
                          {notification.applicationId &&
                            notification.status === "completed" &&
                            onViewApplication && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  onViewApplication(
                                    notification.applicationId!
                                  );
                                  setOpen(false);
                                }}
                              >
                                View
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
