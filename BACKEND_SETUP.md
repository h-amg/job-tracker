# Backend Implementation Setup Guide

This guide will help you set up the complete backend infrastructure for the Job Application Tracker.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Vercel Postgres recommended)
- OpenAI API key
- Vercel account (for Blob storage)
- Temporal account (for production workflows)

## 1. Environment Configuration

### Create Environment Files

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual values:

   ```env
   # Database - Get from Vercel Postgres dashboard
   POSTGRES_PRISMA_URL="postgresql://username:password@host:port/database?schema=public&pgbouncer=true&connection_limit=1"
   POSTGRES_URL_NON_POOLING="postgresql://username:password@host:port/database?schema=public"

   # OpenAI API - Get from OpenAI dashboard
   OPENAI_API_KEY="sk-your-openai-api-key-here"

   # Vercel Blob Storage - Get from Vercel dashboard
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token-here"

   # Temporal Configuration
   TEMPORAL_ADDRESS="localhost:7233"
   TEMPORAL_NAMESPACE="default"

   # Next.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   ```

## 2. Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing project
3. Go to Storage → Create Database → Postgres
4. Copy the connection strings to your `.env.local`

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `jobs_tracker`
3. Update connection strings in `.env.local`

### Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# (Optional) Seed the database with sample data
npm run db:seed
```

## 3. Temporal Setup

### Development (Local Temporal Server)

1. Install Temporal CLI:
   ```bash
   # macOS
   brew install temporal

   # Or download from: https://github.com/temporalio/cli/releases
   ```

2. Start Temporal server:
   ```bash
   temporal server start-dev
   ```

3. Verify Temporal is running:
   ```bash
   temporal workflow list
   ```

### Production (Temporal Cloud)

1. Sign up at [Temporal Cloud](https://temporal.io/cloud)
2. Create a namespace
3. Download mTLS certificates
4. Update environment variables:
   ```env
   TEMPORAL_ADDRESS="your-namespace.tmprl.cloud:7233"
   TEMPORAL_CERT_PATH="/path/to/cert.pem"
   TEMPORAL_KEY_PATH="/path/to/key.pem"
   ```

## 4. File Storage Setup

### Vercel Blob Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to Storage → Create → Blob
4. Copy the `BLOB_READ_WRITE_TOKEN` to your `.env.local`

## 5. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env.local` as `OPENAI_API_KEY`

## 6. Running the Application

### Development Mode

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the Temporal worker:
   ```bash
   npm run temporal:worker:dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Start the Temporal worker:
   ```bash
   npm run temporal:worker:prod
   ```

## 7. API Endpoints

The following API endpoints are available:

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/applications/[id]` - Get application details
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Archive application
- `POST /api/applications/[id]/status` - Update status
- `GET /api/applications/[id]/timeline` - Get timeline events
- `POST /api/applications/[id]/cover-letter` - Generate cover letter
- `GET /api/applications/[id]/cover-letter` - Get cover letter

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications` - Mark notifications as read

### File Upload
- `POST /api/upload` - Upload files to Vercel Blob

## 8. Database Schema

The application uses the following main models:

- **Application**: Core job application data
- **TimelineEvent**: Status change history
- **Notification**: System notifications and reminders
- **WorkflowExecution**: Temporal workflow tracking

## 9. Workflow Features

### Application Workflow
- **Created** → **Active** → **Remind** → **GracePeriod** → **Archived**
- Automatic deadline reminders
- 3-day grace period before auto-archiving
- Status update signals
- Deadline extension support

### Cover Letter Generation
- OpenAI GPT-4o-mini integration
- Automatic generation based on job description
- Storage in Vercel Blob
- Progress notifications

## 10. Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL connection strings
   - Ensure database exists and is accessible
   - Check network connectivity

2. **Temporal Connection Error**
   - Ensure Temporal server is running
   - Check `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE`
   - Verify worker is started

3. **OpenAI API Error**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure model access (gpt-4o-mini)

4. **File Upload Error**
   - Verify Vercel Blob token
   - Check file size limits (10MB max)
   - Ensure supported file types

### Debug Commands

```bash
# Check database connection
npm run db:studio

# View Temporal workflows
temporal workflow list

# Check application logs
npm run dev

# Check worker logs
npm run temporal:worker:dev
```

## 11. Production Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy the application
4. Set up Vercel Postgres and Blob storage

### Temporal Worker Deployment

Deploy the worker as a separate service:

1. **Railway**: Create Node.js service with `npm run temporal:worker:prod`
2. **Render**: Deploy as background worker
3. **Fly.io**: Deploy with Dockerfile
4. **Dedicated Server**: Run as systemd service

### Environment Variables for Production

```env
# Database
POSTGRES_PRISMA_URL="your-production-db-url"
POSTGRES_URL_NON_POOLING="your-production-db-direct-url"

# OpenAI
OPENAI_API_KEY="your-production-openai-key"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-production-blob-token"

# Temporal Cloud
TEMPORAL_ADDRESS="your-namespace.tmprl.cloud:7233"
TEMPORAL_NAMESPACE="your-namespace"
TEMPORAL_CERT_PATH="/app/cert.pem"
TEMPORAL_KEY_PATH="/app/key.pem"

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

## 12. Monitoring and Maintenance

### Health Checks
- Database connectivity
- Temporal worker status
- OpenAI API availability
- Vercel Blob storage access

### Regular Tasks
- Monitor workflow executions
- Clean up old notifications
- Backup database
- Monitor API usage and costs

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check Temporal workflow history
4. Verify all environment variables are set correctly
