import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService, UpdateApplicationSchema } from '@/lib/services/application-service'
import { TemporalClient } from '@/lib/temporal-client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/applications/[id] - Fetch single application with timeline events
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const application = await ApplicationService.getApplicationById(params.id)
    
    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: application,
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch application',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/applications/[id] - Update application details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = UpdateApplicationSchema.parse(body)
    
    // Check if application exists
    const existingApplication = await ApplicationService.getApplicationById(params.id)
    if (!existingApplication) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found',
        },
        { status: 404 }
      )
    }

    // Update application
    const application = await ApplicationService.updateApplication(params.id, validatedData)

    // Signal workflow if deadline changed
    if (validatedData.deadline && existingApplication.workflowId) {
      try {
        await TemporalClient.signalWorkflow(
          existingApplication.workflowId,
          'extendDeadline',
          [Math.ceil((validatedData.deadline.getTime() - existingApplication.deadline.getTime()) / (1000 * 60 * 60 * 24))]
        )
      } catch (signalError) {
        console.warn('Failed to signal workflow about deadline change:', signalError)
      }
    }

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application updated successfully',
    })
  } catch (error) {
    console.error('Error updating application:', error)
    
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
        error: 'Failed to update application',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/applications/[id] - Soft delete (archive) application, cancel workflow
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if application exists
    const existingApplication = await ApplicationService.getApplicationById(params.id)
    if (!existingApplication) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found',
        },
        { status: 404 }
      )
    }

    // Cancel workflow if it exists
    if (existingApplication.workflowId) {
      try {
        await TemporalClient.cancelWorkflow(existingApplication.workflowId, 'Application deleted by user')
      } catch (workflowError) {
        console.warn('Failed to cancel workflow:', workflowError)
      }
    }

    // Archive application (soft delete)
    await ApplicationService.archiveApplication(params.id)

    return NextResponse.json({
      success: true,
      message: 'Application archived successfully',
    })
  } catch (error) {
    console.error('Error archiving application:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive application',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
