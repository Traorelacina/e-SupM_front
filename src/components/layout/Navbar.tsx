import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, User, Menu, X, ChevronDown,
  Gift, Star, Gamepad2, Package, LogOut, Settings,
  Leaf, Lightbulb, ChefHat, BookOpen, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { categoryApi } from '@/api'
import type { Category } from '@/api'
import { getInitials, LOYALTY_LEVELS, cn } from '@/lib/utils'


const LOGO_URL = '/logo_esup.png'

// ── Types ─────────────────────────────────────────────────────────────

interface NavLink {
  href: string
  label: string
  hasDropdown?: boolean
  isDynamic?: boolean
  isConseils?: boolean
}

// ── Config navigation ─────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { href: '/rayons',        label: 'Nos Rayons',             hasDropdown: true, isDynamic: true  },
  { href: '/subscriptions', label: 'Abonnement Alimentaire' },
  { href: '/promos',        label: 'Promo / Solde' },
  { href: '/charity',       label: 'Charity Panier' },
  { href: '/nouveautes',    label: 'Nos Nouveautés' },
  { href: '/conseils',      label: 'Nos Conseils',           hasDropdown: true, isConseils: true },
]

const CONSEILS_ITEMS = [
  {
    href: '/conseils?category=nutrition',
    label: 'Nutrition',
    desc: 'Alimentation équilibrée & santé',
    icon: Leaf,
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/conseils?category=astuce',
    label: 'Astuce',
    desc: 'Trucs pratiques du quotidien',
    icon: Lightbulb,
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/conseils?category=recette',
    label: 'Recette',
    desc: 'Recettes faciles & savoureuses',
    icon: ChefHat,
    iconBg: 'bg-orange-50 text-orange-600',
  },
]

// ── Dropdown animation variants ───────────────────────────────────────

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97 },
}

const mobileSubVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
}

// ── MobileNavItem ─────────────────────────────────────────────────────

function MobileNavItem({
  link,
  rayons,
  onClose,
  openKey,
  toggleOpen,
}: {
  link: NavLink
  rayons: Category[]
  onClose: () => void
  openKey: string | null
  toggleOpen: (key: string) => void
}) {
  const isOpen = openKey === link.href

  if (link.isDynamic) {
    return (
      <div>
        <button
          onClick={() => toggleOpen(link.href)}
          className={cn(
            'flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-colors',
            isOpen ? 'bg-white/15 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white',
          )}
        >
          <span>{link.label}</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 opacity-60 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              variants={mobileSubVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pl-4 pr-2 py-1.5 space-y-0.5">
                {rayons.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-green-300/70">Chargement…</p>
                ) : (
                  rayons.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/rayons/${cat.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-200 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#86efac' }}
                      />
                      {cat.name}
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

  if (link.isConseils) {
    return (
      <div>
        <button
          onClick={() => toggleOpen(link.href)}
          className={cn(
            'flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-colors',
            isOpen ? 'bg-white/15 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white',
          )}
        >
          <span>{link.label}</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 opacity-60 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              variants={mobileSubVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pl-4 pr-2 py-1.5 space-y-0.5">
                <Link
                  to="/conseils"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-green-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <BookOpen className="w-4 h-4 opacity-70" />
                  Tous les conseils
                </Link>

                {CONSEILS_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-200 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', item.iconBg)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-green-300/60">{item.desc}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Link
      to={link.href}
      onClick={onClose}
      className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-semibold text-green-100 hover:bg-white/10 hover:text-white transition-colors"
    >
      <span>{link.label}</span>
    </Link>
  )
}

// ── DesktopNavItem ────────────────────────────────────────────────────

function DesktopNavItem({
  link,
  rayons,
  isOpen,
  onOpen,
  onClose,
}: {
  link: NavLink
  rayons: Category[]
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const location = useLocation()
  const isActive =
    location.pathname === link.href ||
    location.pathname.startsWith(link.href + '/')

  if (!link.hasDropdown) {
    return (
      <Link
        to={link.href}
        className={cn(
          'px-3 xl:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap',
          isActive
            ? 'bg-white/20 text-white'
            : 'text-green-100 hover:text-white hover:bg-white/10',
        )}
      >
        {link.label}
      </Link>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={cn(
          'flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap',
          isActive || isOpen
            ? 'bg-white/20 text-white'
            : 'text-green-100 hover:text-white hover:bg-white/10',
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{link.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-60 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute top-full pt-2 z-50',
              link.isConseils ? 'left-1/2 -translate-x-1/2' : 'left-0',
            )}
          >
            <div className="bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-stone-100 overflow-hidden">

              {/* ── Dropdown Rayons ── */}
              {link.isDynamic && (
                <div className="py-1.5 w-72 max-h-[420px] overflow-y-auto">
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                      Nos Rayons
                    </p>
                  </div>

                  {rayons.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-stone-400 text-center">
                      Chargement…
                    </p>
                  ) : (
                    rayons.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/rayons/${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50/60 transition-colors group"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-transparent group-hover:ring-green-200 transition-all"
                          style={{ backgroundColor: cat.color || '#16a34a' }}
                        />
                        <span className="text-sm font-medium text-stone-700 group-hover:text-green-700 transition-colors">
                          {cat.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-stone-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))
                  )}

                  <div className="border-t border-stone-100 px-4 py-2.5">
                    <Link
                      to="/rayons"
                      onClick={onClose}
                      className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
                    >
                      Voir tous les rayons
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Dropdown Conseils ── */}
              {link.isConseils && (
                <div className="w-80">
                  <div className="px-5 py-3.5 border-b border-stone-100 bg-gradient-to-r from-green-50/80 to-emerald-50/80">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                      Nos Conseils
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Nutrition, astuces & recettes
                    </p>
                  </div>

                  <div className="py-1.5">
                    {CONSEILS_ITEMS.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3.5 px-5 py-3 hover:bg-stone-50/80 transition-colors group"
                        >
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                              item.iconBg,
                            )}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-stone-800 group-hover:text-green-700 transition-colors">
                              {item.label}
                            </div>
                            <div className="text-xs text-stone-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  <div className="border-t border-stone-100 px-5 py-3">
                    <Link
                      to="/conseils"
                      onClick={onClose}
                      className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Voir tous les conseils
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────

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
  const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)
  const [rayons, setRayons] = useState<Category[]>([])
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load categories
  useEffect(() => {
    categoryApi
      .list()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any)?.data ?? []
        setRayons(list.filter((c: Category) => c.is_active))
      })
      .catch(() => {})
  }, [])

  // Close on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setOpenDropdown(null)
    setMobileOpenKey(null)
    closeSearch()
  }, [location.pathname, closeSearch])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const toggleMobileSubmenu = useCallback((key: string) => {
    setMobileOpenKey((prev) => (prev === key ? null : key))
  }, [])

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  const levelConfig = user ? LOYALTY_LEVELS[user.loyalty_level] : null

  return (
    <>
      {/* ── Announcement bar ── */}
      <div className="bg-red-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-semibold tracking-wide">
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span>Livraison gratuite dès 50 000 FCFA</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline">+225 07 00 00 00 00</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="underline cursor-pointer hover:no-underline">
            Koumassi, Abidjan
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40">
        <div className="bg-green-700 shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 min-h-16">

              {/* Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <img
                  src={LOGO_URL}
                  alt="e-Sup'M Logo"
                  className="h-9 sm:h-11 w-auto object-contain"
                />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
                {NAV_LINKS.map((link) => (
                  <DesktopNavItem
                    key={link.href}
                    link={link}
                    rayons={rayons}
                    isOpen={openDropdown === link.href}
                    onOpen={() => setOpenDropdown(link.href)}
                    onClose={() => setOpenDropdown(null)}
                  />
                ))}
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-xl hover:bg-white/10 text-green-100 hover:text-white transition-all"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-5.5 w-5.5" />
                  {(summary?.items_count ?? 0) > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-white text-green-700 text-[11px] font-black rounded-full flex items-center justify-center shadow-sm"
                    >
                      {summary!.items_count > 9 ? '9+' : summary!.items_count}
                    </motion.span>
                  )}
                </button>

                <div className="hidden sm:block w-px h-7 bg-white/20 mx-0.5" />

                {/* User menu */}
                {isAuthenticated && user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-700 font-black text-sm shadow-sm shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-green-200 transition-transform hidden sm:block',
                          userMenuOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: 0.13 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-stone-100 overflow-hidden z-50"
                        >
                          {/* User header */}
                          <div className="px-4 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-stone-100">
                            <div className="font-bold text-stone-900 text-sm">
                              {user.name}
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5">
                              {user.email}
                            </div>
                            {levelConfig && (
                              <div
                                className={cn(
                                  'inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold',
                                  levelConfig.bg,
                                  levelConfig.color,
                                )}
                              >
                                {levelConfig.icon} {levelConfig.label} ·{' '}
                                {user.loyalty_points.toLocaleString('fr-CI')} pts
                              </div>
                            )}
                          </div>

                          <div className="py-1.5">
                            {[
                              { href: '/profile', icon: User, label: 'Mon profil' },
                              { href: '/orders', icon: Package, label: 'Mes commandes' },
                              { href: '/loyalty', icon: Star, label: 'Mes points fidélité' },
                              { href: '/subscriptions', icon: Gift, label: 'Mes abonnements' },
                              { href: '/games', icon: Gamepad2, label: 'Jeux & gains' },
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
                                onClick={() => {
                                  setUserMenuOpen(false)
                                  logout()
                                }}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                              >
                                <LogOut className="h-4 w-4" />
                                Se déconnecter
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="p-2 rounded-xl hover:bg-white/10 text-green-100 hover:text-white transition-all"
                    aria-label="Se connecter"
                  >
                    <User className="h-5.5 w-5.5" />
                  </button>
                )}

                {/* Burger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-green-100 transition-all"
                  aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 top-0 bg-black/40 z-40 lg:hidden"
                onClick={closeMobileMenu}
              />

              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-green-800 z-50 lg:hidden flex flex-col shadow-2xl"
              >
                {/* Mobile header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <span className="text-white font-bold text-lg">Menu</span>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-green-200 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile nav links */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                  {NAV_LINKS.map((link) => (
                    <MobileNavItem
                      key={link.href}
                      link={link}
                      rayons={rayons}
                      onClose={closeMobileMenu}
                      openKey={mobileOpenKey}
                      toggleOpen={toggleMobileSubmenu}
                    />
                  ))}

                  {/* Auth buttons for unauthenticated */}
                  {!isAuthenticated && (
                    <div className="pt-4 mt-3 border-t border-white/10 flex flex-col gap-2.5">
                      <button
                        onClick={() => {
                          closeMobileMenu()
                          navigate('/login')
                        }}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-all"
                      >
                        Se connecter
                      </button>
                      <button
                        onClick={() => {
                          closeMobileMenu()
                          navigate('/register')
                        }}
                        className="w-full py-3 rounded-xl text-sm font-black bg-white text-green-700 hover:bg-green-50 transition-all"
                      >
                        Créer un compte
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile footer */}
                {isAuthenticated && user && (
                  <div className="px-5 py-4 border-t border-white/10 bg-green-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-green-700 font-black text-sm shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-green-300 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
