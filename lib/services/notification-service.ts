import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationStatus } from '@prisma/client'
import { z } from 'zod'

export const CreateNotificationSchema = z.object({
  applicationId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  status: z.nativeEnum(NotificationStatus).optional(),
})

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>

export class NotificationService {
  static async createNotification(data: CreateNotificationInput) {
    return await prisma.notification.create({
      data: {
        ...data,
        status: data.status || NotificationStatus.Pending,
      },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            role: true,
          },
        },
      },
    })
  }

  static async getNotifications(applicationId?: string, unreadOnly = false) {
    const where: any = {}

    if (applicationId) {
      where.applicationId = applicationId
    }

    if (unreadOnly) {
      where.read = false
    }

    return await prisma.notification.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            company: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })
  }

  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
  }

  static async markAllAsRead(applicationId?: string) {
    const where: any = { read: false }

    if (applicationId) {
      where.applicationId = applicationId
    }

    return await prisma.notification.updateMany({
      where,
      data: { read: true },
    })
  }

  static async getUnreadCount(applicationId?: string) {
    const where: any = { read: false }

    if (applicationId) {
      where.applicationId = applicationId
    }

    return await prisma.notification.count({ where })
  }

  static async createDeadlineReminder(applicationId: string, daysUntilDeadline: number) {
    const title = daysUntilDeadline === 0 
      ? 'Deadline Today!' 
      : daysUntilDeadline === 1 
        ? 'Deadline Tomorrow'
        : 'Deadline Approaching'

    const message = `Application deadline is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`

    return await this.createNotification({
      applicationId,
      type: NotificationType.DeadlineReminder,
      title,
      message,
      status: NotificationStatus.Completed,
    })
  }

  static async createInterviewReminder(applicationId: string, interviewDate: Date) {
    const now = new Date()
    const timeUntilInterview = interviewDate.getTime() - now.getTime()
    const daysUntilInterview = Math.ceil(timeUntilInterview / (1000 * 60 * 60 * 24))

    let title: string
    if (daysUntilInterview === 0) {
      title = 'Interview Today!'
    } else if (daysUntilInterview === 1) {
      title = 'Interview Tomorrow'
    } else {
      title = 'Upcoming Interview'
    }

    const message = `Interview scheduled for ${interviewDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`

    return await this.createNotification({
      applicationId,
      type: NotificationType.InterviewReminder,
      title,
      message,
      status: NotificationStatus.Completed,
    })
  }

  static async createCoverLetterNotification(applicationId: string, status: 'pending' | 'completed' | 'failed') {
    const title = status === 'pending' 
      ? 'Generating Cover Letter'
      : status === 'completed'
        ? 'Cover Letter Generated'
        : 'Cover Letter Generation Failed'

    const message = status === 'pending'
      ? 'AI is crafting your personalized cover letter based on the job description'
      : status === 'completed'
        ? 'Your personalized cover letter is ready to view and copy'
        : 'There was an error generating your cover letter. Please try again.'

    return await this.createNotification({
      applicationId,
      type: NotificationType.CoverLetterGenerated,
      title,
      message,
      status: status === 'completed' ? NotificationStatus.Completed : 
              status === 'failed' ? NotificationStatus.Failed : 
              NotificationStatus.Pending,
    })
  }

  static async createStatusUpdateNotification(applicationId: string, newStatus: string) {
    return await this.createNotification({
      applicationId,
      type: NotificationType.StatusUpdate,
      title: 'Status Updated',
      message: `Application status changed to ${newStatus}`,
      status: NotificationStatus.Completed,
    })
  }

  static async deleteOldNotifications(olderThanDays = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    return await prisma.notification.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        read: true,
      },
    })
  }
}
