import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, BarChart3, LogOut, ChevronRight, Bell,
  TrendingUp, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
  { to: '/admin/products', icon: Package, label: 'Produits' },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-stone-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-stone-800">
          <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center border border-brand-red shrink-0">
            <span className="text-brand-red font-black text-[9px]">e-SUP'M</span>
          </div>
          <div>
            <div className="text-white font-black text-sm font-display">e-Sup'M Admin</div>
            <div className="text-stone-500 text-[10px]">Back-office</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-orange text-stone-900'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-stone-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center text-stone-900 font-bold text-sm">
              {user ? getInitials(user.name) : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.name}</p>
              <p className="text-stone-500 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="flex items-center gap-2 text-stone-400 hover:text-red-400 text-xs font-semibold transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="cursor-pointer hover:text-brand-orange" onClick={() => navigate('/')}>e-Sup'M</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-stone-900 font-semibold">Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-500">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
