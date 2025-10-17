import { PrismaClient, ApplicationStatus, JobType, NotificationType, NotificationStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.workflowExecution.deleteMany()
  await prisma.application.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create sample applications
  const applications = [
    {
      id: '1',
      company: 'TechCorp',
      role: 'Senior Frontend Engineer',
      jobDescription: 'We are looking for an experienced frontend engineer to join our team. You will work on building scalable web applications using React, TypeScript, and modern web technologies. The ideal candidate will have 5+ years of experience with React, TypeScript, and modern CSS frameworks.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-1.pdf',
      status: ApplicationStatus.Interview,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Had initial phone screen, technical interview scheduled for next week',
      interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      salary: '$120k - $150k',
      location: 'San Francisco, CA (Hybrid)',
      jobType: JobType.FullTime,
      workflowId: 'workflow-1',
    },
    {
      id: '2',
      company: 'StartupXYZ',
      role: 'Full Stack Developer',
      jobDescription: 'Join our fast-growing startup as a full stack developer. Work with Node.js, React, and PostgreSQL to build innovative products. We are looking for someone who can work independently and contribute to our product roadmap.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-2.pdf',
      status: ApplicationStatus.Active,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      salary: '$100k - $130k',
      location: 'Remote',
      jobType: JobType.FullTime,
      workflowId: 'workflow-2',
    },
    {
      id: '3',
      company: 'Enterprise Solutions Inc',
      role: 'Software Engineer',
      jobDescription: 'Looking for a software engineer to work on enterprise-level applications. Experience with Java, Spring Boot, and microservices required. You will be part of a team building scalable solutions for Fortune 500 companies.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-3.pdf',
      status: ApplicationStatus.Offer,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'Received offer! Need to respond by deadline',
      salary: '$140k - $160k',
      location: 'New York, NY (On-site)',
      jobType: JobType.FullTime,
      workflowId: 'workflow-3',
    },
    {
      id: '4',
      company: 'CloudTech',
      role: 'DevOps Engineer',
      jobDescription: 'Seeking a DevOps engineer to manage our cloud infrastructure. AWS, Kubernetes, and Terraform experience preferred. You will be responsible for maintaining and scaling our infrastructure.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-4.pdf',
      status: ApplicationStatus.Rejected,
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
      notes: 'Received rejection email - they went with another candidate',
      salary: '$130k - $150k',
      location: 'Seattle, WA (Hybrid)',
      jobType: JobType.FullTime,
      workflowId: 'workflow-4',
    },
    {
      id: '5',
      company: 'DataCorp',
      role: 'Data Engineer',
      jobDescription: 'Build and maintain data pipelines using Python, Spark, and Airflow. Work with large-scale data processing systems. Experience with big data technologies is a plus.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-5.pdf',
      status: ApplicationStatus.Active,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      notes: 'Deadline approaching - need to follow up',
      salary: '$110k - $140k',
      location: 'Austin, TX (Remote)',
      jobType: JobType.FullTime,
      workflowId: 'workflow-5',
    },
    {
      id: '6',
      company: 'FinTech Solutions',
      role: 'Backend Engineer',
      jobDescription: 'Work on financial technology solutions using Go and microservices architecture. Experience with financial systems and security is preferred.',
      resumeUrl: 'https://example.com/resumes/resume-1.pdf',
      coverLetterUrl: 'https://example.com/cover-letters/cover-6.pdf',
      status: ApplicationStatus.Archived,
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      notes: 'Auto-archived after grace period',
      salary: '$125k - $145k',
      location: 'Boston, MA (On-site)',
      jobType: JobType.FullTime,
      workflowId: 'workflow-6',
    },
  ]

  // Create applications
  for (const appData of applications) {
    const application = await prisma.application.create({
      data: appData,
    })
    console.log(`✅ Created application: ${application.company} - ${application.role}`)
  }

  // Create timeline events
  const timelineEvents = [
    {
      id: 't1',
      applicationId: '1',
      status: ApplicationStatus.Active,
      note: 'Application submitted',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't2',
      applicationId: '1',
      status: ApplicationStatus.Interview,
      note: 'Phone screen completed, moving to technical round',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't3',
      applicationId: '3',
      status: ApplicationStatus.Active,
      note: 'Application submitted',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't4',
      applicationId: '3',
      status: ApplicationStatus.Interview,
      note: 'First round interview',
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't5',
      applicationId: '3',
      status: ApplicationStatus.Offer,
      note: 'Offer received! Salary: $140k-$160k',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const eventData of timelineEvents) {
    await prisma.timelineEvent.create({
      data: eventData,
    })
  }
  console.log(`✅ Created ${timelineEvents.length} timeline events`)

  // Create notifications
  const notifications = [
    {
      id: 'n1',
      applicationId: '1',
      type: NotificationType.CoverLetterGenerated,
      title: 'Cover Letter Generated',
      message: 'Your personalized cover letter is ready to view and copy',
      status: NotificationStatus.Completed,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
    },
    {
      id: 'n2',
      applicationId: '2',
      type: NotificationType.CoverLetterGenerated,
      title: 'Generating Cover Letter',
      message: 'AI is crafting your personalized cover letter based on the job description',
      status: NotificationStatus.Pending,
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      read: false,
    },
    {
      id: 'n3',
      applicationId: '1',
      type: NotificationType.InterviewReminder,
      title: 'Interview Tomorrow',
      message: 'Interview scheduled for Dec 20, 2024 at 2:00 PM',
      status: NotificationStatus.Completed,
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: false,
    },
    {
      id: 'n4',
      applicationId: '5',
      type: NotificationType.DeadlineReminder,
      title: 'Deadline Approaching',
      message: 'Application deadline is in 2 days',
      status: NotificationStatus.Completed,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
  ]

  for (const notificationData of notifications) {
    await prisma.notification.create({
      data: notificationData,
    })
  }
  console.log(`✅ Created ${notifications.length} notifications`)

  // Create workflow executions
  const workflowExecutions = [
    {
      id: 'we1',
      applicationId: '1',
      workflowId: 'workflow-1',
      runId: 'run-1',
      status: 'Running' as any,
    },
    {
      id: 'we2',
      applicationId: '2',
      workflowId: 'workflow-2',
      runId: 'run-2',
      status: 'Running' as any,
    },
    {
      id: 'we3',
      applicationId: '3',
      workflowId: 'workflow-3',
      runId: 'run-3',
      status: 'Running' as any,
    },
  ]

  for (const executionData of workflowExecutions) {
    await prisma.workflowExecution.create({
      data: executionData,
    })
  }
  console.log(`✅ Created ${workflowExecutions.length} workflow executions`)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
