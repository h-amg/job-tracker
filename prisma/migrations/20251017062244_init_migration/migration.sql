-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Active', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Archived');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FullTime', 'PartTime', 'Contract', 'Internship');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DeadlineReminder', 'InterviewReminder', 'CoverLetterGenerated', 'StatusUpdate');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('Running', 'Completed', 'Failed', 'Cancelled');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "coverLetterUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Active',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "interviewDate" TIMESTAMP(3),
    "salary" TEXT,
    "location" TEXT,
    "jobType" "JobType" DEFAULT 'FullTime',
    "workflowId" TEXT,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'Pending',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'Running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_workflowId_key" ON "applications"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_executions_applicationId_key" ON "workflow_executions"("applicationId");

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
