#!/usr/bin/env node

import { startWorker } from './worker'

// Load environment variables
import 'dotenv/config'

async function main() {
  console.log('Starting Temporal Worker...')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Temporal Address: ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`)
  console.log(`Temporal Namespace: ${process.env.TEMPORAL_NAMESPACE || 'default'}`)

  try {
    await startWorker()
  } catch (error) {
    console.error('Failed to start worker:', error)
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

// Start the worker
main()
