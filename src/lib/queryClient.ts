import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min
      gcTime: 1000 * 60 * 30,           // 30 min cache
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status
          if (status === 401 || status === 403 || status === 404) return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
