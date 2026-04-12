import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
})

// ========================
// Request Interceptor
// ========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('esup_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ========================
// Response Interceptor
// ========================
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// Type personnalisé pour la requête avec _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message: string; errors?: Record<string, string[]> }>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    // 401 - Unauthorized: try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        }).catch(Promise.reject)
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post<{ token: string }>('/auth/refresh')
        const newToken = data.token
        localStorage.setItem('esup_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null)
        // Clear auth and redirect to login
        localStorage.removeItem('esup_token')
        localStorage.removeItem('esup_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 403 - Forbidden
    if (error.response?.status === 403) {
      toast.error(error.response.data?.message || 'Accès refusé')
    }

    // 422 - Validation errors (handled by forms)
    if (error.response?.status === 422) {
      // Don't toast here - forms handle their own errors
      return Promise.reject(error)
    }

    // 429 - Too many requests
    if (error.response?.status === 429) {
      toast.error('Trop de requêtes. Veuillez patienter.')
    }

    // 500 - Server error
    if (error.response?.status === 500) {
      toast.error('Erreur serveur. Veuillez réessayer.')
    }

    // Network error
    if (!error.response) {
      toast.error('Connexion impossible. Vérifiez votre réseau.')
    }

    return Promise.reject(error)
  }
)

export default api