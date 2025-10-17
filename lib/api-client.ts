
// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Base API client class
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data.code
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const qs = params
      ? Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&')
      : ''

    const path = qs ? `${endpoint}?${qs}` : endpoint

    return this.request<T>(path, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
    })
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// Type for API Application (with string dates and optional resumeUrl)
export interface ApiApplication {
  id: string
  company: string
  role: string
  jobDescription: string
  resumeUrl?: string
  coverLetterUrl?: string
  status: string
  deadline: string
  createdAt: string
  updatedAt: string
  notes?: string
  interviewDate?: string
  salary?: string
  location?: string
  jobType?: string
  timelineEvents?: unknown[]
  notifications?: unknown[]
}

// Pagination response type
export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination?: PaginationInfo
}

// Application API methods
export const applicationApi = {
  // Get all applications with pagination
  getApplications: (filters?: {
    status?: string
    search?: string
    includeArchived?: boolean
    page?: number
    limit?: number
  }) => apiClient.get<ApiApplication[]>('/api/applications', filters),

  // Get single application
  getApplication: (id: string) => apiClient.get<ApiApplication>(`/api/applications/${id}`),

  // Create application
  createApplication: (data: unknown) => apiClient.post<ApiApplication>('/api/applications', data),

  // Update application
  updateApplication: (id: string, data: unknown) => apiClient.put<ApiApplication>(`/api/applications/${id}`, data),

  // Update application status
  updateStatus: (id: string, data: { status: string; notes?: string; interviewDate?: string }) =>
    apiClient.post<ApiApplication>(`/api/applications/${id}/status`, data),

  // Delete application
  deleteApplication: (id: string) => apiClient.delete<void>(`/api/applications/${id}`),

  // Get application timeline
  getTimeline: (id: string) => apiClient.get<unknown[]>(`/api/applications/${id}/timeline`),

  // Generate cover letter
  generateCoverLetter: (id: string, data: unknown) =>
    apiClient.post<{ url: string }>(`/api/applications/${id}/cover-letter`, data),

  // Get cover letter
  getCoverLetter: (id: string) => apiClient.get<{ url: string }>(`/api/applications/${id}/cover-letter`),
}

// Notification API methods
export const notificationApi = {
  // Get notifications
  getNotifications: (applicationId?: string, unreadOnly?: boolean) =>
    apiClient.get('/api/notifications', { applicationId, unreadOnly }),

  // Mark notification as read
  markAsRead: (id: string) => apiClient.put(`/api/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: (applicationId?: string) =>
    apiClient.put('/api/notifications/read-all', { applicationId }),
}

// Upload API methods
export const uploadApi = {
  // Upload file
  uploadFile: (file: File, type: 'resume' | 'cover-letter' = 'resume') =>
    apiClient.upload('/api/upload', file, { type }),
}

// Utility functions
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError
}

// React hook for API calls with loading states
export const useApiCall = <T>() => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall()
      
      if (response.success) {
        setData(response.data || null)
      } else {
        setError(response.error || 'Request failed')
      }
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}

// Import useState for the hook
import { useState, useCallback } from 'react'
