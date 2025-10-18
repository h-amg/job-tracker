import { Worker, NativeConnection } from '@temporalio/worker'
import { fileURLToPath, pathToFileURL } from 'url'
import * as activities from './activities/application-activities'
import { ApplicationWorkflow, CoverLetterGenerationWorkflow } from './workflows/application-workflow'
import { ResumeExtractionWorkflow } from './workflows/resume-extraction-workflow'

async function run() {
  console.log('Starting Temporal worker...')

  // Create native worker connection (NOT the client Connection)
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    // For Temporal Cloud, you would add TLS configuration here
    // tls: {
    //   clientCertPair: {
    //     crt: fs.readFileSync(process.env.TEMPORAL_CERT_PATH!),
    //     key: fs.readFileSync(process.env.TEMPORAL_KEY_PATH!),
    //   },
    // },
  })

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

  console.log('Temporal worker created successfully')
  console.log(`Worker listening on namespace: ${process.env.TEMPORAL_NAMESPACE || 'default'}`)
  console.log(`Worker task queue: application-task-queue`)

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down Temporal worker...')
    await worker.shutdown()
    await connection.close()
    console.log('Temporal worker shutdown complete')
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
