import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService } from '@/lib/services/application-service'
import { CoverLetterService, GenerateCoverLetterSchema } from '@/lib/services/cover-letter-service'
import { BlobService } from '@/lib/services/blob-service'
import { NotificationService } from '@/lib/services/notification-service'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/applications/[id]/cover-letter - Trigger cover letter generation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = GenerateCoverLetterSchema.parse(body)
    
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

    // Create pending notification
    await NotificationService.createCoverLetterNotification(params.id, 'pending')

    try {
      // Generate cover letter
      const coverLetter = await CoverLetterService.generateCoverLetterWithRetry({
        jobDescription: application.jobDescription,
        resumeContent: validatedData.resumeContent,
        companyName: application.company,
        role: application.role,
        applicantName: validatedData.applicantName,
        applicantEmail: validatedData.applicantEmail,
        applicantPhone: validatedData.applicantPhone,
      })

      // Upload to blob storage
      const filename = `cover-letter-${params.id}-${Date.now()}.txt`
      const uploadResult = await BlobService.uploadCoverLetter(coverLetter, filename)

      // Update application with cover letter URL
      await ApplicationService.updateApplication(params.id, {
        coverLetterUrl: uploadResult.url,
      })

      // Create success notification
      await NotificationService.createCoverLetterNotification(params.id, 'completed')

      return NextResponse.json({
        success: true,
        data: {
          coverLetterUrl: uploadResult.url,
          content: coverLetter,
        },
        message: 'Cover letter generated successfully',
      })
    } catch (generationError) {
      // Create failure notification
      await NotificationService.createCoverLetterNotification(params.id, 'failed')
      
      throw generationError
    }
  } catch (error) {
    console.error('Error generating cover letter:', error)
    
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
        error: 'Failed to generate cover letter',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/applications/[id]/cover-letter - Retrieve generated cover letter
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

    if (!application.coverLetterUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cover letter not found',
          message: 'No cover letter has been generated for this application',
        },
        { status: 404 }
      )
    }

    // Fetch cover letter from blob storage
    try {
      const response = await fetch(application.coverLetterUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch cover letter from storage')
      }
      
      const content = await response.text()

      return NextResponse.json({
        success: true,
        data: {
          coverLetterUrl: application.coverLetterUrl,
          content,
        },
      })
    } catch (fetchError) {
      console.error('Error fetching cover letter from blob storage:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve cover letter',
          message: 'Cover letter file not accessible',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error retrieving cover letter:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cover letter',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
