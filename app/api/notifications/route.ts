import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'
import { z } from 'zod'

const MarkAllAsReadSchema = z.object({
  applicationId: z.string().optional(),
})

const CreateNotificationSchema = z.object({
  applicationId: z.string(),
  type: z.enum(['DeadlineReminder', 'InterviewReminder', 'CoverLetterGenerated', 'StatusUpdate']),
  title: z.string(),
  message: z.string(),
  status: z.enum(['Pending', 'Completed', 'Failed']).optional(),
})

// GET /api/notifications - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const applicationId = searchParams.get('applicationId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await NotificationService.getNotifications(
      applicationId || undefined,
      unreadOnly
    )

    return NextResponse.json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = CreateNotificationSchema.parse(body)
    
    const notification = await NotificationService.createNotification({
      applicationId: validatedData.applicationId,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      status: validatedData.status,
    })

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = MarkAllAsReadSchema.parse(body)
    
    const result = await NotificationService.markAllAsRead(validatedData.applicationId)

    return NextResponse.json({
      success: true,
      data: { count: result.count },
      message: `Marked ${result.count} notifications as read`,
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete individual notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('deleteAll') === 'true'
    const applicationId = searchParams.get('applicationId')
    
    if (deleteAll) {
      // Delete all notifications (optionally filtered by applicationId)
      const result = await NotificationService.deleteAllNotifications(applicationId || undefined)
      
      return NextResponse.json({
        success: true,
        data: { count: result.count },
        message: `Deleted ${result.count} notifications`,
      })
    }
    
    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification ID is required',
        },
        { status: 400 }
      )
    }

    await NotificationService.deleteNotification(notificationId)

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}