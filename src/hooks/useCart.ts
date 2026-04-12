import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { cartApi } from '@/api'
import { useCartStore } from '@/stores/cartStore'

export const CART_KEY = ['cart']

export function useCart() {
  const queryClient = useQueryClient()
  const { setCart, openCart } = useCartStore()

  const { data, isLoading } = useQuery({
    queryKey: CART_KEY,
    queryFn: async () => {
      const { data } = await cartApi.get()
      setCart(data.cart, data.summary)
      return data
    },
    staleTime: 1000 * 30,
  })

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: CART_KEY })

  const addItemMutation = useMutation({
    mutationFn: ({ productId, quantity, size, color }: { productId: number; quantity: number; size?: string; color?: string }) =>
      cartApi.add(productId, quantity, size, color),
    onSuccess: () => {
      invalidateCart()
      openCart()
      toast.success('Produit ajouté au panier 🛒')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Erreur lors de l\'ajout')
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      cartApi.updateItem(id, quantity),
    onSuccess: invalidateCart,
  })

  const removeItemMutation = useMutation({
    mutationFn: (id: number) => cartApi.removeItem(id),
    onSuccess: () => { invalidateCart(); toast.success('Produit retiré') },
  })

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: invalidateCart,
  })

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(code),
    onSuccess: ({ data }) => {
      invalidateCart()
      toast.success(`Code promo appliqué ! -${data.discount} FCFA 🎉`)
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Code promo invalide')
    },
  })

  const removeCouponMutation = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: () => { invalidateCart(); toast.success('Code promo retiré') },
  })

  return {
    cart: data?.cart,
    summary: data?.summary,
    isLoading,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearMutation.mutate,
    applyCoupon: applyCouponMutation.mutate,
    removeCoupon: removeCouponMutation.mutate,
    isAdding: addItemMutation.isPending,
  }
}
