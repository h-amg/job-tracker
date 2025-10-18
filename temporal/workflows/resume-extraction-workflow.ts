import { proxyActivities, log, sleep } from '@temporalio/workflow'
import type * as activities from '../activities/application-activities'

// Import activities
const {
  downloadResumeFile,
  extractResumeText,
  saveResumeContent,
  updateResumeExtractionStatus,
  triggerCoverLetterWorkflow,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10m',
  retry: {
    initialInterval: '1s',
    maximumInterval: '100s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
})

/**
 * Resume Extraction Workflow
 * 
 * This workflow handles the extraction of text content from uploaded resume files.
 * It downloads the file, extracts text using mammoth, saves it to the database,
 * and then triggers the cover letter generation workflow.
 */
export async function ResumeExtractionWorkflow(
  applicationId: string,
  resumeUrl: string
): Promise<void> {
  log.info(`Starting ResumeExtractionWorkflow for application ${applicationId}`, {
    applicationId,
    resumeUrl,
  })

  try {
    // Update status to Processing
    await updateResumeExtractionStatus(applicationId, 'Processing')

    // Download the resume file
    log.info(`Downloading resume file for application ${applicationId}`)
    const resumeBuffer = await downloadResumeFile(resumeUrl)

    // Extract text from the resume
    log.info(`Extracting text from resume for application ${applicationId}`)
    const extractedText = await extractResumeText(resumeBuffer, resumeUrl)

    // Save the extracted content to the database
    log.info(`Saving extracted resume content for application ${applicationId}`)
    await saveResumeContent(applicationId, extractedText)

    // Update status to Completed
    await updateResumeExtractionStatus(applicationId, 'Completed', undefined, extractedText)

    log.info(`Resume extraction completed successfully for application ${applicationId}`)

    // Trigger cover letter generation workflow
    log.info(`Triggering cover letter generation for application ${applicationId}`)
    await triggerCoverLetterWorkflow(applicationId)

  } catch (error) {
    log.error(`ResumeExtractionWorkflow failed for application ${applicationId}`, {
      applicationId,
      error: error instanceof Error ? error.message : String(error),
    })

    // Update status to Failed
    await updateResumeExtractionStatus(applicationId, 'Failed')

    // Re-throw the error to mark the workflow as failed
    throw error
  }
}
