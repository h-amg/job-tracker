import { NextRequest, NextResponse } from 'next/server'
import { BlobService } from '@/lib/services/blob-service'
import { z } from 'zod'

const UploadSchema = z.object({
  type: z.enum(['resume', 'cover-letter']).default('resume'),
})

// POST /api/upload - Handle resume/document uploads to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'resume'

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    // Validate input
    const validatedData = UploadSchema.parse({ type })

    // Validate file
    const validation = BlobService.validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Upload file
    const result = await BlobService.uploadResume(file, file.name)

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        filename: result.filename,
        size: result.size,
        contentType: result.contentType,
      },
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    
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
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
