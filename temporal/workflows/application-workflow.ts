import { proxyActivities, defineSignal, defineQuery, setHandler, sleep, log } from '@temporalio/workflow'
import type * as activities from '../activities/application-activities'

// Import activities
const {
  sendDeadlineReminder,
  archiveApplication,
  updateApplicationStatus,
  generateCoverLetter,
  uploadToBlob,
  updateCoverLetterStatus,
  createCoverLetterNotification,
  getApplicationData,
  getUserInfo,
  updateApplicationWithCoverLetter,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5m',
  retry: {
    initialInterval: '1s',
    maximumInterval: '100s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
})

// Define signals
export const updateStatusSignal = defineSignal<[string, string?]>('updateStatus')
export const extendDeadlineSignal = defineSignal<[number]>('extendDeadline')
export const cancelWorkflowSignal = defineSignal<[string?]>('cancelWorkflow')


// Workflow state interface
export interface WorkflowState {
  applicationId: string
  status: 'Created' | 'Active' | 'Remind' | 'GracePeriod' | 'Archived'
  deadline: Date
  originalDeadline: Date
  gracePeriodEnd?: Date
  lastStatusUpdate?: string
  lastStatusNotes?: string
  createdAt: Date
  updatedAt: Date
  cancelled?: boolean
}

// Define queries
export const getWorkflowStateQuery = defineQuery<WorkflowState>('getWorkflowState')


// Main workflow function
export async function ApplicationWorkflow(applicationId: string, deadline: Date | string): Promise<void> {
  // Ensure deadline is a Date object and validate it
  let deadlineDate: Date
  
  if (deadline instanceof Date) {
    deadlineDate = deadline
  } else if (typeof deadline === 'string' || typeof deadline === 'number') {
    deadlineDate = new Date(deadline)
  } else {
    throw new Error(`Invalid deadline provided: ${deadline}. Expected Date object, string, or number.`)
  }
  
  // Validate the date is valid
  if (isNaN(deadlineDate.getTime())) {
    throw new Error(`Invalid deadline date: ${deadline}. The date could not be parsed.`)
  }
  
  log.info(`Starting ApplicationWorkflow for application ${applicationId}`, {
    applicationId,
    deadline: deadlineDate.toISOString(),
  })

  // Initialize workflow state
  const state: WorkflowState = {
    applicationId,
    status: 'Created',
    deadline: deadlineDate,
    originalDeadline: deadlineDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Set up signal handlers
  setHandler(updateStatusSignal, async (newStatus: string, notes?: string) => {
    log.info(`Received updateStatus signal`, { applicationId, newStatus, notes })
    
    state.lastStatusUpdate = newStatus
    state.lastStatusNotes = notes
    state.updatedAt = new Date()

    // Note: Timeline event and database update are already handled by the API route
    // This workflow only handles workflow-specific logic and notifications
    await updateApplicationStatus(applicationId, newStatus, notes)

    // Handle final statuses
    if (['Offer', 'Rejected', 'Withdrawn'].includes(newStatus)) {
      log.info(`Application reached final status: ${newStatus}`, { applicationId })
      state.status = 'Archived'
      return // End workflow
    }

    // Handle interview status
    if (newStatus === 'Interview') {
      state.status = 'Active'
    }
  })

  setHandler(extendDeadlineSignal, async (days: number) => {
    log.info(`Received extendDeadline signal`, { applicationId, days })
    
    const newDeadline = new Date(state.deadline.getTime() + days * 24 * 60 * 60 * 1000)
    state.deadline = newDeadline
    state.updatedAt = new Date()
    
    log.info(`Extended deadline by ${days} days`, { 
      applicationId, 
      newDeadline: newDeadline.toISOString() 
    })
  })

  setHandler(cancelWorkflowSignal, async (reason?: string) => {
    log.info(`Received cancelWorkflow signal`, { applicationId, reason })
    state.cancelled = true
    state.status = 'Archived'
    state.updatedAt = new Date()
  })

  // Set up query handler
  setHandler(getWorkflowStateQuery, () => state)

  try {
    // Transition to Active state
    state.status = 'Active'
    state.updatedAt = new Date()
    log.info(`Application workflow is now Active`, { applicationId })

    // Wait until deadline
    const now = new Date()
    const timeUntilDeadline = state.deadline.getTime() - now.getTime()
    
    if (timeUntilDeadline > 0) {
      log.info(`Waiting ${timeUntilDeadline}ms until deadline`, { applicationId })
      await sleep(timeUntilDeadline)
    }

    // Check if workflow was cancelled during wait
    // Note: Signal handlers can change status asynchronously, so we check if it's no longer Active
    if (state.cancelled || state.status !== 'Active') {
      log.info(`Workflow cancelled before deadline`, { applicationId })
      return
    }

    // Deadline reached - send reminder
    state.status = 'Remind'
    state.updatedAt = new Date()
    
    log.info(`Deadline reached, sending reminder`, { applicationId })
    await sendDeadlineReminder(applicationId, state.deadline)

    // Wait for grace period (3 days)
    const gracePeriodMs = 3 * 24 * 60 * 60 * 1000 // 3 days
    state.gracePeriodEnd = new Date(Date.now() + gracePeriodMs)
    state.status = 'GracePeriod'
    state.updatedAt = new Date()
    
    log.info(`Starting grace period`, { 
      applicationId, 
      gracePeriodEnd: state.gracePeriodEnd.toISOString() 
    })
    
    await sleep(gracePeriodMs)

    // Check if workflow was cancelled during grace period
    // Note: Signal handlers can change status asynchronously, so we check if it's no longer in GracePeriod
    if (state.cancelled || state.status !== 'GracePeriod') {
      log.info(`Workflow cancelled during grace period`, { applicationId })
      return
    }

    // Grace period ended - archive application
    state.status = 'Archived'
    state.updatedAt = new Date()
    
    log.info(`Grace period ended, archiving application`, { applicationId })
    await archiveApplication(applicationId)

  } catch (error) {
    log.error(`ApplicationWorkflow failed`, { 
      applicationId, 
      error: error instanceof Error ? error.message : String(error)
    })
    state.status = 'Archived'
    state.updatedAt = new Date()
    
    // Try to archive the application even if workflow failed
    try {
      await archiveApplication(applicationId)
    } catch (archiveError) {
      log.error(`Failed to archive application after workflow error`, { 
        applicationId, 
        error: archiveError instanceof Error ? archiveError.message : String(archiveError)
      })
    }
    
    throw error
  }
}

// Helper workflow for cover letter generation
export async function CoverLetterGenerationWorkflow(
  applicationId: string
): Promise<string> {
  log.info(`Starting CoverLetterGenerationWorkflow`, { applicationId })

  try {
    // Update status to Processing
    await updateCoverLetterStatus(applicationId, 'Processing')

    // Get application data from database
    const application = await getApplicationData(applicationId)
    if (!application) {
      throw new Error(`Application ${applicationId} not found`)
    }

    // Get user info for personalization
    const userInfo = await getUserInfo()

    // Generate cover letter
    const coverLetter = await generateCoverLetter({
      jobDescription: application.jobDescription,
      resumeContent: application.resumeContent || undefined,
      companyName: application.company,
      role: application.role,
      applicantName: userInfo.name || undefined,
      applicantEmail: userInfo.email || undefined,
      applicantPhone: userInfo.phone || undefined,
    })

    // Upload to blob storage
    const filename = `cover-letter-${applicationId}-${Date.now()}.txt`
    const blobUrl = await uploadToBlob(coverLetter, filename, 'cover-letters')

    // Update application with cover letter URL
    await updateApplicationWithCoverLetter(applicationId, blobUrl)

    // Update status to Completed
    await updateCoverLetterStatus(applicationId, 'Completed')

    // Create notification for user
    await createCoverLetterNotification(applicationId, 'completed')

    log.info(`Cover letter generated and uploaded`, { 
      applicationId, 
      blobUrl 
    })

    return blobUrl
  } catch (error) {
    log.error(`CoverLetterGenerationWorkflow failed`, { 
      applicationId, 
      error: error instanceof Error ? error.message : String(error)
    })

    // Update status to Failed
    await updateCoverLetterStatus(applicationId, 'Failed')

    // Create failure notification
    await createCoverLetterNotification(applicationId, 'failed')

    throw error
  }
}
