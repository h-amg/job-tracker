import { Connection, Client } from '@temporalio/client'
import { WorkflowHandle } from '@temporalio/client'

export class TemporalClient {
  private static client: Client | null = null
  private static connection: Connection | null = null

  static async getClient(): Promise<Client> {
    if (!this.client) {
      await this.initialize()
    }
    return this.client!
  }

  static async initialize() {
    try {
      // Create connection
      this.connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        // For Temporal Cloud, you would add TLS configuration here
        // tls: {
        //   clientCertPair: {
        //     crt: fs.readFileSync(process.env.TEMPORAL_CERT_PATH!),
        //     key: fs.readFileSync(process.env.TEMPORAL_KEY_PATH!),
        //   },
        // },
      })

      // Create client
      this.client = new Client({
        connection: this.connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      })

      console.log('Temporal client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Temporal client:', error)
      throw error
    }
  }

  static async startApplicationWorkflow(
    applicationId: string,
    deadline: Date | string,
    options?: {
      workflowId?: string
      taskQueue?: string
    }
  ): Promise<WorkflowHandle> {
    const client = await this.getClient()
    
    const workflowId = options?.workflowId || `application-workflow-${applicationId}`
    const taskQueue = options?.taskQueue || 'application-task-queue'
    
    // Ensure deadline is a Date object
    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline)

    try {
      const handle = await client.workflow.start('ApplicationWorkflow', {
        args: [applicationId, deadlineDate],
        taskQueue,
        workflowId,
        // Set workflow execution timeout to 1 year (applications can be long-running)
        workflowExecutionTimeout: '365d',
        // Set workflow run timeout to 30 days (individual runs shouldn't take that long)
        workflowRunTimeout: '30d',
      })
      console.log(`Started workflow ${workflowId} for application ${applicationId}`)
      return handle
    } catch (err: unknown) {
      // If a workflow with the same ID is already running, return a handle to it (idempotent start)
      if (err && (err.name === 'WorkflowExecutionAlreadyStartedError' || String(err).includes('Workflow execution already started'))) {
        console.warn(`Workflow ${workflowId} already started, returning existing handle`)
        return client.workflow.getHandle(workflowId)
      }
      throw err
    }
  }

  static async signalWorkflow(
    workflowId: string,
    signalName: string,
    args: unknown[] = []
  ): Promise<void> {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    await handle.signal(signalName, ...args)
    
    console.log(`Sent signal ${signalName} to workflow ${workflowId}`)
  }

  static async updateStatus(workflowId: string, status: string, notes?: string): Promise<void> {
    await this.signalWorkflow(workflowId, 'updateStatus', [status, notes])
  }

  static async extendDeadline(workflowId: string, days: number): Promise<void> {
    await this.signalWorkflow(workflowId, 'extendDeadline', [days])
  }

  static async cancelWorkflow(workflowId: string, reason?: string): Promise<void> {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    await handle.cancel(reason)
    
    console.log(`Cancelled workflow ${workflowId}${reason ? `: ${reason}` : ''}`)
  }

  static async getWorkflowStatus(workflowId: string) {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    const description = await handle.describe()
    
    return {
      workflowId: description.workflowId,
      runId: description.runId,
      status: description.status,
      startTime: description.startTime,
      closeTime: description.closeTime,
      executionTime: description.executionTime,
    }
  }

  static async queryWorkflow(workflowId: string, queryName: string, args: unknown[] = []) {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    return await handle.query(queryName, ...args)
  }

  static async getWorkflowHistory(workflowId: string, maxEvents = 100) {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    const history = await handle.fetchHistory()
    
    return history.events.slice(-maxEvents) // Return last N events
  }

  static async listWorkflows(filters?: {
    workflowType?: string
    status?: string
    startTime?: Date
    endTime?: Date
  }) {
    const client = await this.getClient()
    
    const workflows = await client.workflowService.listWorkflowExecutions({
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      maximumPageSize: 100,
      filters: filters ? {
        workflowType: filters.workflowType ? { name: filters.workflowType } : undefined,
        startTime: filters.startTime ? { earliestTime: filters.startTime } : undefined,
        closeTime: filters.endTime ? { latestTime: filters.endTime } : undefined,
        status: filters.status as 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'TERMINATED' | 'CONTINUED_AS_NEW' | 'TIMED_OUT',
      } : undefined,
    })

    return workflows.executions
  }

  static async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    const client = await this.getClient()
    
    const handle = client.workflow.getHandle(workflowId)
    await handle.terminate(reason)
    
    console.log(`Terminated workflow ${workflowId}${reason ? `: ${reason}` : ''}`)
  }

  static async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close()
      this.connection = null
      this.client = null
      console.log('Temporal client connection closed')
    }
  }

  // Health check method
  static async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient()
      // Try to list workflows as a health check
      await client.workflowService.listWorkflowExecutions({
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        maximumPageSize: 1,
      })
      return true
    } catch (error) {
      console.error('Temporal health check failed:', error)
      return false
    }
  }
}
