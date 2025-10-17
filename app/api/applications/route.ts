import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService, CreateApplicationSchema } from '@/lib/services/application-service'
import { TemporalClient } from '@/lib/temporal-client'
import { ApplicationStatus } from '@prisma/client'
import { z } from 'zod'

// GET /api/applications - Fetch all applications with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    const result = await ApplicationService.getApplications({
      status: status as ApplicationStatus | undefined,
      search: search || undefined,
      includeArchived,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch applications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = CreateApplicationSchema.parse(body)
    
    // Create application first to get real ID
    const application = await ApplicationService.createApplication(validatedData)

    // Start Temporal workflow using real application ID
    let workflowId: string | undefined
    try {
      const workflowHandle = await TemporalClient.startApplicationWorkflow(
        application.id,
        validatedData.deadline
      )
      workflowId = workflowHandle.workflowId
      // Persist workflowId on the application
      await ApplicationService.setWorkflowId(application.id, workflowId)
    } catch (workflowError) {
      console.warn('Failed to start workflow, continuing without it:', workflowError)
    }

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    
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
        error: 'Failed to create application',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
