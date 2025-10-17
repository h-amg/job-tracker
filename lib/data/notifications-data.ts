import { type Notification } from "@/components/features/notification-center";
import { mockApplications } from "@/lib/data/job-applications-data";

// Generate mock notifications based on application data
export function generateMockNotifications(): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  // Cover letter generation notifications
  mockApplications.slice(0, 2).forEach((app, index) => {
    if (index === 0) {
      // Completed cover letter
      notifications.push({
        id: `cover-${app.id}`,
        type: "cover-letter",
        title: "Cover Letter Generated",
        message: "Your personalized cover letter is ready to view and copy",
        status: "completed",
        timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
        applicationId: app.id,
        applicationTitle: `${app.role} at ${app.company}`,
      });
    } else {
      // Pending cover letter
      notifications.push({
        id: `cover-${app.id}`,
        type: "cover-letter",
        title: "Generating Cover Letter",
        message:
          "AI is crafting your personalized cover letter based on the job description",
        status: "pending",
        timestamp: new Date(now.getTime() - 120000), // 2 minutes ago
        applicationId: app.id,
        applicationTitle: `${app.role} at ${app.company}`,
      });
    }
  });

  // Interview reminders
  mockApplications
    .filter((app) => app.status === "Interview" && app.interviewDate)
    .forEach((app) => {
      const daysUntilInterview = Math.ceil(
        (app.interviewDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilInterview <= 2 && daysUntilInterview >= 0) {
        notifications.push({
          id: `interview-${app.id}`,
          type: "interview-reminder",
          title:
            daysUntilInterview === 0
              ? "Interview Today!"
              : daysUntilInterview === 1
                ? "Interview Tomorrow"
                : "Upcoming Interview",
          message: `Interview scheduled for ${app.interviewDate!.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }
          )}`,
          status: "completed",
          timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
          applicationId: app.id,
          applicationTitle: `${app.role} at ${app.company}`,
        });
      }
    });

  // Deadline reminders
  mockApplications
    .filter(
      (app) =>
        !["Rejected", "Withdrawn", "Archived", "Offer"].includes(app.status)
    )
    .forEach((app) => {
      const daysUntilDeadline = Math.ceil(
        (app.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
        notifications.push({
          id: `deadline-${app.id}`,
          type: "deadline-reminder",
          title:
            daysUntilDeadline === 0
              ? "Deadline Today!"
              : daysUntilDeadline === 1
                ? "Deadline Tomorrow"
                : "Deadline Approaching",
          message: `Application deadline is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`,
          status: "completed",
          timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
          applicationId: app.id,
          applicationTitle: `${app.role} at ${app.company}`,
        });
      }
    });

  // Sort by timestamp (newest first)
  return notifications.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

// Simulate a background task (e.g., generating cover letter)
export function simulateCoverLetterGeneration(
  applicationId: string,
  applicationTitle: string,
  onUpdate: (notification: Notification) => void
): () => void {
  const notificationId = `cover-${applicationId}-${Date.now()}`;

  // Initial pending notification
  const pendingNotification: Notification = {
    id: notificationId,
    type: "cover-letter",
    title: "Generating Cover Letter",
    message:
      "AI is crafting your personalized cover letter based on the job description",
    status: "pending",
    timestamp: new Date(),
    applicationId,
    applicationTitle,
  };

  onUpdate(pendingNotification);

  // Simulate completion after 3-5 seconds
  const timeout = setTimeout(
    () => {
      const completedNotification: Notification = {
        ...pendingNotification,
        title: "Cover Letter Generated",
        message: "Your personalized cover letter is ready to view and copy",
        status: "completed",
        timestamp: new Date(),
      };
      onUpdate(completedNotification);
    },
    3000 + Math.random() * 2000
  );

  // Return cleanup function
  return () => clearTimeout(timeout);
}
