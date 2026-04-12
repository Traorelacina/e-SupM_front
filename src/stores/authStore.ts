import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  updateUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        console.log('📝 AuthStore: Setting auth', { user, token })
        // Sauvegarder le token dans localStorage pour l'API
        localStorage.setItem('auth_token', token)
        set({ user, token, isAuthenticated: true })
      },
      updateUser: (user) => {
        console.log('📝 AuthStore: Updating user', user)
        set({ user })
      },
      logout: () => {
        console.log('📝 AuthStore: Logging out')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth-storage')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
)