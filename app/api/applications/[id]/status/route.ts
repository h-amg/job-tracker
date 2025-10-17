import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService, UpdateStatusSchema } from '@/lib/services/application-service'
import { TemporalClient } from '@/lib/temporal-client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/applications/[id]/status - Update application status
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = UpdateStatusSchema.parse(body)
    
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

    // Update application status
    const application = await ApplicationService.updateStatus(params.id, validatedData)

    // Signal workflow if it exists
    if (existingApplication.workflowId) {
      try {
        const workflowSignaled = await TemporalClient.updateStatus(
          existingApplication.workflowId,
          validatedData.status,
          validatedData.notes
        )
        
        // If workflow doesn't exist, clear the stale workflowId from database
        if (!workflowSignaled) {
          console.log(`Clearing stale workflowId for application ${params.id}`)
          await ApplicationService.setWorkflowId(params.id, null)
        }
      } catch (signalError) {
        console.error('Failed to signal workflow about status update:', signalError)
      }
    }

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application status updated successfully',
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    
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
        error: 'Failed to update application status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
