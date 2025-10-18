-- CreateEnum
CREATE TYPE "ResumeExtractionStatus" AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "CoverLetterGenerationStatus" AS ENUM ('Pending', 'Processing', 'Completed', 'Failed');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "coverLetterGenerationStatus" "CoverLetterGenerationStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "coverLetterGenerationTaskId" TEXT,
ADD COLUMN     "resumeContent" TEXT,
ADD COLUMN     "resumeExtractionStatus" "ResumeExtractionStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "resumeExtractionTaskId" TEXT;
