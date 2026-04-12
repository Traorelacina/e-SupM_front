import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Cart, CartSummary } from '@/types'

interface CartState {
  cart: Cart | null
  summary: CartSummary | null
  isOpen: boolean

  setCart: (cart: Cart, summary: CartSummary) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      summary: null,
      isOpen: false,

      setCart: (cart, summary) => set({ cart, summary }),
      clearCart: () => set({ cart: null, summary: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      getItemCount: () => get().summary?.items_count ?? 0,
    }),
    {
      name: 'esup_cart_ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ isOpen: state.isOpen }),
    }
  )
)
