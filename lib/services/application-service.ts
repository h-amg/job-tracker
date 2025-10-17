import { prisma } from '@/lib/prisma'
import { ApplicationStatus, JobType } from '@prisma/client'
import { z } from 'zod'

// Validation schemas
export const CreateApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  jobDescription: z.string().min(1, 'Job description is required'),
  resumeUrl: z.string().optional(),
  // Accept ISO date strings from JSON and coerce to Date
  deadline: z.coerce.date(),
  notes: z.string().optional(),
  salary: z.string().optional(),
  location: z.string().optional(),
  // Normalize UI labels like "Full-time" to Prisma enum values
  jobType: z
    .preprocess((val) => {
      if (typeof val !== 'string') return val
      const normalized = val.toLowerCase().replace(/[^a-z]/g, '')
      switch (normalized) {
        case 'fulltime':
          return JobType.FullTime
        case 'parttime':
          return JobType.PartTime
        case 'contract':
          return JobType.Contract
        case 'internship':
          return JobType.Internship
        default:
          // If already enum string (e.g., "FullTime") or unknown, pass through
          return val as any
      }
    }, z.nativeEnum(JobType))
    .optional(),
})

export const UpdateApplicationSchema = CreateApplicationSchema.partial()

export const UpdateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  notes: z.string().optional(),
  // Accept datetime-local string and coerce to Date
  interviewDate: z.coerce.date().optional(),
})

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>

export class ApplicationService {
  static async createApplication(data: CreateApplicationInput, workflowId?: string) {
    return await prisma.application.create({
      data: {
        ...data,
        workflowId,
        status: ApplicationStatus.Active,
      },
      include: {
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
        },
        notifications: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })
  }

  static async setWorkflowId(id: string, workflowId: string) {
    return await prisma.application.update({
      where: { id },
      data: { workflowId },
    })
  }

  static async getApplications(filters?: {
    status?: ApplicationStatus
    search?: string
    includeArchived?: boolean
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    } else if (!filters?.includeArchived) {
      where.status = {
        not: ApplicationStatus.Archived,
      }
    }

    if (filters?.search) {
      where.OR = [
        { company: { contains: filters.search, mode: 'insensitive' } },
        { role: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return await prisma.application.findMany({
      where,
      include: {
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Latest 5 events
        },
        notifications: {
          where: { read: false },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  static async getApplicationById(id: string) {
    return await prisma.application.findUnique({
      where: { id },
      include: {
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
        },
        notifications: {
          orderBy: { timestamp: 'desc' },
        },
        workflowExecution: true,
      },
    })
  }

  static async updateApplication(id: string, data: UpdateApplicationInput) {
    return await prisma.application.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        timelineEvents: {
          orderBy: { timestamp: 'desc' },
        },
        notifications: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })
  }

  static async updateStatus(id: string, data: UpdateStatusInput) {
    return await prisma.$transaction(async (tx) => {
      // Update application status
      const application = await tx.application.update({
        where: { id },
        data: {
          status: data.status,
          notes: data.notes,
          interviewDate: data.interviewDate,
          updatedAt: new Date(),
        },
      })

      // Create timeline event
      await tx.timelineEvent.create({
        data: {
          applicationId: id,
          status: data.status,
          note: data.notes,
        },
      })

      return application
    })
  }

  static async archiveApplication(id: string) {
    return await prisma.$transaction(async (tx) => {
      // Update application status to archived
      const application = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.Archived,
          updatedAt: new Date(),
        },
      })

      // Create timeline event
      await tx.timelineEvent.create({
        data: {
          applicationId: id,
          status: ApplicationStatus.Archived,
          note: 'Application auto-archived after grace period',
        },
      })

      return application
    })
  }

  static async deleteApplication(id: string) {
    return await prisma.application.delete({
      where: { id },
    })
  }

  static async getApplicationsByDeadline(deadline: Date) {
    return await prisma.application.findMany({
      where: {
        deadline: {
          lte: deadline,
        },
        status: {
          in: [ApplicationStatus.Active, ApplicationStatus.Interview],
        },
      },
    })
  }

  static async getApplicationsInGracePeriod(deadline: Date) {
    const threeDaysAgo = new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    return await prisma.application.findMany({
      where: {
        deadline: {
          lte: threeDaysAgo,
        },
        status: {
          in: [ApplicationStatus.Active, ApplicationStatus.Interview],
        },
      },
    })
  }

  static async getApplicationStats() {
    const stats = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const result = {
      active: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      archived: 0,
      total: 0,
    }

    stats.forEach((stat) => {
      const count = stat._count.status
      result.total += count

      switch (stat.status) {
        case ApplicationStatus.Active:
          result.active = count
          break
        case ApplicationStatus.Interview:
          result.interview = count
          break
        case ApplicationStatus.Offer:
          result.offer = count
          break
        case ApplicationStatus.Rejected:
          result.rejected = count
          break
        case ApplicationStatus.Archived:
          result.archived = count
          break
      }
    })

    return result
  }
}
