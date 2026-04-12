import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials, RegisterData } from '@/types'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (data: LoginCredentials) => authApi.login(data),
    onSuccess: (response) => {
      // ✅ Correction: response contient directement { user, token }
      console.log('Login response:', response)
      
      if (response?.user && response?.token) {
        setAuth(response.user, response.token)
        queryClient.clear()
        toast.success(`Bienvenue, ${response.user.name} ! 🎉`)
        navigate(response.user.role === 'admin' ? '/admin' : '/')
      } else {
        toast.error('Erreur lors de la connexion')
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      const message = error?.response?.data?.message || error?.message || 'Email ou mot de passe incorrect'
      toast.error(message)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      console.log('Register response:', response)
      
      if (response?.user && response?.token) {
        setAuth(response.user, response.token)
        toast.success('Compte créé avec succès ! 100 points offerts 🎁')
        navigate('/')
      } else {
        toast.error('Erreur lors de l\'inscription')
      }
    },
    onError: (error: any) => {
      console.error('Register error:', error)
      const message = error?.response?.data?.message || error?.message || 'Erreur lors de l\'inscription'
      toast.error(message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
      toast.success('À bientôt !')
    },
    onError: () => {
      // Même en cas d'erreur, on déconnecte localement
      storeLogout()
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    token,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}

export function useCurrentUser() {
  const { isAuthenticated, updateUser } = useAuthStore()

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await authApi.me()
        updateUser(data)
        return data
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        throw error
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}