import { Worker, NativeConnection } from '@temporalio/worker'
import { fileURLToPath, pathToFileURL } from 'url'
import * as activities from './activities/application-activities'
import { ApplicationWorkflow, CoverLetterGenerationWorkflow } from './workflows/application-workflow'
import { ResumeExtractionWorkflow } from './workflows/resume-extraction-workflow'

function getConnectionConfig() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233'
  const apiKey = process.env.TEMPORAL_API_KEY

  // For local development without authentication
  if (!apiKey) {
    return {
      address,
    }
  }

  // For Temporal Cloud with API key authentication
  return {
    address,
    tls: true,
    metadata: {
      'authorization': `Bearer ${apiKey}`,
    },
  }
}

async function run() {
  // Get connection configuration
  const connectionConfig = getConnectionConfig()
  
  // Create native worker connection (NOT the client Connection)
  const connection = await NativeConnection.connect(connectionConfig)

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: 'application-task-queue',
    // ESM-safe workflows path resolution - point to workflows directory
    workflowsPath: fileURLToPath(new URL('./workflows', import.meta.url)),
    activities,
    // Configure worker options
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
    maxConcurrentLocalActivityExecutions: 10,
  })

  // Handle graceful shutdown
  const shutdown = async () => {
    await worker.shutdown()
    await connection.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Start worker
  try {
    await worker.run()
  } catch (error) {
    console.error('Worker failed:', error)
    await shutdown()
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the worker (ESM-safe main module check)
const isMainModule = import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  run().catch((error) => {
    console.error('Failed to start worker:', error)
    process.exit(1)
  })
}

export { run as startWorker }
