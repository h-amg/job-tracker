import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService } from '@/lib/services/application-service'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/applications/[id]/timeline - Fetch timeline history for an application
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if application exists
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

    // Return timeline events (already included in the application data)
    return NextResponse.json({
      success: true,
      data: application.timelineEvents,
    })
  } catch (error) {
    console.error('Error fetching application timeline:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch application timeline',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
