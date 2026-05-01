// hooks/useCart.ts - Version corrigée

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api'
import { toast } from 'react-hot-toast'

export interface CartItem {
  id: number
  cart_id: number
  product_id: number
  quantity: number
  price: number
  size?: string | null
  color?: string | null
  line_total?: number
  product?: {
    id: number
    name: string
    slug: string
    price: number
    stock?: number
    primaryImage?: {
      path: string
    }
    category?: {
      id: number
      name: string
      slug: string
      color?: string
    }
  }
}

export interface Cart {
  id: number
  user_id?: number | null
  session_id?: string | null
  coupon_code?: string | null
  coupon_discount: number
  items: CartItem[]
}

export interface CartSummary {
  items_count: number
  subtotal: number
  total: number
  delivery_fee: number
  coupon_code: string | null
  coupon_discount: number
}

interface CartApiResponse {
  cart: Cart
  summary: CartSummary
  message?: string
}

export function useCart() {
  const queryClient = useQueryClient()

  // Récupération du panier
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await cartApi.get()
      console.log('Cart loaded:', response) // Debug
      return response as CartApiResponse
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  })

  const cart = data?.cart ?? null
  const summary = data?.summary ?? null

  // Mutation pour ajouter un produit
  const addItemMutation = useMutation({
    mutationFn: async ({ productId, quantity, size, color }: {
      productId: number
      quantity: number
      size?: string | null
      color?: string | null
    }) => {
      const response = await cartApi.add(productId, quantity, size, color)
      console.log('Add response:', response) // Debug
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success(data.message || 'Produit ajouté au panier')
    },
    onError: (err: any) => {
      console.error('Add error:', err) // Debug
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de l\'ajout')
    },
  })

  // Mutation pour mettre à jour la quantité - CORRECTION IMPORTANTE
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      console.log('Updating item:', { id, quantity }) // Debug - vérifiez que l'id est correct
      const response = await cartApi.updateItem(id, quantity)
      console.log('Update response:', response) // Debug
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success(data.message || 'Quantité mise à jour')
    },
    onError: (err: any) => {
      console.error('Update error:', err) // Debug
      // Afficher l'erreur complète pour debug
      const errorMessage = err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      // Recharger pour resynchroniser
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  // Mutation pour supprimer un item
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Removing item:', id) // Debug
      const response = await cartApi.removeItem(id)
      console.log('Remove response:', response) // Debug
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success(data.message || 'Article retiré du panier')
    },
    onError: (err: any) => {
      console.error('Remove error:', err) // Debug
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la suppression')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  // Mutation pour appliquer un coupon
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await cartApi.applyCoupon(code)
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success(data.message || 'Code promo appliqué')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Code promo invalide')
    },
  })

  // Mutation pour retirer le coupon
  const removeCouponMutation = useMutation({
    mutationFn: async () => {
      const response = await cartApi.removeCoupon()
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success(data.message || 'Code promo retiré')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur')
    },
  })

  // Mutation pour vider le panier
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await cartApi.clear()
      return response as CartApiResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      toast.success('Panier vidé')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur')
    },
  })

  return {
    cart,
    summary,
    isLoading,
    error: error as Error | null,
    refetch,
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isClearing: clearCartMutation.isPending,
    isApplyingCoupon: applyCouponMutation.isPending,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    applyCoupon: applyCouponMutation.mutate,
    removeCoupon: removeCouponMutation.mutate,
  }
}

// Helper pour l'URL de l'image
export function getCartItemImageUrl(item: CartItem): string | null {
  const primaryImage = item.product?.primaryImage
  if (primaryImage?.path) {
    return `/storage/${primaryImage.path}`
  }
  const appendUrl = (item.product as any)?.append_primary_image_url
  if (appendUrl) return appendUrl
  return null
}