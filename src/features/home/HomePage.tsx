import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ShoppingCart, Star, ChevronRight, ChevronLeft,
  Megaphone, Leaf, Beef, Croissant, Wine, Baby, Sparkles,
  Waves, Heart, Package, Repeat, Tag, Truck, Trophy,
  UtensilsCrossed, FlaskConical, Apple, ShoppingBag,
  Gamepad2, Gift, Zap, RefreshCw, BookOpen, Users,
  Lightbulb, MessageSquare, Monitor,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoryApi, productApi, advertisementApi } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useNormalizedProducts } from '@/hooks/useNormalizedProducts'
import type { Product } from '@/types'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// ICÔNES PAR SLUG DE CATÉGORIE
// ─────────────────────────────────────────────────────────────
const RAYON_ICONS: Record<string, React.ReactNode> = {
  'produits-frais':           <Apple className="h-5 w-5 sm:h-6 sm:w-6" />,
  'epicerie-salee':           <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" />,
  'epicerie-sucree':          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
  'espace-soif':              <Wine className="h-5 w-5 sm:h-6 sm:w-6" />,
  'boucherie-poissonnerie':   <Beef className="h-5 w-5 sm:h-6 sm:w-6" />,
  'pain-patisserie':          <Croissant className="h-5 w-5 sm:h-6 sm:w-6" />,
  'rayon-premium':            <Star className="h-5 w-5 sm:h-6 sm:w-6" />,
  'bebe-confort':             <Baby className="h-5 w-5 sm:h-6 sm:w-6" />,
  'hygiene-beaute':           <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />,
  'dietetique-sante':         <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6" />,
  'entretien-menage':         <Waves className="h-5 w-5 sm:h-6 sm:w-6" />,
  'non-alimentaire':          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />,
  'demi-gros':                <Package className="h-5 w-5 sm:h-6 sm:w-6" />,
}

const RAYON_COLORS = [
  'bg-green-100 text-green-700 border-green-300',
  'bg-orange-100 text-orange-700 border-orange-300',
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-red-100 text-red-700 border-red-300',
  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-teal-100 text-teal-700 border-teal-300',
  'bg-amber-100 text-amber-700 border-amber-300',
  'bg-rose-100 text-rose-700 border-rose-300',
  'bg-cyan-100 text-cyan-700 border-cyan-300',
  'bg-indigo-100 text-indigo-700 border-indigo-300',
  'bg-lime-100 text-lime-700 border-lime-300',
]

// ─────────────────────────────────────────────────────────────
// AD SLOT
// ─────────────────────────────────────────────────────────────
interface AdSlotProps {
  ads?: { id: number; image_url: string; link?: string; title?: string }[]
  side: 'left' | 'right'
  minHeight?: number
}

function AdSlot({ ads, side, minHeight = 300 }: AdSlotProps) {
  const [current, setCurrent] = useState(0)
  const count = ads?.length ?? 0

  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setCurrent(c => (c + 1) % count), 4000)
    return () => clearInterval(t)
  }, [count])

  const placeholder = (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-stone-100 to-stone-200 rounded-xl border-2 border-dashed border-stone-300">
      <Megaphone className="h-7 w-7 text-stone-400" />
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center px-2">
        Espace Publicité
      </span>
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
      </div>
    </div>
  )

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl shadow-md" style={{ minHeight }}>
      {!ads || ads.length === 0 ? placeholder : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: side === 'left' ? 20 : -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: side === 'left' ? -20 : 20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {ads[current].link ? (
                <a href={ads[current].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <img src={ads[current].image_url} alt={ads[current].title ?? 'Publicité'} className="w-full h-full object-cover rounded-xl" />
                </a>
              ) : (
                <img src={ads[current].image_url} alt={ads[current].title ?? 'Publicité'} className="w-full h-full object-cover rounded-xl" />
              )}
            </motion.div>
          </AnimatePresence>
          {count > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {ads.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HERO SLIDER (composant partagé mobile + desktop)
// ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    tag: 'Ventes Flash',
    title: 'Faites vos courses en ligne',
    sub: 'Livraison à domicile en 24h à Abidjan. Plus de 5 000 produits disponibles.',
    cta: 'Découvrir le catalogue',
    href: '/catalogue',
    bg: 'from-amber-500 via-orange-500 to-red-500',
    icon: <ShoppingCart className="h-16 w-16 sm:h-20 sm:w-20 text-white/30" />,
  },
  {
    tag: 'Jeux & Gains',
    title: 'Gagnez des lots chaque semaine',
    sub: 'Quiz, Roue, Carte à gratter — des surprises à chaque achat !',
    cta: 'Jouer maintenant',
    href: '/games',
    bg: 'from-purple-600 via-fuchsia-500 to-pink-500',
    icon: <Gamepad2 className="h-16 w-16 sm:h-20 sm:w-20 text-white/30" />,
  },
  {
    tag: 'Charity Panier',
    title: 'Faites le bien en faisant vos courses',
    sub: 'Offrez des bons alimentaires et gagnez des points fidélité.',
    cta: 'Faire un don',
    href: '/charity',
    bg: 'from-green-600 via-emerald-500 to-teal-400',
    icon: <Heart className="h-16 w-16 sm:h-20 sm:w-20 text-white/30" />,
  },
]

function HeroSlider() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[current]

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg min-h-[200px] sm:min-h-[340px] h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -top-10 -right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block">{slide.icon}</div>
          <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-8 py-6 sm:py-10 max-w-lg">
            <motion.span
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full w-fit mb-2 sm:mb-4"
            >
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{slide.tag}
            </motion.span>
            <motion.h1
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight"
            >
              {slide.title}
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-2 sm:mt-3 text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none"
            >
              {slide.sub}
            </motion.p>
            <motion.div
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-3 sm:mt-6 flex gap-2 sm:gap-3 flex-wrap"
            >
              <button
                onClick={() => navigate(slide.href)}
                className="flex items-center gap-1.5 bg-white text-stone-900 font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg hover:bg-stone-100 transition-colors"
              >
                {slide.cta} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-1.5 bg-white/20 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-white/30 transition-colors"
              >
                Créer un compte
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => setCurrent(c => (c + 1) % SLIDES.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HERO BANNER — mobile: slider seul + pubs dessous / desktop: 3 colonnes
// ─────────────────────────────────────────────────────────────
function HeroBanner() {
  const { data: leftAds } = useQuery({
    queryKey: ['ads', 'hero-left'],
    queryFn: () => advertisementApi?.list?.({ position: 'hero_left' }).then((r: any) => r.data).catch(() => null),
    staleTime: 1000 * 60 * 10,
  })
  const { data: rightAds } = useQuery({
    queryKey: ['ads', 'hero-right'],
    queryFn: () => advertisementApi?.list?.({ position: 'hero_right' }).then((r: any) => r.data).catch(() => null),
    staleTime: 1000 * 60 * 10,
  })

  return (
    <section className="bg-stone-50 py-3 sm:py-4">
      <div className="container-app">
        {/* MOBILE : slider plein + 2 pubs horizontales sous */}
        <div className="block sm:hidden space-y-3">
          <HeroSlider />
          <div className="grid grid-cols-2 gap-3">
            <AdSlot ads={leftAds} side="left" minHeight={80} />
            <AdSlot ads={rightAds} side="right" minHeight={80} />
          </div>
        </div>
        {/* DESKTOP : 3 colonnes */}
        <div className="hidden sm:grid sm:grid-cols-[140px_1fr_140px] lg:grid-cols-[180px_1fr_180px] xl:grid-cols-[200px_1fr_200px] gap-4 items-stretch">
          <AdSlot ads={leftAds} side="left" />
          <HeroSlider />
          <AdSlot ads={rightAds} side="right" />
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// BARRE DE RECHERCHE
// ─────────────────────────────────────────────────────────────
function SearchBar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/catalogue?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="bg-white border-b border-stone-200 py-2.5 sm:py-3 sticky top-0 z-30 shadow-sm">
      <div className="container-app">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-stone-200 focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 transition-all">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un produit, une marque…"
            className="flex-1 bg-transparent text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none min-w-0"
          />
          <button type="submit" className="flex items-center gap-1 sm:gap-1.5 bg-brand-orange text-stone-900 font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-brand-orange-dark transition-colors shrink-0">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RAYONS — scroll horizontal sur mobile, grille sur desktop
// ─────────────────────────────────────────────────────────────
function RayonsSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then(r => r.data),
    staleTime: 1000 * 60 * 30,
  })

  const filtered = categories?.filter(c => c.show_in_menu).slice(0, 13) ?? []

  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl font-black text-stone-900 uppercase tracking-tight">e-Sup'M Rayons</h2>
          <Link to="/rayons" className="flex items-center gap-1 text-brand-orange font-semibold text-xs sm:text-sm hover:underline shrink-0">
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile : scroll horizontal */}
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {isLoading
            ? Array(8).fill(0).map((_, i) => <div key={i} className="w-[62px] h-[62px] rounded-xl bg-stone-100 animate-pulse shrink-0" />)
            : filtered.map((cat, i) => (
                <Link key={cat.id} to={`/rayons/${cat.slug}`}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 w-[62px] h-[62px] shrink-0 snap-start text-center active:scale-95 transition-all ${RAYON_COLORS[i % RAYON_COLORS.length]}`}
                >
                  {RAYON_ICONS[cat.slug] ?? <ShoppingBag className="h-5 w-5" />}
                  <span className="text-[8px] font-bold leading-tight line-clamp-2">{cat.name}</span>
                </Link>
              ))
          }
          <Link to="/rayons"
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 border-dashed border-stone-300 w-[62px] h-[62px] shrink-0 snap-start hover:border-brand-orange transition-all">
            <ChevronRight className="h-4 w-4 text-stone-400" />
            <span className="text-[8px] font-bold text-stone-400 text-center">Voir tout</span>
          </Link>
        </div>

        {/* Desktop : grille */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {isLoading
            ? Array(13).fill(0).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-stone-100 animate-pulse" />)
            : filtered.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.06 }}>
                  <Link to={`/rayons/${cat.slug}`}
                    className={`flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl border-2 aspect-square transition-all cursor-pointer ${RAYON_COLORS[i % RAYON_COLORS.length]}`}>
                    {RAYON_ICONS[cat.slug] ?? <ShoppingBag className="h-6 w-6" />}
                    <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                </motion.div>
              ))
          }
          <Link to="/rayons"
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-stone-300 aspect-square hover:border-brand-orange hover:bg-amber-50 transition-all">
            <ChevronRight className="h-5 w-5 text-stone-400" />
            <span className="text-[10px] font-bold text-stone-400 text-center">Voir tout</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { addItem, isAdding } = useCart()
  const navigate = useNavigate()

  const labelConfig: Record<string, { text: string; color: string }> = {
    stock_limite:  { text: 'Stock limité', color: 'bg-orange-500' },
    promo:         { text: product.admin_label_discount ? `-${product.admin_label_discount}%` : 'Promo', color: 'bg-red-600' },
    stock_epuise:  { text: 'Épuisé', color: 'bg-stone-500' },
    offre_limitee: { text: 'Offre limitée', color: 'bg-purple-600' },
    vote_rayon:    { text: 'Vote rayon', color: 'bg-blue-600' },
  }

  const label = product.admin_label !== 'none' ? labelConfig[product.admin_label] : null

  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}
      className="overflow-hidden group bg-white rounded-xl sm:rounded-2xl border border-stone-100 shadow-sm">
      <div onClick={() => navigate(`/produit/${product.slug}`)}
        className="relative aspect-[4/3] bg-stone-50 overflow-hidden cursor-pointer">
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-stone-300" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {label && <span className={`${label.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>{label.text}</span>}
          {product.is_new && !label && <span className="bg-amber-500 text-stone-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Nouveau</span>}
          {product.is_bio && <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Leaf className="h-2 w-2" />Bio</span>}
          {product.is_local && <span className="bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Local CI</span>}
        </div>
        {product.discount_percentage && (
          <div className="absolute top-1.5 right-1.5 w-8 h-8 sm:w-9 sm:h-9 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black">
            -{product.discount_percentage}%
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-stone-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Épuisé</span>
          </div>
        )}
      </div>
      <div className="p-2.5 sm:p-4">
        <p className="text-[9px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider mb-0.5 truncate">
          {product.category?.name ?? product.brand}
        </p>
        <h3 onClick={() => navigate(`/produit/${product.slug}`)}
          className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-2 leading-snug cursor-pointer hover:text-brand-orange transition-colors">
          {product.name}
        </h3>
        {product.reviews_count > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-2.5 w-2.5 text-brand-orange fill-brand-orange" />
            <span className="text-[10px] font-semibold text-stone-700">{product.average_rating.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div>
            <p className="text-sm sm:text-base font-black text-stone-900">{formatCurrency(product.price)}</p>
            {product.compare_price && (
              <p className="text-[10px] text-stone-400 line-through">{formatCurrency(product.compare_price)}</p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => product.in_stock && addItem({ productId: product.id, quantity: 1 })}
            disabled={!product.in_stock || isAdding}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${
              product.in_stock ? 'bg-brand-orange hover:bg-brand-orange-dark shadow-md text-stone-900' : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}>
            <ShoppingCart className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUITS VEDETTES - CORRIGÉ AVEC LE HOOK
// ─────────────────────────────────────────────────────────────
function FeaturedSection() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.featured().then(r => r.data),
  })

  const products = useNormalizedProducts(response)

  if (isLoading) {
    return (
      <section className="py-6 sm:py-10 bg-stone-50">
        <div className="container-app">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange fill-brand-orange" />
              Produits Vedettes
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="py-6 sm:py-10 bg-stone-50">
      <div className="container-app">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange fill-brand-orange" />
            Produits Vedettes
          </h2>
          <Link to="/catalogue?sort=sales_count" className="flex items-center gap-1 text-brand-orange font-semibold text-xs sm:text-sm hover:underline shrink-0">
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {products.slice(0, 4).map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// GOOD BOX — CARTONS 3D ANIMÉS
// ─────────────────────────────────────────────────────────────
interface CartonItem {
  icon: React.ReactNode
  label: string
  sub?: string
  href: string
  accentColor: string
}

const GOOD_BOX_ITEMS: CartonItem[] = [
  { icon: <Tag className="h-4 w-4 sm:h-5 sm:w-5" />,            label: 'Promo',             href: '/catalogue?filter=promo',    accentColor: '#ef4444' },
  { icon: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,            label: 'Solde',             href: '/catalogue?filter=solde',    accentColor: '#f97316' },
  { icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,        label: 'Déstockage',        sub: 'consommer avant…',            href: '/catalogue?filter=destockage', accentColor: '#eab308' },
  { icon: <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5"/>, label: 'Panier menu',       href: '/good-box/menu',             accentColor: '#22c55e' },
  { icon: <Heart className="h-4 w-4 sm:h-5 sm:w-5" />,          label: 'Panier charity',    sub: 'dons alimentaires',           href: '/charity',                   accentColor: '#10b981' },
  { icon: <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />,         label: 'Abonnement',        sub: 'panier essentiel',            href: '/subscriptions',             accentColor: '#3b82f6' },
  { icon: <Gift className="h-4 w-4 sm:h-5 sm:w-5" />,           label: 'Panier évent',      sub: 'anniv, naissance…',           href: '/good-box/event',            accentColor: '#a855f7' },
  { icon: <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />,       label: 'Nouveautés',        sub: 'découverte…',                 href: '/catalogue?sort=created_at', accentColor: '#ec4899' },
  { icon: <Truck className="h-4 w-4 sm:h-5 sm:w-5" />,          label: 'Déléguer',          sub: 'listez, on s\'exécute',       href: '/good-box/delegation',       accentColor: '#14b8a6' },
]

const CARTON_STYLES = `
@keyframes gbPopIn {
  0%   { opacity:0; transform:scale(0.55) translateY(20px); }
  70%  { transform:scale(1.08) translateY(-5px); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
.gb-carton { animation:gbPopIn 0.45s both; perspective:500px; }
.gb-carton:nth-child(1){animation-delay:.05s}
.gb-carton:nth-child(2){animation-delay:.10s}
.gb-carton:nth-child(3){animation-delay:.15s}
.gb-carton:nth-child(4){animation-delay:.20s}
.gb-carton:nth-child(5){animation-delay:.25s}
.gb-carton:nth-child(6){animation-delay:.30s}
.gb-carton:nth-child(7){animation-delay:.35s}
.gb-carton:nth-child(8){animation-delay:.40s}
.gb-carton:nth-child(9){animation-delay:.45s}
.gb-carton-inner{transition:transform 0.35s cubic-bezier(.34,1.56,.64,1);transform-style:preserve-3d;position:relative;width:100%;height:100%;}
.gb-carton:hover .gb-carton-inner{transform:rotateX(-9deg) rotateY(7deg) scale(1.07);}
.gb-wood{background:repeating-linear-gradient(175deg,rgba(255,255,255,0.05) 0px,rgba(255,255,255,0.05) 2px,transparent 2px,transparent 8px),linear-gradient(170deg,#b5783a 0%,#8b5a2b 35%,#c49a51 60%,#7a4a1e 100%);border:2px solid rgba(255,255,255,0.28);}
.gb-carton:hover .gb-wood{background:repeating-linear-gradient(175deg,rgba(255,255,255,0.08) 0px,rgba(255,255,255,0.08) 2px,transparent 2px,transparent 8px),linear-gradient(170deg,#d08b48 0%,#a0682e 35%,#e0b560 60%,#8f5a28 100%);}
.gb-tip{display:none;}
.gb-carton:hover .gb-tip{display:block;}
@media(max-width:640px){
  .gb-carton:hover .gb-carton-inner{transform:none;}
  .gb-carton:active .gb-carton-inner{transform:scale(0.93);}
  .gb-tip{display:none!important;}
}
`

function Carton({ item }: { item: CartonItem }) {
  const navigate = useNavigate()
  const flapH = 'clamp(20px,3.5vw,28px)'
  return (
    <div className="gb-carton relative cursor-pointer" style={{ height: 'clamp(75px,14vw,110px)' }} onClick={() => navigate(item.href)}>
      <div className="gb-carton-inner">
        <div style={{ position:'absolute', top:-6, left:5, width:'calc(100% - 5px)', height:8, background:'linear-gradient(180deg,#e8c06a,#c49a40)', borderRadius:'4px 4px 0 0', transform:'skewX(-2deg)', zIndex:-1 }} />
        <div style={{ position:'absolute', top:5, right:-6, width:8, height:'calc(100% - 5px)', background:'linear-gradient(90deg,#5a3010,#3a1e08)', borderRadius:'0 4px 4px 0', transform:'skewY(-2deg)', zIndex:-1 }} />
        <div className="gb-wood absolute inset-0 rounded-lg overflow-hidden">
          <div style={{ position:'absolute', top:0, left:0, right:0, height:flapH, background:'linear-gradient(180deg,#d4a04a,#b5783a)', borderBottom:'1.5px solid rgba(0,0,0,0.2)', borderRadius:'6px 6px 0 0' }} />
          <div style={{ position:'absolute', top:flapH, left:0, right:0, height:2, background:'rgba(0,0,0,0.12)' }} />
          <div style={{ position:'absolute', top:flapH, left:0, bottom:0, width:4, background:item.accentColor, borderRadius:'0 0 0 4px' }} />
          <div style={{ position:'absolute', top:flapH, left:4, right:0, bottom:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3px 5px', gap:2 }}>
            <span style={{ color:'rgba(255,255,255,0.92)', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>{item.icon}</span>
            <span style={{ fontSize:'clamp(8px,1.8vw,11px)', fontWeight:700, color:'#fff', textAlign:'center', lineHeight:1.2, textShadow:'0 1px 3px rgba(0,0,0,0.6)' }}>{item.label}</span>
            {item.sub && <span style={{ fontSize:'clamp(7px,1.2vw,9px)', fontWeight:600, color:'rgba(255,255,255,0.72)', textAlign:'center', lineHeight:1.2 }}>{item.sub}</span>}
          </div>
        </div>
      </div>
      <div className="gb-tip absolute bottom-[108%] left-1/2 -translate-x-1/2 bg-[#1e1b4b] text-[#fbbf24] text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap z-10 pointer-events-none"
        style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
        {item.label}
        <span style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid #1e1b4b' }} />
      </div>
    </div>
  )
}

function GoodBoxAdSlot({ side }: { side: 'left' | 'right' }) {
  const { data: ads } = useQuery({
    queryKey: ['ads', `goodbox-${side}`],
    queryFn: () => advertisementApi?.list?.({ position: `goodbox_${side}` }).then((r: any) => r.data).catch(() => null),
    staleTime: 1000 * 60 * 10,
  })
  const [current, setCurrent] = useState(0)
  const count = ads?.length ?? 0
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setCurrent(c => (c + 1) % count), 4000)
    return () => clearInterval(t)
  }, [count])

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-2 sm:p-3"
      style={{ background:'rgba(0,0,0,0.18)', borderRadius:10 }}>
      {!ads || ads.length === 0 ? (
        <>
          <div style={{ width:36, height:36, background:'rgba(255,255,255,0.15)', border:'1.5px dashed rgba(255,255,255,0.5)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {side === 'left' ? <Megaphone className="h-5 w-5 text-white/70" /> : <Monitor className="h-5 w-5 text-white/70" />}
          </div>
          <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, textAlign:'center' }}>Pub</span>
          <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white/40" /><div className="w-1.5 h-1.5 rounded-full bg-white/25" /></div>
        </>
      ) : (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ minHeight:70 }}>
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }} className="absolute inset-0">
              {ads[current].link
                ? <a href={ads[current].link} target="_blank" rel="noopener noreferrer"><img src={ads[current].image_url} alt="Pub" className="w-full h-full object-cover rounded-lg" /></a>
                : <img src={ads[current].image_url} alt="Pub" className="w-full h-full object-cover rounded-lg" />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function GoodBoxSection() {
  return (
    <section className="py-0">
      <style dangerouslySetInnerHTML={{ __html: CARTON_STYLES }} />
      <div
        style={{ background:'linear-gradient(135deg,#b91c1c 0%,#ea580c 40%,#fbbf24 100%)', borderRadius:14, padding:'0 0 16px', overflow:'hidden' }}
        className="container-app my-5 sm:my-8"
      >
        {/* HEADER : pub | titre | pub */}
        <div style={{ display:'grid', gridTemplateColumns:'clamp(60px,14vw,160px) 1fr clamp(60px,14vw,160px)', alignItems:'stretch', minHeight:72 }}>
          <GoodBoxAdSlot side="left" />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px', gap:5 }}>
            <div style={{ background:'#1e1b4b', border:'3px solid #b91c1c', borderRadius:8, padding:'7px 14px', textAlign:'center' }}>
              <h2 style={{ fontFamily:'system-ui,sans-serif', fontSize:'clamp(11px,2.8vw,22px)', fontWeight:900, color:'#fbbf24', letterSpacing:0.8, margin:0, textShadow:'1px 1px 0 #000', textTransform:'uppercase', lineHeight:1.2 }}>
                e-Sup'M Good Box Alimentaire
              </h2>
            </div>
            <div style={{ width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'12px solid #1e1b4b' }} />
          </div>
          <GoodBoxAdSlot side="right" />
        </div>

        {/* GRILLE : 3 colonnes mobile → 5 desktop (via inline override) */}
        <div
          className="grid gap-2.5 sm:gap-4 px-3 sm:px-6 pt-1"
          style={{ gridTemplateColumns:'repeat(3,1fr)' }}
        >
          {/* Surcharge tailwind ne peut pas changer gridTemplateColumns dynamiquement, on utilise un style tag inline */}
          <style>{`@media(min-width:640px){.gb-grid{grid-template-columns:repeat(5,1fr)!important;}}`}</style>
          {GOOD_BOX_ITEMS.map(item => <Carton key={item.href} item={item} />)}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// GAME ALIMENTAIRE
// ─────────────────────────────────────────────────────────────
const GAMES = [
  { icon: <Gamepad2 className="h-5 w-5 sm:h-8 sm:w-8" />, title: "e-Sup'M Défis",       status: 'open',        href: '/games/defis',      color: 'from-amber-400 to-orange-500' },
  { icon: <Gift className="h-5 w-5 sm:h-8 sm:w-8" />,     title: 'Carte à gratter',      status: 'conditioned', href: '/games/scratch',    color: 'from-pink-500 to-rose-500' },
  { icon: <RefreshCw className="h-5 w-5 sm:h-8 sm:w-8"/>, title: "Roue e-Sup'M",         status: 'conditioned', href: '/games/wheel',      color: 'from-purple-500 to-violet-600' },
  { icon: <Trophy className="h-5 w-5 sm:h-8 sm:w-8" />,   title: 'Juste Prix',           status: 'open',        href: '/games/juste-prix', color: 'from-green-500 to-emerald-600' },
  { icon: <Lightbulb className="h-5 w-5 sm:h-8 sm:w-8"/>, title: 'Quiz',                 status: 'open',        href: '/games/quiz',       color: 'from-blue-500 to-cyan-500' },
  { icon: <Users className="h-5 w-5 sm:h-8 sm:w-8" />,    title: "e-Sup'M Battle",       status: 'open',        href: '/games/battle',     color: 'from-red-500 to-orange-500' },
  { icon: <Star className="h-5 w-5 sm:h-8 sm:w-8" />,     title: 'Calendrier Challenge', status: 'soon',        href: '/games/challenge',  color: 'from-stone-400 to-stone-500' },
]

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Ouvert à tous', cls: 'bg-green-500 text-white' },
  conditioned: { label: 'Conditionné',   cls: 'bg-amber-500 text-stone-900' },
  soon:        { label: 'Bientôt',       cls: 'bg-stone-400 text-white' },
}

function GameSection() {
  return (
    <section className="py-6 sm:py-10 bg-stone-50">
      <div className="container-app">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl font-black text-stone-900">e-Sup'M Game Alimentaire</h2>
          <Link to="/games" className="flex items-center gap-1 text-brand-orange font-semibold text-xs sm:text-sm hover:underline shrink-0">
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {/* 4 colonnes mobile, 7 desktop */}
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
          {GAMES.map(({ icon, title, status, href, color }) => {
            const s = STATUS_LABELS[status]
            return (
              <Link key={href} to={href}>
                <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl p-2.5 sm:p-5 text-white flex flex-col items-center gap-1.5 sm:gap-3 text-center shadow-sm h-full`}>
                  {icon}
                  <h3 className="text-[9px] sm:text-xs font-bold leading-tight">{title}</h3>
                  <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// NOUVEAUTÉS - CORRIGÉ AVEC LE HOOK
// ─────────────────────────────────────────────────────────────
function NewArrivalsSection() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productApi.newArrivals().then(r => r.data),
  })

  const products = useNormalizedProducts(response)

  if (isLoading) {
    return (
      <section className="py-6 sm:py-10 bg-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange" />
              Nos Nouveautés
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange" />
            Nos Nouveautés
          </h2>
          <Link to="/catalogue?sort=created_at" className="flex items-center gap-1 text-brand-orange font-semibold text-xs sm:text-sm hover:underline shrink-0">
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {products.slice(0, 8).map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// INFOS & CONSEILS — scroll horizontal mobile
// ─────────────────────────────────────────────────────────────
const INFOS = [
  { icon: <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" />, label: 'Vos recettes',      href: '/conseils/recettes',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,           label: 'Nos gagnants',       href: '/conseils/gagnants',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6" />,           label: 'Suivis charity',     href: '/conseils/charity',     color: 'bg-green-100 text-green-700 border-green-200' },
  { icon: <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />,       label: 'Conseils',           href: '/conseils/nutrition',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { icon: <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />,   label: 'Suggestions',        href: '/conseils/suggestions', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { icon: <Star className="h-5 w-5 sm:h-6 sm:w-6" />,            label: 'Partenaire',         href: '/partenaire',           color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,        label: 'Une pensée',         href: '/conseils/pensee',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
]

function InfosConseils() {
  return (
    <section className="py-6 sm:py-10 bg-stone-50">
      <div className="container-app">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange" />
            Infos et Conseils
          </h2>
        </div>
        {/* Mobile scroll */}
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {INFOS.map(({ icon, label, href, color }) => (
            <Link key={href} to={href}>
              <div className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 w-[62px] h-[62px] shrink-0 snap-start text-center active:scale-95 transition-all ${color}`}>
                {icon}
                <span className="text-[8px] font-bold leading-tight line-clamp-2">{label}</span>
              </div>
            </Link>
          ))}
        </div>
        {/* Desktop grid */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-7 gap-3">
          {INFOS.map(({ icon, label, href, color }) => (
            <Link key={href} to={href}>
              <motion.div whileHover={{ scale: 1.05, y: -3 }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 aspect-square text-center transition-all ${color}`}>
                {icon}
                <span className="text-xs font-bold leading-tight line-clamp-2">{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// PROGRAMME FIDÉLITÉ
// ─────────────────────────────────────────────────────────────
function LoyaltyBanner() {
  const navigate = useNavigate()
  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className="container-app">
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                <Star className="h-4 w-4 text-white fill-white" />
                <span className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest">Programme Fidélité</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                Gagnez des points à chaque achat
              </h2>
              <p className="mt-1.5 text-white/90 text-xs sm:text-base">
                1 point par 100 FCFA · Niveau Platinum = ×3
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                {['Bronze', 'Argent', 'Or', 'Platinum'].map(l => (
                  <span key={l} className="flex items-center gap-1 bg-white/20 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    <Trophy className="h-2.5 w-2.5" />{l}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center justify-center gap-2 bg-white text-stone-900 font-bold text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl shadow-xl hover:bg-stone-100 transition-colors shrink-0 w-full sm:w-auto"
            >
              Rejoindre e-Sup'M <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="bg-stone-50">
      <SearchBar />
      <HeroBanner />
      <RayonsSection />
      <FeaturedSection />
      <GoodBoxSection />
      <GameSection />
      <NewArrivalsSection />
      <InfosConseils />
      <LoyaltyBanner />
    </div>
  )
}