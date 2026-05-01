// src/stores/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// cart et summary sont gérés par React Query dans useCart.ts
// Ce store ne gère QUE l'état UI du drawer (ouvert/fermé)

interface CartUIState {
  isOpen: boolean
  openCart:   () => void
  closeCart:  () => void
  toggleCart: () => void
}

export const useCartStore = create<CartUIState>()(
  persist(
    (set) => ({
      isOpen: false,
      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'esup_cart_ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ isOpen: state.isOpen }),
    }
  )
)