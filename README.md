# Job Application Tracker

A comprehensive job application management system built with Next.js, Temporal workflows, and AI-powered features.

## 🚀 Features

- **Application Management**: Track job applications with deadlines, status updates, and timeline events
- **Automated Workflows**: Temporal-powered workflows handle reminders, archiving, and notifications
- **AI-Powered Resume Processing**: Extract text from uploaded resumes automatically
- **Cover Letter Generation**: Generate personalized cover letters using OpenAI
- **Real-time Notifications**: In-app notification system with streaming updates
- **Timeline Tracking**: Visual timeline of application status changes
- **File Storage**: Secure cloud storage for resumes and cover letters

## 🎨 Design Philosophy

### User Experience Principles
- **Minimalist Interface**: Clean, intuitive design that's easy to understand and navigate
- **Performance-First**: Infinite scrolling for seamless browsing without pagination delays
- **Real-time Updates**: Live notifications for cover letter completion and deadline reminders
- **Progressive Enhancement**: Resume uploads start immediately while form is being filled

### Key Design Decisions

**Dashboard Layout**
- Combined stats and filters in top cards for quick status overview and filtering
- Search bar for instant application lookup by company name
- Two-page structure: active applications (dashboard) and archived applications

**Application Management**
- Automatic archiving after grace period with manual override option
- Calendar view for interview scheduling with click-to-navigate functionality
- Timeline visualization for application status progression

**File Processing Flow**
- Resume upload positioned at top of form for immediate processing
- Background Temporal workflows handle extraction and cover letter generation
- Seamless user experience with upload completion before form submission

## 🏗️ Architecture

### Core Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Workflow Engine**: Temporal.io
- **AI Services**: OpenAI API
- **File Storage**: Vercel Blob Storage
- **UI Components**: Radix UI, shadcn/ui

### Temporal Workflow System

This application uses **Temporal** for reliable, long-running workflow orchestration. Temporal ensures your job applications are automatically managed even if the server restarts or encounters failures.

#### Workflow Types

1. **Application Workflow** (`ApplicationWorkflow`)
   - Manages the complete lifecycle of each job application
   - Automatically sends deadline reminders
   - Handles grace periods and archiving
   - Responds to status updates and deadline extensions

2. **Resume Extraction Workflow** (`ResumeExtractionWorkflow`)
   - Downloads uploaded resume files
   - Extracts text content using AI
   - Saves extracted content to database
   - Triggers cover letter generation

3. **Cover Letter Generation Workflow** (`CoverLetterGenerationWorkflow`)
   - Generates personalized cover letters using OpenAI
   - Uploads cover letters to cloud storage
   - Updates application records with cover letter URLs

#### Workflow States

```
Application Lifecycle:
Created → Active → Remind → GracePeriod → Archived
```

#### Key Temporal Concepts

- **Workflows**: Long-running business processes (application lifecycle management)
- **Activities**: Individual tasks (send notifications, process files, call APIs)
- **Signals**: External communication to running workflows (status updates, deadline changes)
- **Worker**: Background process that executes workflows and activities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Vercel account (for blob storage)
- Temporal server (local or cloud)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd jobs-tracker
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   # Database
   POSTGRES_PRISMA_URL="postgresql://username:password@host:port/database"
   POSTGRES_URL_NON_POOLING="postgresql://username:password@host:port/database"
   
   # OpenAI
   OPENAI_API_KEY="sk-your-openai-api-key"
   
   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token"
   
   # Temporal
   TEMPORAL_ADDRESS="localhost:7233"
   TEMPORAL_NAMESPACE="default"
   ```

3. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed  # Optional: seed with sample data
   ```

4. **Start Temporal server** (local development)
   ```bash
   temporal server start-dev
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start Next.js dev server
   npm run dev
   
   # Terminal 2: Start Temporal worker
   npm run temporal:worker:dev
   ```

6. **Open the application**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── applications/  # Application CRUD operations
│   │   ├── notifications/ # Notification system
│   │   └── upload/       # File upload handling
│   ├── application/       # Application detail pages
│   └── settings/         # Settings pages
├── components/           # React components
│   ├── features/        # Feature-specific components
│   └── ui/             # Reusable UI components
├── lib/                 # Utilities and services
│   ├── services/        # Business logic services
│   └── temporal-client.ts # Temporal client wrapper
├── temporal/            # Temporal workflow definitions
│   ├── activities/      # Workflow activities
│   ├── workflows/       # Workflow definitions
│   └── worker.ts        # Temporal worker
└── prisma/             # Database schema and migrations
```

## 🔄 How Temporal Works

### 1. Application Creation
When you create a job application:
1. Database record is created
2. `ApplicationWorkflow` starts with the deadline
3. Workflow waits until deadline, then sends reminder
4. After grace period, application is automatically archived

### 2. Resume Processing
When you upload a resume:
1. `ResumeExtractionWorkflow` starts
2. File is downloaded and text extracted
3. Content is saved to database
4. `CoverLetterGenerationWorkflow` is triggered

### 3. Status Updates
When you update application status:
1. Database is updated
2. Signal is sent to running workflow
3. Workflow handles the status change
4. Notifications are created

### 4. Workflow Resilience
- Workflows survive server restarts
- Automatic retries for failed operations
- Durable execution state
- Full workflow history tracking

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start Next.js dev server
npm run temporal:worker:dev   # Start Temporal worker in dev mode

# Database
npm run db:generate           # Generate Prisma client
npm run db:migrate           # Run database migrations
npm run db:seed              # Seed database with sample data
npm run db:studio            # Open Prisma Studio

# Production
npm run build                # Build the application
npm run start                # Start production server
npm run temporal:worker:prod # Start Temporal worker in prod mode
```

### Temporal Commands

```bash
# Start local Temporal server
temporal server start-dev

# List running workflows
temporal workflow list

# View workflow history
temporal workflow show --workflow-id <workflow-id>

# Signal a workflow
temporal workflow signal --workflow-id <workflow-id> --name updateStatus --input '["Interview", "Scheduled for next week"]'
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_PRISMA_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Yes |
| `TEMPORAL_ADDRESS` | Temporal server address | Yes |
| `TEMPORAL_NAMESPACE` | Temporal namespace | Yes |

### Temporal Configuration

- **Task Queue**: `application-task-queue`
- **Workflow Timeouts**: 365 days execution, 30 days run
- **Activity Timeouts**: 5-10 minutes with retry policies
- **Max Concurrency**: 10 activities, 10 workflows

## 📊 API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Get application details
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Archive application
- `POST /api/applications/[id]/status` - Update status
- `GET /api/applications/[id]/timeline` - Get timeline events

### Resume & Cover Letters
- `POST /api/applications/[id]/resume-content` - Extract resume content
- `POST /api/applications/[id]/cover-letter` - Generate cover letter

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/stream` - Stream notifications

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set up environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Temporal Cloud

1. **Sign up** at [Temporal Cloud](https://temporal.io/cloud)
2. **Create namespace** and download certificates
3. **Update environment variables**:
   ```env
   TEMPORAL_ADDRESS="your-namespace.tmprl.cloud:7233"
   TEMPORAL_CERT_PATH="/path/to/cert.pem"
   TEMPORAL_KEY_PATH="/path/to/key.pem"
   ```
