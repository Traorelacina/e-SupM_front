import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, BarChart3, LogOut, ChevronRight, Bell,
  AlertTriangle, RefreshCw, BookOpen, Trophy,
  ChevronDown, Target, Ticket, RotateCcw, HelpCircle, Swords, DollarSign,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'

// Éléments de navigation principaux
const MAIN_NAV = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/admin/orders',        icon: ShoppingBag,     label: 'Commandes' },
  { to: '/admin/products',      icon: Package,         label: 'Produits' },
  { to: '/admin/subscriptions', icon: RefreshCw,       label: 'Abonnements' },
  { to: '/admin/selections',    icon: Tag,             label: 'Sélections' },
  { to: '/admin/charity',       icon: AlertTriangle,   label: 'Solidarité' },
  { to: '/admin/conseils',      icon: BookOpen,        label: 'Nos Conseils' },
  { to: '/admin/users',         icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/stats',         icon: BarChart3,       label: 'Statistiques' },
]

// Sous-menus pour Jeux Concours
const GAMES_SUBMENU = [
  { to: '/admin/games',         icon: BarChart3,        label: 'Dashboard',        end: true },
  { to: '/admin/games/defis',   icon: Target,           label: 'Défis' },
  { to: '/admin/games/scratch', icon: Ticket,           label: 'Carte à gratter' },
  { to: '/admin/games/wheel',   icon: RotateCcw,        label: 'Roue e-Sup\'' },
  { to: '/admin/games/quiz',    icon: HelpCircle,       label: 'Quiz' },
  { to: '/admin/games/battle',  icon: Swords,           label: 'Battle' },
  { to: '/admin/games/justeprix',icon: DollarSign,      label: 'Juste Prix' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [gamesOpen, setGamesOpen] = useState(false)

  // Vérifier si un chemin du sous-menu est actif
  const isGamesActive = () => {
    return GAMES_SUBMENU.some(item => window.location.pathname === item.to)
  }

  const toggleGames = () => setGamesOpen(!gamesOpen)

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

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {MAIN_NAV.map(({ to, icon: Icon, label, end }) => (
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

          {/* Menu Jeux avec sous-menus */}
          <div>
            <button
              onClick={toggleGames}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isGamesActive()
                  ? 'bg-brand-orange/20 text-brand-orange'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 shrink-0" />
                <span>Jeux Concours</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${gamesOpen ? 'rotate-180' : ''}`} />
            </button>
            {gamesOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-stone-800 pl-3">
                {GAMES_SUBMENU.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-brand-orange/20 text-brand-orange'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User footer */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="cursor-pointer hover:text-brand-orange" onClick={() => navigate('/')}>
              e-Sup'M
            </span>
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

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}