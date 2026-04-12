import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  searchOpen: boolean
  theme: 'light' | 'dark'

  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
  toggleSearch: () => void
  closeSearch: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  searchOpen: false,
  theme: 'light',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  closeSearch: () => set({ searchOpen: false }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
