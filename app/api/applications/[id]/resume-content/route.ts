import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService } from '@/lib/services/application-service'
import { TemporalClient } from '@/lib/temporal-client'

// GET /api/applications/[id]/resume-content - Get resume content or trigger extraction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application ID is required',
        },
        { status: 400 }
      )
    }

    // Get application data
    const application = await ApplicationService.getApplicationById(applicationId)
    
    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found',
        },
        { status: 404 }
      )
    }

    // Check if resume content already exists
    if (application.resumeContent) {
      return NextResponse.json({
        success: true,
        data: {
          content: application.resumeContent,
          status: application.resumeExtractionStatus,
          taskId: application.resumeExtractionTaskId,
        },
        message: 'Resume content retrieved successfully',
      })
    }

    // Check if extraction is already in progress
    if (application.resumeExtractionStatus === 'Processing') {
      return NextResponse.json({
        success: true,
        data: {
          content: null,
          status: application.resumeExtractionStatus,
          taskId: application.resumeExtractionTaskId,
        },
        message: 'Resume extraction in progress',
      })
    }

    // Check if extraction failed
    if (application.resumeExtractionStatus === 'Failed') {
      return NextResponse.json({
        success: false,
        error: 'Resume extraction failed',
        data: {
          status: application.resumeExtractionStatus,
          taskId: application.resumeExtractionTaskId,
        },
      }, { status: 500 })
    }

    // If no resume URL, return error
    if (!application.resumeUrl) {
      return NextResponse.json({
        success: false,
        error: 'No resume file uploaded for this application',
      }, { status: 400 })
    }

    // If no job description, return error
    if (!application.jobDescription) {
      return NextResponse.json({
        success: false,
        error: 'Job description is required for resume extraction',
      }, { status: 400 })
    }

    // Start resume extraction workflow
    try {
      const resumeWorkflowHandle = await TemporalClient.startResumeExtractionWorkflow(
        applicationId,
        application.resumeUrl
      )
      
      // Update application with resume extraction task ID and status
      await ApplicationService.updateResumeExtractionStatus(
        applicationId,
        'Processing',
        resumeWorkflowHandle.workflowId
      )
      
      return NextResponse.json({
        success: true,
        data: {
          content: null,
          status: 'Processing',
          taskId: resumeWorkflowHandle.workflowId,
        },
        message: 'Resume extraction started',
      })
    } catch (workflowError) {
      console.error('Failed to start resume extraction workflow:', workflowError)
      
      // Update status to Failed
      await ApplicationService.updateResumeExtractionStatus(
        applicationId,
        'Failed'
      )
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start resume extraction',
          message: workflowError instanceof Error ? workflowError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in resume content endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process resume content request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
