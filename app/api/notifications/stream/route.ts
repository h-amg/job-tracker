import { NextRequest } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'

// SSE endpoint for real-time notification streaming
export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const sendSSEMessage = (data: any, event?: string) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        if (event) {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\n`))
        }
        controller.enqueue(new TextEncoder().encode(message))
      }

      // Send connection established message
      sendSSEMessage({ 
        type: 'connected', 
        timestamp: new Date().toISOString() 
      }, 'connection')

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          sendSSEMessage({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString() 
          }, 'heartbeat')
        } catch (error) {
          // Connection closed, stop heartbeat
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Send heartbeat every 30 seconds

      // Store the controller for external access
      // In a real implementation, you'd store this in a Map or similar
      // and have notification creation events push to all active connections
      global.notificationStreams = global.notificationStreams || new Set()
      global.notificationStreams.add(controller)

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        if (global.notificationStreams) {
          global.notificationStreams.delete(controller)
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)
    },
    cancel() {
      // Cleanup when stream is cancelled
      if (global.notificationStreams) {
        global.notificationStreams.delete(this)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Helper function to broadcast notifications to all connected clients
export function broadcastNotification(notification: any) {
  if (global.notificationStreams) {
    const message = `data: ${JSON.stringify({
      type: 'notification',
      notification,
      timestamp: new Date().toISOString()
    })}\n\n`
    
    const encodedMessage = new TextEncoder().encode(message)
    
    // Send to all connected clients
    for (const controller of global.notificationStreams) {
      try {
        controller.enqueue(encodedMessage)
      } catch (error) {
        // Remove dead connections
        global.notificationStreams.delete(controller)
      }
    }
  }
}

// Extend global type for TypeScript
declare global {
  var notificationStreams: Set<ReadableStreamDefaultController<any>> | undefined
}
