import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/health/db - connectivity and basic read
export async function GET() {
  try {
    // Simple connectivity check
    await prisma.$queryRaw`SELECT 1` as unknown

    // Basic read on applications table
    const count = await prisma.application.count()

    return NextResponse.json({ success: true, connected: true, applicationCount: count })
  } catch (error) {
    console.error('DB health check failed:', error)
    return NextResponse.json(
      { success: false, connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/health/db - smoke test write/read/delete
export async function POST() {
  try {
    const now = new Date()
    const uniqueSuffix = Math.random().toString(36).slice(2, 8)

    // Create minimal valid application
    const created = await prisma.application.create({
      data: {
        company: `DB Smoke Co ${uniqueSuffix}`,
        role: `Smoke Tester ${uniqueSuffix}`,
        jobDescription: 'Temporary record created by DB health check',
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Read it back
    const fetched = await prisma.application.findUnique({ where: { id: created.id } })

    // Clean up (best effort)
    await prisma.application.delete({ where: { id: created.id } }).catch(() => {})

    return NextResponse.json({ success: true, created: !!created, fetched: !!fetched, sampleId: created.id })
  } catch (error) {
    console.error('DB write/read/delete smoke test failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


