import { useState, useEffect, useCallback, useRef } from 'react'

export interface Notification {
  id: string
  applicationId: string
  type: 'DeadlineReminder' | 'InterviewReminder' | 'CoverLetterGenerated' | 'StatusUpdate'
  title: string
  message: string
  status: 'Pending' | 'Completed' | 'Failed'
  timestamp: string
  read: boolean
  application?: {
    id: string
    company: string
    role: string
  }
}

interface UseNotificationStreamOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface UseNotificationStreamReturn {
  notifications: Notification[]
  isConnected: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  markAsRead: (notificationId: string) => Promise<void>
  dismissNotification: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
}

export function useNotificationStream(
  options: UseNotificationStreamOptions = {}
): UseNotificationStreamReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return // Already connected
    }

    try {
      setError(null)
      
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'notification') {
            setNotifications(prev => {
              // Check if notification already exists (avoid duplicates)
              const exists = prev.some(n => n.id === data.notification.id)
              if (exists) {
                return prev.map(n => 
                  n.id === data.notification.id ? data.notification : n
                )
              }
              // Add new notification at the beginning
              return [data.notification, ...prev]
            })
          } else if (data.type === 'heartbeat') {
            // Heartbeat received, connection is alive
          }
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event)
        setIsConnected(false)
        
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection closed, attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, reconnectInterval)
          } else {
            setError('Failed to reconnect to notification stream')
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to notification stream')
      setIsConnected(false)
    }
  }, [reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }, [])

  const dismissNotification = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId)
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [])

  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?deleteAll=true', {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete all notifications')
      }

      // Clear local state
      setNotifications([])
    } catch (err) {
      console.error('Error deleting all notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete all notifications')
    }
  }, [])

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setNotifications(data.data)
          }
        }
      } catch (err) {
        console.error('Error loading initial notifications:', err)
      }
    }

    loadInitialNotifications()
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    notifications,
    isConnected,
    error,
    connect,
    disconnect,
    markAsRead,
    dismissNotification,
    deleteNotification,
    deleteAllNotifications,
  }
}
