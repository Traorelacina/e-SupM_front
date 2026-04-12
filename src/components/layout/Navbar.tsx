import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Search, User, Menu, X, ChevronDown,
  Heart, LogOut, Settings, Package, Star,
  Gamepad2, Gift, Sparkles, Store, Apple,
  Salad, Cookie, Wine, Fish, Cake,
  Crown, Baby, Sparkles as Beauty,
  HeartPulse, Shirt, PackageOpen,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useUIStore } from '@/stores/uiStore'
import { useSearchSuggestions } from '@/hooks/useProducts'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, getInitials, LOYALTY_LEVELS } from '@/lib/utils'

// Import du logo depuis le dossier public
const LOGO_URL = '/logo_esup.png'

// Catégories pour Nos Rayons
const RAYONS_CATEGORIES = [
  { href: '/rayons/produits-frais', label: 'Produits frais', icon: Apple },
  { href: '/rayons/epicerie-salee', label: 'Épicerie salée', icon: Salad },
  { href: '/rayons/epicerie-sucree', label: 'Épicerie sucrée', icon: Cookie },
  { href: '/rayons/espace-soif', label: 'Espace soif', icon: Wine },
  { href: '/rayons/boucherie-poissonnerie', label: 'Boucherie et poissonnerie', icon: Fish },
  { href: '/rayons/pain-patisserie', label: 'Pain et pâtisserie', icon: Cake },
  { href: '/rayons/premium', label: 'RAYON PREMIUM (Produit haut de gamme)', icon: Crown },
  { href: '/rayons/bebe-confort', label: 'Bébé et confort', icon: Baby },
  { href: '/rayons/hygiene-beaute', label: 'Hygiène et beauté', icon: Beauty },
  { href: '/rayons/dietetique-sante', label: 'Diététique et santé', icon: HeartPulse },
  { href: '/rayons/entretien-menage', label: 'Entretien et ménage', icon: Shirt },
  { href: '/rayons/non-alimentaire', label: 'e-sup\'m non alimentaire', icon: PackageOpen },
  { href: '/rayons/demi-gros-gros', label: '½ Gros et Gros', icon: Package },
]

const NAV_LINKS = [
  { href: '/rayons',      label: 'Nos Rayons',             hasDropdown: true, categories: RAYONS_CATEGORIES },
  { href: '/abonnement',  label: 'Abonnement Alimentaire', hasDropdown: true },
  { href: '/promos',      label: 'Promo / Solde',          hasDropdown: true },
  { href: '/charity',     label: 'Charity Panier',         hasDropdown: true },
  { href: '/nouveautes',  label: 'Nos Nouveautés',         hasDropdown: true },
  { href: '/conseils',    label: 'Nos Conseils',           hasDropdown: true },
]

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const { summary, toggleCart } = useCartStore()
  const { closeSearch } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: suggestions } = useSearchSuggestions(searchQuery)

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setOpenDropdown(null)
    setSearchFocused(false)
    setSearchQuery('')
    closeSearch()
  }, [location.pathname, closeSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchQuery)}`)
      setSearchFocused(false)
      setSearchQuery('')
    }
  }

  const levelConfig = user ? LOYALTY_LEVELS[user.loyalty_level] : null

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

        {/* ── Barre principale : Logo + Navigation + Actions ── */}
        <div className="bg-green-700">
          <div className="container-app px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 min-h-16">
              
              {/* Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <img 
                  src={LOGO_URL}
                  alt="e-Sup'M Logo" 
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>

              {/* Navigation Links (Desktop) */}
              <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                {NAV_LINKS.map((link) => {
                  const isActive = location.pathname.startsWith(link.href)
                  const isOpen = openDropdown === link.href
                  
                  return (
                    <div key={link.href} className="relative">
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

                      {/* Dropdown menu pour Nos Rayons */}
                      <AnimatePresence>
                        {isOpen && link.categories && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            onMouseLeave={() => setOpenDropdown(null)}
                            className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
                          >
                            <div className="py-2 max-h-96 overflow-y-auto">
                              {link.categories.map((category) => {
                                const Icon = category.icon
                                return (
                                  <Link
                                    key={category.href}
                                    to={category.href}
                                    onClick={() => setOpenDropdown(null)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                      <Icon className="h-4 w-4 text-green-700" />
                                    </div>
                                    <span className="text-sm font-medium text-stone-700 group-hover:text-green-700">
                                      {category.label}
                                    </span>
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </nav>

              {/* Actions Droites */}
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

                {/* Séparateur */}
                <div className="hidden sm:block w-px h-8 bg-white/20 mx-1" />

                {/* Menu Utilisateur / Boutons Auth */}
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
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                                >
                                  <Icon className="h-4 w-4 text-green-600" />
                                  {label}
                                </Link>
                              ))}

                              {user.role === 'admin' && (
                                <Link
                                  to="/admin"
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

                {/* Menu Burger Mobile */}
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
                {/* Liens de navigation mobile avec sous-menu pour Nos Rayons */}
                {NAV_LINKS.map((link) => {
                  const [showSubmenu, setShowSubmenu] = useState(false)
                  
                  return (
                    <div key={link.href}>
                      {link.categories ? (
                        <>
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
                                {link.categories.map((category) => {
                                  const Icon = category.icon
                                  return (
                                    <Link
                                      key={category.href}
                                      to={category.href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-green-200 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                      <Icon className="h-4 w-4" />
                                      {category.label}
                                    </Link>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-green-100 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <span>{link.label}</span>
                          {link.hasDropdown && <ChevronDown className="h-5 w-5 opacity-50" />}
                        </Link>
                      )}
                    </div>
                  )
                })}

                {/* Boutons auth mobile */}
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