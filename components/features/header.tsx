"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  LayoutDashboardIcon,
  ArchiveIcon,
  PlusIcon,
} from "lucide-react";
import {
  NotificationCenter,
  type Notification,
} from "@/components/features/notification-center";
import { useNotificationStream } from "@/hooks/use-notification-stream";

interface HeaderProps {
  onAddApplication?: () => void;
}

export function Header({ onAddApplication }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Use the notification stream hook
  const {
    notifications,
    isConnected,
    error,
    markAsRead,
    dismissNotification,
    deleteAllNotifications,
  } = useNotificationStream();

  const handleDismissNotification = async (id: string) => {
    await dismissNotification(id);
  };

  const handleClearAllNotifications = async () => {
    await deleteAllNotifications();
  };

  const handleViewApplication = async (applicationId: string) => {
    // Mark notification as read when viewing application
    const notification = notifications.find(n => n.applicationId === applicationId);
    if (notification) {
      await markAsRead(notification.id);
    }
    router.push(`/application/${applicationId}`);
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboardIcon,
    },
    {
      label: "Archived",
      path: "/archived",
      icon: ArchiveIcon,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BriefcaseIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">JobTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path as any}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onAddApplication && (
              <Button onClick={onAddApplication} size="sm" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Application</span>
              </Button>
            )}
            <NotificationCenter
              notifications={notifications}
              onDismiss={handleDismissNotification}
              onViewApplication={handleViewApplication}
              onClearAll={handleClearAllNotifications}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path as any}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
