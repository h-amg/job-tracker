import { proxyActivities, defineSignal, defineQuery, setHandler, sleep, log } from '@temporalio/workflow'
import type * as activities from '../activities/application-activities'

// Import activities
const {
  sendDeadlineReminder,
  archiveApplication,
  createTimelineEvent,
  updateApplicationStatus,
  generateCoverLetter,
  uploadToBlob,
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

// Define queries
export const getWorkflowStateQuery = defineQuery<WorkflowState>('getWorkflowState')

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
}

// Main workflow function
export async function ApplicationWorkflow(applicationId: string, deadline: Date | string): Promise<void> {
  // Ensure deadline is a Date object
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline)
  
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

    // Create timeline event
    await createTimelineEvent(applicationId, newStatus, notes)

    // Update application status in database
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
    if (state.status === 'Archived') {
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
    if (state.status === 'Archived') {
      log.info(`Workflow cancelled during grace period`, { applicationId })
      return
    }

    // Grace period ended - archive application
    state.status = 'Archived'
    state.updatedAt = new Date()
    
    log.info(`Grace period ended, archiving application`, { applicationId })
    await archiveApplication(applicationId)

  } catch (error) {
    log.error(`ApplicationWorkflow failed`, { applicationId, error: error.message })
    state.status = 'Archived'
    state.updatedAt = new Date()
    
    // Try to archive the application even if workflow failed
    try {
      await archiveApplication(applicationId)
    } catch (archiveError) {
      log.error(`Failed to archive application after workflow error`, { 
        applicationId, 
        error: archiveError.message 
      })
    }
    
    throw error
  }
}

// Helper workflow for cover letter generation
export async function CoverLetterGenerationWorkflow(
  applicationId: string,
  jobDescription: string,
  resumeContent?: string,
  companyName?: string,
  role?: string
): Promise<string> {
  log.info(`Starting CoverLetterGenerationWorkflow`, { applicationId })

  try {
    // Generate cover letter
    const coverLetter = await generateCoverLetter({
      jobDescription,
      resumeContent,
      companyName,
      role,
    })

    // Upload to blob storage
    const filename = `cover-letter-${applicationId}-${Date.now()}.txt`
    const blobUrl = await uploadToBlob(coverLetter, filename, 'cover-letters')

    log.info(`Cover letter generated and uploaded`, { 
      applicationId, 
      blobUrl 
    })

    return blobUrl
  } catch (error) {
    log.error(`CoverLetterGenerationWorkflow failed`, { 
      applicationId, 
      error: error.message 
    })
    throw error
  }
}
