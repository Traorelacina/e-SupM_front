import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, User, Menu, X, ChevronDown,
  Gift, Star, Gamepad2, Package,
  LogOut, Settings,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { categoryApi } from '@/api'
import type { Category } from '@/api'
import { getInitials, LOYALTY_LEVELS } from '@/lib/utils'

const LOGO_URL = '/logo_esup.png'

const NAV_LINKS = [
  { href: '/rayons',      label: 'Nos Rayons',             hasDropdown: true, isDynamic: true },
  { href: '/subscriptions', label: 'Abonnement Alimentaire', hasDropdown: false }, // Changé de /abonnement à /subscriptions
  { href: '/promos',      label: 'Promo / Solde',          hasDropdown: true },
  { href: '/charity',     label: 'Charity Panier',         hasDropdown: true },
  { href: '/nouveautes',  label: 'Nos Nouveautés',         hasDropdown: true },
  { href: '/conseils',    label: 'Nos Conseils',           hasDropdown: true },
]

// Composant séparé pour les éléments du menu mobile avec sous-menu
function MobileNavItem({ link, rayons, onClose }: { 
  link: typeof NAV_LINKS[0], 
  rayons: Category[], 
  onClose: () => void 
}) {
  const [showSubmenu, setShowSubmenu] = useState(false)

  if (link.isDynamic) {
    return (
      <div>
        <button
          onClick={() => setShowSubmenu(!showSubmenu)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-base font-bold text-green-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>{link.label}</span>
          <ChevronDown className={`h-5 w-5 opacity-50 transition-transform duration-200 ${showSubmenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showSubmenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-4 space-y-1 overflow-hidden"
            >
              {rayons.length === 0 ? (
                <p className="px-4 py-2 text-sm text-green-300">Chargement…</p>
              ) : (
                rayons.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/rayons/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-green-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || '#86efac' }}
                    />
                    {cat.name}
                  </Link>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Pour les liens sans dropdown (comme Abonnement Alimentaire)
  return (
    <Link
      to={link.href}
      onClick={onClose}
      className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-green-100 hover:bg-white/10 hover:text-white transition-colors"
    >
      <span>{link.label}</span>
      {link.hasDropdown && <ChevronDown className="h-5 w-5 opacity-50" />}
    </Link>
  )
}

// Composant séparé pour les éléments du menu desktop avec dropdown
function DesktopNavItem({ 
  link, 
  rayons, 
  openDropdown, 
  setOpenDropdown 
}: { 
  link: typeof NAV_LINKS[0], 
  rayons: Category[], 
  openDropdown: string | null, 
  setOpenDropdown: (value: string | null) => void 
}) {
  const location = useLocation()
  const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/')
  const isOpen = openDropdown === link.href

  // Si le lien n'a pas de dropdown, on rend un simple Link
  if (!link.hasDropdown) {
    return (
      <Link
        to={link.href}
        className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-xl text-base font-bold transition-all duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-white/20 text-white'
            : 'text-green-100 hover:text-white hover:bg-white/10'
        }`}
      >
        <span>{link.label}</span>
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpenDropdown(isOpen ? null : link.href)}
        onMouseEnter={() => link.hasDropdown && setOpenDropdown(link.href)}
        className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-xl text-base font-bold transition-all duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-white/20 text-white'
            : 'text-green-100 hover:text-white hover:bg-white/10'
        }`}
      >
        <span>{link.label}</span>
        {link.hasDropdown && (
          <ChevronDown className={`h-4 w-4 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown dynamique — Nos Rayons */}
      <AnimatePresence>
        {isOpen && link.isDynamic && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onMouseLeave={() => setOpenDropdown(null)}
            className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2 max-h-96 overflow-y-auto">
              {rayons.length === 0 ? (
                <p className="px-4 py-3 text-sm text-stone-400 text-center">Chargement…</p>
              ) : (
                rayons.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/rayons/${cat.slug}`}
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || '#16a34a' }}
                    />
                    <span className="text-sm font-medium text-stone-700 group-hover:text-green-700 leading-snug">
                      {cat.name}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const { summary, toggleCart } = useCartStore()
  const { closeSearch } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // ── Chargement dynamique des rayons ──────────────────────────────
  const [rayons, setRayons] = useState<Category[]>([])

  useEffect(() => {
    categoryApi.list()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any)?.data ?? []
        setRayons(list.filter((c: Category) => c.is_active))
      })
      .catch(() => {/* silently ignore — navbar still works */})
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setOpenDropdown(null)
    closeSearch()
  }, [location.pathname, closeSearch])

  const levelConfig = user ? LOYALTY_LEVELS[user.loyalty_level] : null

  // Fermeture du menu mobile
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* ── Announcement bar ── */}
      <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide overflow-x-auto whitespace-nowrap">
        <span>Livraison gratuite dès 50 000 FCFA</span>
        <span className="mx-2">|</span>
        <span>+225 07 00 00 00 00</span>
        <span className="mx-2">|</span>
        <span className="underline cursor-pointer hover:no-underline">Koumassi, Abidjan</span>
      </div>

      <header className="sticky top-0 z-40 bg-green-700 shadow-[0_4px_24px_rgba(0,0,0,0.18)]">

        {/* ── Barre principale ── */}
        <div className="bg-green-700">
          <div className="container-app px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 min-h-16">

              {/* Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <img src={LOGO_URL} alt="e-Sup'M Logo" className="h-10 sm:h-12 w-auto object-contain" />
              </Link>

              {/* Navigation Desktop */}
              <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                {NAV_LINKS.map((link) => (
                  <DesktopNavItem
                    key={link.href}
                    link={link}
                    rayons={rayons}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                ))}
              </nav>

              {/* Actions droites */}
              <div className="flex items-center gap-2 sm:gap-3">

                {/* Panier */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-xl hover:bg-white/10 text-green-100 hover:text-white transition-all"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {(summary?.items_count ?? 0) > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white text-green-700 text-xs font-black rounded-full flex items-center justify-center shadow"
                    >
                      {summary!.items_count > 9 ? '9+' : summary!.items_count}
                    </motion.span>
                  )}
                </button>

                <div className="hidden sm:block w-px h-8 bg-white/20 mx-1" />

                {/* Menu utilisateur */}
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-green-700 font-black text-base shadow shrink-0">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          : getInitials(user.name)
                        }
                      </div>
                      <ChevronDown className={`h-5 w-5 text-green-200 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ duration: 0.13 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-stone-100 overflow-hidden z-20"
                          >
                            <div className="px-4 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-stone-100">
                              <div className="font-bold text-stone-900 text-sm">{user.name}</div>
                              <div className="text-xs text-stone-500 mt-0.5">{user.email}</div>
                              {levelConfig && (
                                <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${levelConfig.bg} ${levelConfig.color}`}>
                                  {levelConfig.icon} {levelConfig.label} · {user.loyalty_points.toLocaleString('fr-CI')} pts
                                </div>
                              )}
                            </div>

                            <div className="py-1.5">
                              {[
                                { href: '/profile',       icon: User,     label: 'Mon profil' },
                                { href: '/orders',        icon: Package,  label: 'Mes commandes' },
                                { href: '/loyalty',       icon: Star,     label: 'Mes points fidélité' },
                                { href: '/subscriptions', icon: Gift,     label: 'Mes abonnements' },
                                { href: '/games',         icon: Gamepad2, label: 'Jeux & gains' },
                              ].map(({ href, icon: Icon, label }) => (
                                <Link
                                  key={href}
                                  to={href}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                                >
                                  <Icon className="h-4 w-4 text-green-600" />
                                  {label}
                                </Link>
                              ))}

                              {user.role === 'admin' && (
                                <Link
                                  to="/admin"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors font-semibold"
                                >
                                  <Settings className="h-4 w-4" />
                                  Administration
                                </Link>
                              )}

                              <div className="border-t border-stone-100 mt-1.5 pt-1.5">
                                <button
                                  onClick={() => { setUserMenuOpen(false); logout() }}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Se déconnecter
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="p-2 rounded-xl hover:bg-white/10 text-green-100 hover:text-white transition-all"
                    aria-label="Se connecter"
                  >
                    <User className="h-6 w-6" />
                  </button>
                )}

                {/* Burger mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-green-100 transition-all"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Menu Mobile ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-green-800 border-t border-white/10 overflow-hidden"
            >
              <div className="container-app px-4 py-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <MobileNavItem
                    key={link.href}
                    link={link}
                    rayons={rayons}
                    onClose={closeMobileMenu}
                  />
                ))}

                {!isAuthenticated && (
                  <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 rounded-xl text-base font-bold text-white border border-white/30 hover:bg-white/10 transition-all"
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="w-full py-3 rounded-xl text-base font-black bg-white text-green-700 hover:bg-green-50 transition-all"
                    >
                      Créer un compte
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>
    </>
  )
}