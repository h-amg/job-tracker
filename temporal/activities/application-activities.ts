import { log } from '@temporalio/activity'
import { ApplicationService } from '@/lib/services/application-service'
import { NotificationService } from '@/lib/services/notification-service'
import { CoverLetterService } from '@/lib/services/cover-letter-service'
import { BlobService } from '@/lib/services/blob-service'
import { ApplicationStatus } from '@prisma/client'

export async function sendDeadlineReminder(applicationId: string, deadline: Date): Promise<void> {
  log.info(`Sending deadline reminder for application ${applicationId}`)

  try {
    // Get application details
    const application = await ApplicationService.getApplicationById(applicationId)
    if (!application) {
      throw new Error(`Application ${applicationId} not found`)
    }

    // Calculate days until deadline
    const now = new Date()
    const timeUntilDeadline = deadline.getTime() - now.getTime()
    const daysUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))

    // Create deadline reminder notification
    await NotificationService.createDeadlineReminder(applicationId, daysUntilDeadline)

    log.info(`Deadline reminder sent for application ${applicationId}`, {
      daysUntilDeadline,
      deadline: deadline.toISOString(),
    })
  } catch (error) {
    log.error(`Failed to send deadline reminder for application ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function archiveApplication(applicationId: string): Promise<void> {
  log.info(`Archiving application ${applicationId}`)

  try {
    await ApplicationService.archiveApplication(applicationId)
    
    log.info(`Application ${applicationId} archived successfully`)
  } catch (error) {
    log.error(`Failed to archive application ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function createTimelineEvent(
  applicationId: string,
  status: string,
  note?: string
): Promise<void> {
  log.info(`Creating timeline event for application ${applicationId}`, { status, note })

  try {
    // This is handled in the ApplicationService.updateStatus method
    // We don't need to do anything here as the timeline event is created
    // when the status is updated in the database
    log.info(`Timeline event created for application ${applicationId}`)
  } catch (error) {
    log.error(`Failed to create timeline event for application ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  notes?: string
): Promise<void> {
  log.info(`Updating application status for ${applicationId}`, { status, notes })

  try {
    await ApplicationService.updateStatus(applicationId, {
      status: status as ApplicationStatus,
      notes,
    })

    // Create status update notification
    await NotificationService.createStatusUpdateNotification(applicationId, status)

    log.info(`Application status updated for ${applicationId}`)
  } catch (error) {
    log.error(`Failed to update application status for ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function generateCoverLetter(input: {
  jobDescription: string
  resumeContent?: string
  companyName?: string
  role?: string
}): Promise<string> {
  // Ensure required fields have defaults
  const inputWithDefaults = {
    jobDescription: input.jobDescription,
    resumeContent: input.resumeContent,
    companyName: input.companyName || 'the company',
    role: input.role || 'the position',
  }
  log.info(`Generating cover letter`, { 
    companyName: input.companyName,
    role: input.role 
  })

  try {
    // Validate input
    const validation = CoverLetterService.validateInput(inputWithDefaults)
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`)
    }

    // Generate cover letter with retry
    const coverLetter = await CoverLetterService.generateCoverLetterWithRetry(inputWithDefaults)

    log.info(`Cover letter generated successfully`, {
      companyName: input.companyName,
      role: input.role,
      length: coverLetter.length,
    })

    return coverLetter
  } catch (error) {
    log.error(`Failed to generate cover letter`, {
      error: error instanceof Error ? error.message : String(error),
      companyName: input.companyName,
      role: input.role,
    })
    throw error
  }
}

export async function uploadToBlob(
  content: string,
  filename: string,
  folder: 'resumes' | 'cover-letters' = 'cover-letters'
): Promise<string> {
  log.info(`Uploading content to blob storage`, { filename, folder })

  try {
    const result = await BlobService.uploadCoverLetter(content, filename)
    
    log.info(`Content uploaded to blob storage successfully`, {
      filename,
      folder,
      url: result.url,
      size: result.size,
    })

    return result.url
  } catch (error) {
    log.error(`Failed to upload content to blob storage`, {
      error: error instanceof Error ? error.message : String(error),
      filename,
      folder,
    })
    throw error
  }
}

export async function sendInterviewReminder(
  applicationId: string,
  interviewDate: Date
): Promise<void> {
  log.info(`Sending interview reminder for application ${applicationId}`, {
    interviewDate: interviewDate.toISOString(),
  })

  try {
    await NotificationService.createInterviewReminder(applicationId, interviewDate)
    
    log.info(`Interview reminder sent for application ${applicationId}`)
  } catch (error) {
    log.error(`Failed to send interview reminder for application ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function createCoverLetterNotification(
  applicationId: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<void> {
  log.info(`Creating cover letter notification for application ${applicationId}`, { status })

  try {
    await NotificationService.createCoverLetterNotification(applicationId, status)
    
    log.info(`Cover letter notification created for application ${applicationId}`)
  } catch (error) {
    log.error(`Failed to create cover letter notification for application ${applicationId}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function cleanupOldNotifications(olderThanDays = 30): Promise<number> {
  log.info(`Cleaning up old notifications older than ${olderThanDays} days`)

  try {
    const result = await NotificationService.deleteOldNotifications(olderThanDays)
    
    log.info(`Cleaned up ${result.count} old notifications`)
    return result.count
  } catch (error) {
    log.error(`Failed to cleanup old notifications`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function getApplicationStats(): Promise<{
  active: number
  interview: number
  offer: number
  rejected: number
  archived: number
  total: number
}> {
  log.info(`Getting application statistics`)

  try {
    const stats = await ApplicationService.getApplicationStats()
    
    log.info(`Application statistics retrieved`, stats)
    return stats
  } catch (error) {
    log.error(`Failed to get application statistics`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function healthCheck(): Promise<{ status: string; timestamp: Date }> {
  log.info(`Performing health check`)

  try {
    // Simple health check - try to get application stats
    await ApplicationService.getApplicationStats()
    
    const result = {
      status: 'healthy',
      timestamp: new Date(),
    }
    
    log.info(`Health check passed`, result)
    return result
  } catch (error) {
    log.error(`Health check failed`, {
      error: error instanceof Error ? error.message : String(error),
    })
    
    const result = {
      status: 'unhealthy',
      timestamp: new Date(),
    }
    
    return result
  }
}
