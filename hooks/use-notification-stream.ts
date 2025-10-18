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
  pollingInterval?: number
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
    pollingInterval = 5000, // Poll every 5 seconds
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setNotifications(data.data)
          setIsConnected(true)
          setError(null)
        }
      } else {
        setIsConnected(false)
        setError('Failed to fetch notifications')
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    }
  }, [])

  const connect = useCallback(() => {
    if (isPollingRef.current) {
      return // Already polling
    }

    setError(null)
    isPollingRef.current = true
    
    // Fetch immediately
    fetchNotifications()
    
    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications()
    }, pollingInterval)
  }, [fetchNotifications, pollingInterval])

  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    
    isPollingRef.current = false
    setIsConnected(false)
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
