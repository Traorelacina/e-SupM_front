import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ShoppingCart, Star, ChevronRight, ChevronLeft,
  Megaphone, Leaf, Zap, Heart, Package, Repeat, Tag, Truck, Trophy,
  UtensilsCrossed, Apple, ShoppingBag, Gamepad2, Gift, RefreshCw,
  BookOpen, Users, Lightbulb, MessageSquare, Monitor, Sparkles,
  Search, MapPin, Clock, TrendingUp, Award, Flame,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoryApi, productApi, advertisementApi } from '@/api'
import { storageUrl } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useNormalizedProducts } from '@/hooks/useNormalizedProducts'
import type { Product } from '@/types'
import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS & GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  :root {
    --esup-cream: #faf7f2;
    --esup-warm: #f5efe6;
    --esup-amber: #e8820c;
    --esup-amber-light: #f5a623;
    --esup-earth: #8b5e3c;
    --esup-dark: #1a1209;
    --esup-olive: #4a5e2e;
    --esup-sage: #6b7c4a;
    --esup-carton: #c49a51;
    --esup-carton-dark: #8b5a2b;
    --esup-carton-light: #e8c06a;
    --radius-card: 14px;
  }

  .esup-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .esup-font-body { font-family: 'DM Sans', system-ui, sans-serif; }

  /* Grain texture overlay */
  .esup-grain::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
    pointer-events: none;
    border-radius: inherit;
  }

  /* Cardboard box styles */
  @keyframes boxSlideIn {
    0% { opacity: 0; transform: translateY(30px) scale(0.9); }
    60% { transform: translateY(-5px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .carton-box {
    animation: boxSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    cursor: pointer;
    position: relative;
  }
  .carton-box:nth-child(1) { animation-delay: 0.05s; }
  .carton-box:nth-child(2) { animation-delay: 0.1s; }
  .carton-box:nth-child(3) { animation-delay: 0.15s; }
  .carton-box:nth-child(4) { animation-delay: 0.2s; }
  .carton-box:nth-child(5) { animation-delay: 0.25s; }
  .carton-box:nth-child(6) { animation-delay: 0.3s; }
  .carton-box:nth-child(7) { animation-delay: 0.35s; }
  .carton-box:nth-child(8) { animation-delay: 0.4s; }
  .carton-box:nth-child(9) { animation-delay: 0.45s; }

  .carton-face {
    background:
      repeating-linear-gradient(
        92deg,
        transparent 0px,
        transparent 3px,
        rgba(0,0,0,0.025) 3px,
        rgba(0,0,0,0.025) 4px
      ),
      repeating-linear-gradient(
        2deg,
        transparent 0px,
        transparent 8px,
        rgba(255,255,255,0.04) 8px,
        rgba(255,255,255,0.04) 9px
      ),
      linear-gradient(160deg, #d4a04a 0%, #b5783a 35%, #c49a51 65%, #8b5a2b 100%);
    border: 1.5px solid rgba(255,255,255,0.22);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.3),
      inset 0 -2px 4px rgba(0,0,0,0.2),
      0 4px 12px rgba(0,0,0,0.18),
      0 1px 3px rgba(0,0,0,0.12);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .carton-box:hover .carton-face {
    transform: translateY(-5px) rotateX(-5deg) rotateY(3deg);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.35),
      inset 0 -2px 4px rgba(0,0,0,0.2),
      0 14px 28px rgba(0,0,0,0.22),
      0 4px 8px rgba(0,0,0,0.15);
    background:
      repeating-linear-gradient(
        92deg,
        transparent 0px,
        transparent 3px,
        rgba(0,0,0,0.02) 3px,
        rgba(0,0,0,0.02) 4px
      ),
      linear-gradient(160deg, #e8b855 0%, #c98a45 35%, #daa855 65%, #a06832 100%);
  }

  .carton-flap {
    background: linear-gradient(180deg, #dfaa50 0%, #c08535 60%, #b07030 100%);
    border-bottom: 2px solid rgba(0,0,0,0.15);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }

  .carton-shadow-3d {
    position: absolute;
    bottom: -4px;
    right: -4px;
    left: 4px;
    top: 4px;
    background: rgba(0,0,0,0.25);
    border-radius: var(--radius-card);
    z-index: -1;
    transition: all 0.3s ease;
  }
  .carton-box:hover .carton-shadow-3d {
    bottom: -8px;
    right: -6px;
  }

  /* Horizontal scroll hide scrollbar */
  .hide-scroll::-webkit-scrollbar { display: none; }
  .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  /* Section title underline */
  .section-title-line {
    display: inline-block;
    position: relative;
  }
  .section-title-line::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40%;
    height: 3px;
    background: var(--esup-amber);
    border-radius: 2px;
  }

  /* Product card hover */
  .product-card:hover .product-img {
    transform: scale(1.07);
  }

  /* Ad slot pulse */
  @keyframes adPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  .ad-placeholder-icon { animation: adPulse 2.5s ease-in-out infinite; }
`

// ─────────────────────────────────────────────────────────────
// AD SLOT — refined version
// ─────────────────────────────────────────────────────────────
interface AdSlotProps {
  ads?: { id: number; image_url: string; link?: string; title?: string }[]
  side: 'left' | 'right'
  minHeight?: number
  className?: string
}

function AdSlot({ ads, side, minHeight = 300, className = '' }: AdSlotProps) {
  const [current, setCurrent] = useState(0)
  const count = ads?.length ?? 0

  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setCurrent(c => (c + 1) % count), 4500)
    return () => clearInterval(t)
  }, [count])

  const placeholder = (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed"
      style={{ background: 'rgba(139,94,60,0.06)', borderColor: 'rgba(139,94,60,0.2)' }}>
      <div className="ad-placeholder-icon w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(139,94,60,0.1)' }}>
        <Megaphone className="h-5 w-5" style={{ color: 'var(--esup-earth)' }} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-center px-2"
        style={{ color: 'var(--esup-earth)', opacity: 0.5 }}>
        Espace Pub
      </span>
    </div>
  )

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`} style={{ minHeight }}>
      {!ads || ads.length === 0 ? placeholder : (
        <>
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0">
              {ads[current].link ? (
                <a href={ads[current].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <img src={ads[current].image_url} alt={ads[current].title ?? 'Publicité'}
                    className="w-full h-full object-cover rounded-2xl" />
                </a>
              ) : (
                <img src={ads[current].image_url} alt={ads[current].title ?? 'Publicité'}
                  className="w-full h-full object-cover rounded-2xl" />
              )}
            </motion.div>
          </AnimatePresence>
          {count > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {ads.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HERO SLIDER — editorial, warm
// ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    tag: 'Ventes Flash',
    title: 'Faites vos courses\nen ligne',
    sub: 'Livraison à domicile en 24h à Abidjan. Plus de 5 000 produits disponibles.',
    cta: 'Découvrir le catalogue',
    href: '/catalogue',
    palette: { from: '#c0530a', via: '#e8820c', to: '#f5a623', tag: '#fff3cd' },
    Icon: ShoppingCart,
    accent: TrendingUp,
  },
  {
    tag: 'Jeux & Gains',
    title: 'Gagnez des lots\nchaque semaine',
    sub: 'Quiz, Roue, Carte à gratter — des surprises à chaque achat.',
    cta: 'Jouer maintenant',
    href: '/games',
    palette: { from: '#4c1d95', via: '#7c3aed', to: '#a855f7', tag: '#f3e8ff' },
    Icon: Gamepad2,
    accent: Sparkles,
  },
  {
    tag: 'Charity Panier',
    title: 'Faites le bien\nen faisant vos courses',
    sub: 'Offrez des bons alimentaires et gagnez des points fidélité.',
    cta: 'Faire un don',
    href: '/charity',
    palette: { from: '#064e3b', via: '#059669', to: '#34d399', tag: '#d1fae5' },
    Icon: Heart,
    accent: Leaf,
  },
]

function HeroSlider() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
  }

  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1)
      setCurrent(c => (c + 1) % SLIDES.length)
    }, 5500)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[current]
  const { from, via, to } = slide.palette

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl h-full" style={{ minHeight: 220 }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 esup-grain"
          style={{ background: `linear-gradient(145deg, ${from} 0%, ${via} 55%, ${to} 100%)` }}>

          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

          {/* Large icon */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-24 h-24 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
            <slide.Icon className="h-12 w-12 text-white" strokeWidth={1.5} />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-8 py-7 sm:py-10 max-w-md">
            <motion.span
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full w-fit mb-3"
              style={{ background: slide.palette.tag, color: from }}>
              <slide.accent className="h-3 w-3" />
              {slide.tag}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="esup-font-display text-white leading-tight font-black"
              style={{ fontSize: 'clamp(22px, 4vw, 38px)', whiteSpace: 'pre-line' }}>
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="esup-font-body mt-2 text-white/85 text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              {slide.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
              className="mt-5 flex gap-3 flex-wrap">
              <button onClick={() => navigate(slide.href)}
                className="esup-font-body flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ background: 'white', color: from }}>
                {slide.cta} <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/register')}
                className="esup-font-body flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(4px)' }}>
                Créer un compte
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      {[{ dir: -1, Icon: ChevronLeft, side: 'left-3' }, { dir: 1, Icon: ChevronRight, side: 'right-3' }].map(({ dir, Icon, side }) => (
        <button key={side}
          onClick={() => go((current + SLIDES.length + dir) % SLIDES.length)}
          className={`absolute ${side} top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110`}
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
          <Icon className="h-4 w-4" />
        </button>
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HERO BANNER
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
    <section className="py-3 sm:py-5" style={{ background: 'var(--esup-cream)' }}>
      <div className="container-app">
        {/* Mobile */}
        <div className="block sm:hidden space-y-3">
          <HeroSlider />
          <div className="grid grid-cols-2 gap-3">
            <AdSlot ads={leftAds} side="left" minHeight={72} />
            <AdSlot ads={rightAds} side="right" minHeight={72} />
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden sm:grid gap-4 items-stretch"
          style={{ gridTemplateColumns: 'clamp(130px,13vw,190px) 1fr clamp(130px,13vw,190px)' }}>
          <AdSlot ads={leftAds} side="left" />
          <HeroSlider />
          <AdSlot ads={rightAds} side="right" />
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// SEARCH BAR — warm, tactile
// ─────────────────────────────────────────────────────────────
function SearchBar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/catalogue?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="sticky top-0 z-30 border-b" style={{ background: 'white', borderColor: 'rgba(139,94,60,0.12)' }}>
      <div className="container-app py-2.5 sm:py-3">
        <form onSubmit={handleSearch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all"
          style={{ background: 'var(--esup-warm)', borderColor: 'rgba(139,94,60,0.2)' }}
          onClick={() => inputRef.current?.focus()}>
          <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--esup-earth)', opacity: 0.6 }} />
          <input ref={inputRef}
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un produit, une marque…"
            className="esup-font-body flex-1 bg-transparent text-sm outline-none min-w-0"
            style={{ color: 'var(--esup-dark)' }} />
          <div className="hidden sm:flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--esup-earth)', opacity: 0.5 }}>
            <MapPin className="h-3 w-3" /> Abidjan
          </div>
          <button type="submit"
            className="esup-font-body flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
            style={{ background: 'var(--esup-amber)', color: 'white' }}>
            <span className="hidden sm:inline">Rechercher</span>
            <span className="sm:hidden"><Search className="h-3.5 w-3.5" /></span>
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CATEGORY HELPERS
// ─────────────────────────────────────────────────────────────
function getCatImageUrl(cat: { image?: string; image_url?: string }): string | null {
  if (cat.image_url) return cat.image_url
  if (cat.image) return storageUrl(cat.image)
  return null
}

const CAT_PALETTES = [
  ['#e8820c', '#f5a623'], ['#4a5e2e', '#6b8c3e'], ['#1a6b8a', '#2d9cca'],
  ['#8b3a9e', '#b84fd0'], ['#c0392b', '#e74c3c'], ['#16706b', '#1abc9a'],
  ['#c07a0c', '#e8a810'], ['#1a3e8b', '#2d62ca'], ['#9e3a6b', '#cc4f8d'],
  ['#4a7e2e', '#6bb84f'], ['#8b6a0c', '#c0950c'], ['#0c6b8b', '#0ca8cc'],
  ['#5e2e8b', '#8b4fd0'],
]

function catGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return CAT_PALETTES[h % CAT_PALETTES.length]
}

// ─────────────────────────────────────────────────────────────
// RAYONS SECTION
// ─────────────────────────────────────────────────────────────
function RayonCard({ cat, index }: { cat: any; index: number }) {
  const imgUrl = getCatImageUrl(cat)
  const [c1, c2] = catGradient(cat.name)
  const initial = cat.name.charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group">
      <Link to={`/rayons/${cat.slug}`}
        className="relative flex flex-col items-center justify-end overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300"
        style={{ aspectRatio: '3/4' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)` }}>
            <span className="esup-font-display text-4xl font-black text-white/50 select-none">{initial}</span>
          </div>
        )}
        <div className="absolute inset-0 transition-all duration-300"
          style={{ background: 'linear-gradient(to top, rgba(20,12,4,0.82) 0%, rgba(20,12,4,0.1) 50%, transparent 100%)' }} />
        <div className="relative z-10 w-full px-2 pb-2.5">
          <p className="esup-font-body text-[10px] sm:text-[11px] font-bold text-white text-center leading-tight line-clamp-2">
            {cat.name}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

function RayonCardMobile({ cat }: { cat: any }) {
  const imgUrl = getCatImageUrl(cat)
  const [c1, c2] = catGradient(cat.name)
  const initial = cat.name.charAt(0).toUpperCase()

  return (
    <Link to={`/rayons/${cat.slug}`}
      className="relative flex flex-col items-center justify-end overflow-hidden rounded-2xl shrink-0 snap-start active:scale-95 transition-transform duration-150"
      style={{ width: 72, height: 84 }}>
      {imgUrl ? (
        <img src={imgUrl} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)` }}>
          <span className="esup-font-display text-xl font-black text-white/60 select-none">{initial}</span>
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,12,4,0.78) 0%, transparent 60%)' }} />
      <span className="relative z-10 text-[8px] font-bold text-white text-center leading-tight px-1 pb-1.5 line-clamp-2">
        {cat.name}
      </span>
    </Link>
  )
}

function RayonsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list(),
    staleTime: 1000 * 60 * 30,
  })

  const categories = Array.isArray(data) ? data : (data as any)?.data ?? []
  const filtered = categories.filter((c: any) => c.show_in_menu).slice(0, 13)

  return (
    <section className="py-7 sm:py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 className="esup-font-display section-title-line text-lg sm:text-2xl font-black"
            style={{ color: 'var(--esup-dark)' }}>
            Nos Rayons
          </h2>
          <Link to="/rayons"
            className="esup-font-body flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: 'var(--esup-amber)' }}>
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex sm:hidden gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 hide-scroll snap-x snap-mandatory">
          {isLoading
            ? Array(8).fill(0).map((_, i) => <div key={i} className="w-[72px] h-[84px] rounded-2xl bg-stone-100 animate-pulse shrink-0" />)
            : filtered.map((cat: any) => <RayonCardMobile key={cat.id} cat={cat} />)
          }
          <Link to="/rayons"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed shrink-0 snap-start transition-all"
            style={{ width: 72, height: 84, borderColor: 'rgba(139,94,60,0.25)' }}>
            <ChevronRight className="h-4 w-4" style={{ color: 'var(--esup-earth)', opacity: 0.5 }} />
            <span className="text-[8px] font-bold text-center" style={{ color: 'var(--esup-earth)', opacity: 0.5 }}>Voir tout</span>
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {isLoading
            ? Array(13).fill(0).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-stone-100 animate-pulse" />)
            : filtered.map((cat: any, i: number) => <RayonCard key={cat.id} cat={cat} index={i} />)
          }
          <motion.div whileHover={{ y: -4 }}>
            <Link to="/rayons"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all"
              style={{ aspectRatio: '3/4', borderColor: 'rgba(139,94,60,0.25)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--esup-warm)' }}>
                <ChevronRight className="h-5 w-5" style={{ color: 'var(--esup-earth)' }} />
              </div>
              <span className="esup-font-body text-[10px] font-bold" style={{ color: 'var(--esup-earth)', opacity: 0.5 }}>Voir tout</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD — warm, natural
// ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { addItem, isAdding } = useCart()
  const navigate = useNavigate()

  const LABELS: Record<string, { text: string; bg: string; fg: string }> = {
    stock_limite:  { text: 'Stock limité', bg: '#f97316', fg: 'white' },
    promo:         { text: product.admin_label_discount ? `-${product.admin_label_discount}%` : 'Promo', bg: '#dc2626', fg: 'white' },
    stock_epuise:  { text: 'Épuisé', bg: '#6b7280', fg: 'white' },
    offre_limitee: { text: 'Offre limitée', bg: '#7c3aed', fg: 'white' },
    vote_rayon:    { text: 'Vote rayon', bg: '#2563eb', fg: 'white' },
  }
  const label = product.admin_label !== 'none' ? LABELS[product.admin_label] : null

  return (
    <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}
      className="product-card overflow-hidden bg-white rounded-2xl border transition-shadow hover:shadow-lg"
      style={{ borderColor: 'rgba(139,94,60,0.1)' }}>
      <div onClick={() => navigate(`/produit/${product.slug}`)}
        className="relative overflow-hidden cursor-pointer" style={{ aspectRatio: '4/3', background: 'var(--esup-warm)' }}>
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name}
            className="product-img w-full h-full object-cover transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-10 w-10" style={{ color: 'var(--esup-earth)', opacity: 0.25 }} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {label && (
            <span className="esup-font-body text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: label.bg, color: label.fg }}>{label.text}</span>
          )}
          {product.is_new && !label && (
            <span className="esup-font-body text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--esup-amber)', color: 'white' }}>Nouveau</span>
          )}
          {product.is_bio && (
            <span className="esup-font-body text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: '#16a34a', color: 'white' }}>
              <Leaf className="h-2 w-2" />Bio
            </span>
          )}
          {product.is_local && (
            <span className="esup-font-body text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#166534', color: 'white' }}>Local CI</span>
          )}
        </div>
        {product.discount_percentage && (
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: '#dc2626' }}>
            -{product.discount_percentage}%
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)' }}>
            <span className="esup-font-body text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--esup-dark)', color: 'white' }}>Épuisé</span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="esup-font-body text-[9px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 truncate"
          style={{ color: 'var(--esup-earth)', opacity: 0.65 }}>
          {product.category?.name ?? product.brand}
        </p>
        <h3 onClick={() => navigate(`/produit/${product.slug}`)}
          className="esup-font-body text-xs sm:text-sm font-semibold line-clamp-2 leading-snug cursor-pointer transition-colors"
          style={{ color: 'var(--esup-dark)' }}>
          {product.name}
        </h3>
        {product.reviews_count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-2.5 w-2.5 fill-current" style={{ color: 'var(--esup-amber)' }} />
            <span className="esup-font-body text-[10px] font-semibold" style={{ color: 'var(--esup-earth)' }}>
              {product.average_rating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="esup-font-display text-sm sm:text-base font-black" style={{ color: 'var(--esup-dark)' }}>
              {formatCurrency(product.price)}
            </p>
            {product.compare_price && (
              <p className="esup-font-body text-[10px] line-through" style={{ color: 'var(--esup-earth)', opacity: 0.5 }}>
                {formatCurrency(product.compare_price)}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => product.in_stock && addItem({ productId: product.id, quantity: 1 })}
            disabled={!product.in_stock || isAdding}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm"
            style={product.in_stock
              ? { background: 'var(--esup-amber)', color: 'white' }
              : { background: 'var(--esup-warm)', color: 'var(--esup-earth)', opacity: 0.4, cursor: 'not-allowed' }}>
            <ShoppingCart className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// FEATURED SECTION
// ─────────────────────────────────────────────────────────────
function FeaturedSection() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.featured().then(r => r.data),
  })
  const products = useNormalizedProducts(response)

  return (
    <section className="py-7 sm:py-10" style={{ background: 'var(--esup-cream)' }}>
      <div className="container-app">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 className="esup-font-display section-title-line text-lg sm:text-2xl font-black flex items-center gap-2"
            style={{ color: 'var(--esup-dark)' }}>
            <Flame className="h-5 w-5" style={{ color: 'var(--esup-amber)' }} />
            Produits Vedettes
          </h2>
          {!isLoading && products.length > 0 && (
            <Link to="/catalogue?sort=sales_count"
              className="esup-font-body flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: 'var(--esup-amber)' }}>
              Voir tout <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 5).map((p: Product) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// GOOD BOX — cartons réduits, textes en dehors, pub agrandies
// ─────────────────────────────────────────────────────────────
interface BoxItem {
  icon: React.ReactNode
  label: string
  sub?: string
  href: string
  accentColor: string
  tagColor: string
}

const GOOD_BOX_ITEMS: BoxItem[] = [
  { icon: <Tag />,            label: 'Promo',          href: '/catalogue?filter=promo',      accentColor: '#dc2626', tagColor: '#fca5a5' },
  { icon: <Zap />,            label: 'Solde',          href: '/catalogue?filter=solde',       accentColor: '#ea580c', tagColor: '#fdba74' },
  { icon: <Package />,        label: 'Déstockage',     sub: 'consommer avant…',              href: '/catalogue?filter=destockage',  accentColor: '#ca8a04', tagColor: '#fde68a' },
  { icon: <UtensilsCrossed/>, label: 'Panier menu',    href: '/good-box/menu',               accentColor: '#16a34a', tagColor: '#bbf7d0' },
  { icon: <Heart />,          label: 'Panier charity', sub: 'dons alimentaires',             href: '/charity',                      accentColor: '#0d9488', tagColor: '#99f6e4' },
  { icon: <Repeat />,         label: 'Abonnement',     sub: 'panier essentiel',              href: '/subscriptions',               accentColor: '#2563eb', tagColor: '#bfdbfe' },
  { icon: <Gift />,           label: 'Panier évent',   sub: 'anniversaire, naissance…',      href: '/good-box/event',              accentColor: '#9333ea', tagColor: '#e9d5ff' },
  { icon: <Sparkles />,       label: 'Nouveautés',     sub: 'découverte…',                   href: '/catalogue?sort=created_at',   accentColor: '#db2777', tagColor: '#fbcfe8' },
  { icon: <Truck />,          label: 'Déléguer',       sub: 'listez, on s\'exécute',         href: '/good-box/delegation',         accentColor: '#0891b2', tagColor: '#a5f3fc' },
]

// Carton simplifié — icône seule dans la boîte, texte en dessous
function CartonBox({ item, index }: { item: BoxItem; index: number }) {
  const navigate = useNavigate()
  const FLAP_H = 20

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* La boîte carton (réduite, icône seule) */}
      <div className="carton-box w-full" onClick={() => navigate(item.href)}>
        <div className="carton-shadow-3d rounded-xl" />
        <div className="carton-face rounded-xl overflow-hidden"
          style={{ height: 'clamp(62px, 10vw, 82px)', position: 'relative' }}>
          {/* Flap */}
          <div className="carton-flap absolute top-0 left-0 right-0" style={{ height: FLAP_H, zIndex: 2 }}>
            <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 1, background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ position: 'absolute', top: '40%', left: '10%', width: 1, height: '60%', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ position: 'absolute', top: '40%', right: '10%', width: 1, height: '60%', background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Fold shadow */}
          <div style={{ position: 'absolute', top: FLAP_H, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.18)', zIndex: 2 }} />

          {/* Color accent stripe — left edge */}
          <div style={{ position: 'absolute', top: FLAP_H + 2, left: 0, bottom: 0, width: 4, background: item.accentColor, zIndex: 3, borderRadius: '0 0 0 6px' }} />

          {/* Icon stamp — centré dans la boîte */}
          <div style={{ position: 'absolute', top: FLAP_H + 2, left: 4, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: item.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              color: 'white',
            }}>
              {item.icon}
            </div>
          </div>

          {/* Tag top-right */}
          <div style={{ position: 'absolute', top: 4, right: 5, zIndex: 4 }}>
            <div style={{ padding: '1px 4px', borderRadius: 3, background: item.tagColor, fontSize: 6, fontWeight: 800, color: item.accentColor, letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: 'system-ui' }}>
              e-Sup'M
            </div>
          </div>
        </div>
      </div>

      {/* Texte en dehors de la boîte */}
      <div className="text-center px-0.5">
        <p className="esup-font-body font-bold text-white leading-tight"
          style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', lineHeight: 1.25, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {item.label}
        </p>
        {item.sub && (
          <p className="esup-font-body font-medium mt-0.5"
            style={{ fontSize: 'clamp(7px, 1.2vw, 9px)', lineHeight: 1.1, color: 'rgba(255,255,255,0.6)' }}>
            {item.sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GOOD BOX AD SLOT — agrandi avec 3 slides mock
// ─────────────────────────────────────────────────────────────
interface GoodBoxAdSlotProps {
  side: 'left' | 'right'
}

// Slides de démo pour les espaces pub (3 par côté)
const GOODBOX_AD_MOCK = {
  left: [
    { id: 1, gradient: 'linear-gradient(145deg,#f97316,#ea580c)', icon: <Tag />, title: 'Promo -50%', sub: 'Offre limitée' },
    { id: 2, gradient: 'linear-gradient(145deg,#0891b2,#0369a1)', icon: <Truck />, title: 'Livraison', sub: 'Gratuite dès 5000 F' },
    { id: 3, gradient: 'linear-gradient(145deg,#16a34a,#15803d)', icon: <Leaf />, title: 'Produits Bio', sub: 'Origine locale CI' },
  ],
  right: [
    { id: 1, gradient: 'linear-gradient(145deg,#7c3aed,#6d28d9)', icon: <Gift />, title: 'Gagnez !', sub: 'Jouez et tentez votre chance' },
    { id: 2, gradient: 'linear-gradient(145deg,#db2777,#be185d)', icon: <Heart />, title: 'Charity', sub: 'Ensemble on agit' },
    { id: 3, gradient: 'linear-gradient(145deg,#d97706,#b45309)', icon: <Star />, title: 'Fidélité', sub: '1 pt / 100 FCFA' },
  ],
}

function GoodBoxAdSlot({ side }: GoodBoxAdSlotProps) {
  const { data: ads } = useQuery({
    queryKey: ['ads', `goodbox-${side}`],
    queryFn: () => advertisementApi?.list?.({ position: `goodbox_${side}` }).then((r: any) => r.data).catch(() => null),
    staleTime: 1000 * 60 * 10,
  })

  const [current, setCurrent] = useState(0)
  const realAds = ads && ads.length > 0 ? ads : null
  const mockSlides = GOODBOX_AD_MOCK[side]
  const count = realAds ? realAds.length : mockSlides.length

  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setCurrent(c => (c + 1) % count), 3800)
    return () => clearInterval(t)
  }, [count])

  return (
    <div className="relative overflow-hidden rounded-xl flex flex-col"
      style={{ background: 'rgba(0,0,0,0.2)', minHeight: 'clamp(110px, 18vw, 160px)' }}>
      {realAds ? (
        // Vraies pubs API
        <>
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0">
              {realAds[current].link
                ? <a href={realAds[current].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img src={realAds[current].image_url} alt="Pub" className="w-full h-full object-cover" />
                  </a>
                : <img src={realAds[current].image_url} alt="Pub" className="w-full h-full object-cover" />
              }
            </motion.div>
          </AnimatePresence>
          {/* Dots */}
          {count > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {realAds.map((_: any, i: number) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/40'}`} />
              ))}
            </div>
          )}
        </>
      ) : (
        // Slides de placeholder avec style raffiné
        <>
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3"
              style={{ background: mockSlides[current].gradient }}>
              {/* Deco circle */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white' }}>
                {mockSlides[current].icon}
              </div>
              <div className="text-center">
                <p className="esup-font-display font-black text-white leading-tight"
                  style={{ fontSize: 'clamp(11px, 2vw, 15px)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  {mockSlides[current].title}
                </p>
                <p className="esup-font-body text-white/75 mt-0.5 font-medium"
                  style={{ fontSize: 'clamp(8px, 1.3vw, 10px)' }}>
                  {mockSlides[current].sub}
                </p>
              </div>
              {/* Pub badge */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,0,0,0.3)', fontSize: 7, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Pub
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Nav dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {mockSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/40'}`} />
            ))}
          </div>
          {/* Prev/Next arrows */}
          <button
            onClick={() => setCurrent(c => (c - 1 + count) % count)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setCurrent(c => (c + 1) % count)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  )
}

function GoodBoxSection() {
  return (
    <section className="py-4 sm:py-6">
      <style dangerouslySetInnerHTML={{ __html: `
        .carton-box svg { width: clamp(14px, 2.6vw, 18px); height: clamp(14px, 2.6vw, 18px); }
      ` }} />
      <div className="container-app">
        <div className="overflow-hidden rounded-2xl shadow-xl"
          style={{ background: 'linear-gradient(150deg, #7c1d0a 0%, #b91c1c 40%, #e8820c 75%, #f5a623 100%)' }}>

          {/* ── Header : pub gauche | titre | pub droite ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(100px, 20vw, 210px) 1fr clamp(100px, 20vw, 210px)',
            alignItems: 'stretch',
            gap: 0,
            padding: '10px 10px 0',
          }}>
            {/* Pub gauche */}
            <GoodBoxAdSlot side="left" />

            {/* Titre centré */}
            <div className="flex flex-col items-center justify-center px-3 py-4 gap-2">
              <div className="rounded-2xl px-5 py-3 text-center w-full"
                style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.15)' }}>
                <h2 className="esup-font-display font-black text-white m-0"
                  style={{
                    fontSize: 'clamp(16px, 4vw, 32px)',
                    letterSpacing: 0.5,
                    lineHeight: 1.15,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>
                  e-Sup'M Good Box
                </h2>
                <p className="esup-font-body m-0 mt-1" style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: 1 }}>
                  Alimentaire
                </p>
              </div>
              {/* Flèche vers cartons */}
              <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '12px solid rgba(0,0,0,0.35)' }} />
            </div>

            {/* Pub droite */}
            <GoodBoxAdSlot side="right" />
          </div>

          {/* ── Cartons grid — textes en dehors ── */}
          <div className="px-3 sm:px-6 pb-5 pt-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(8px, 2.5vw, 18px)',
            }}>
            <style>{`@media(min-width:640px){.good-box-grid-inner{grid-template-columns:repeat(5,1fr)!important;}}`}</style>
            {GOOD_BOX_ITEMS.map((item, i) => (
              <CartonBox key={item.href} item={item} index={i} />
            ))}
          </div>

          {/* ── Responsive: 5 colonnes sur sm+ ── */}
          <style>{`
            @media(min-width:640px){
              .goodbox-cartons-grid{grid-template-columns:repeat(5,1fr)!important;}
            }
          `}</style>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// GAME SECTION
// ─────────────────────────────────────────────────────────────
const GAMES = [
  { Icon: Gamepad2, title: "e-Sup'M Défis",      status: 'open',        href: '/games/defis',      from: '#d97706', to: '#ea580c' },
  { Icon: Gift,     title: 'Carte à gratter',     status: 'conditioned', href: '/games/scratch',    from: '#db2777', to: '#e11d48' },
  { Icon: RefreshCw,title: "Roue e-Sup'M",        status: 'conditioned', href: '/games/wheel',      from: '#7c3aed', to: '#6d28d9' },
  { Icon: Trophy,   title: 'Juste Prix',           status: 'open',        href: '/games/juste-prix', from: '#059669', to: '#047857' },
  { Icon: Lightbulb,title: 'Quiz',                 status: 'open',        href: '/games/quiz',       from: '#2563eb', to: '#1d4ed8' },
  { Icon: Users,    title: "e-Sup'M Battle",       status: 'open',        href: '/games/battle',     from: '#dc2626', to: '#b91c1c' },
  { Icon: Star,     title: 'Calendrier Challenge', status: 'soon',        href: '/games/challenge',  from: '#6b7280', to: '#4b5563' },
]

const STATUS_CFG = {
  open:        { label: 'Ouvert', bg: '#dcfce7', fg: '#166534' },
  conditioned: { label: 'Conditionné', bg: '#fef3c7', fg: '#92400e' },
  soon:        { label: 'Bientôt', bg: '#f3f4f6', fg: '#374151' },
}

function GameSection() {
  return (
    <section className="py-7 sm:py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 className="esup-font-display section-title-line text-lg sm:text-2xl font-black" style={{ color: 'var(--esup-dark)' }}>
            e-Sup'M Game Alimentaire
          </h2>
          <Link to="/games" className="esup-font-body flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: 'var(--esup-amber)' }}>
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4">
          {GAMES.map(({ Icon, title, status, href, from, to }) => {
            const s = STATUS_CFG[status as keyof typeof STATUS_CFG]
            return (
              <Link key={href} to={href}>
                <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
                  className="rounded-2xl p-2.5 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 text-center h-full shadow-sm"
                  style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.18)' }}>
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="esup-font-body text-[9px] sm:text-xs font-bold text-white leading-tight">{title}</h3>
                  <span className="esup-font-body text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
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
// NEW ARRIVALS
// ─────────────────────────────────────────────────────────────
function NewArrivalsSection() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productApi.newArrivals().then(r => r.data),
  })
  const products = useNormalizedProducts(response)

  return (
    <section className="py-7 sm:py-10" style={{ background: 'var(--esup-cream)' }}>
      <div className="container-app">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 className="esup-font-display section-title-line text-lg sm:text-2xl font-black flex items-center gap-2"
            style={{ color: 'var(--esup-dark)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--esup-amber)' }} />
            Nos Nouveautés
          </h2>
          {!isLoading && products.length > 0 && (
            <Link to="/catalogue?sort=created_at"
              className="esup-font-body flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: 'var(--esup-amber)' }}>
              Voir tout <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.slice(0, 8).map((p: Product) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// INFOS & CONSEILS
// ─────────────────────────────────────────────────────────────
const INFOS = [
  { Icon: UtensilsCrossed, label: 'Vos recettes',   href: '/conseils/recettes',    bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  { Icon: Users,           label: 'Nos gagnants',   href: '/conseils/gagnants',    bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  { Icon: Heart,           label: 'Suivis charity', href: '/conseils/charity',     bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0' },
  { Icon: Lightbulb,       label: 'Conseils',       href: '/conseils/nutrition',   bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  { Icon: MessageSquare,   label: 'Suggestions',    href: '/conseils/suggestions', bg: '#faf5ff', fg: '#7e22ce', border: '#e9d5ff' },
  { Icon: Award,           label: 'Partenaire',     href: '/partenaire',           bg: '#fffbeb', fg: '#d97706', border: '#fde68a' },
  { Icon: Sparkles,        label: 'Une pensée',     href: '/conseils/pensee',      bg: '#fff1f2', fg: '#be123c', border: '#fecdd3' },
]

function InfosConseils() {
  return (
    <section className="py-7 sm:py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 className="esup-font-display section-title-line text-lg sm:text-2xl font-black flex items-center gap-2"
            style={{ color: 'var(--esup-dark)' }}>
            <BookOpen className="h-5 w-5" style={{ color: 'var(--esup-amber)' }} />
            Infos et Conseils
          </h2>
        </div>
        {/* Mobile */}
        <div className="flex sm:hidden gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 hide-scroll snap-x snap-mandatory">
          {INFOS.map(({ Icon, label, href, bg, fg, border }) => (
            <Link key={href} to={href}>
              <div className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border-2 shrink-0 snap-start active:scale-95 transition-all"
                style={{ width: 68, height: 68, background: bg, borderColor: border }}>
                <Icon className="h-5 w-5" style={{ color: fg }} strokeWidth={2} />
                <span className="esup-font-body text-[8px] font-bold text-center leading-tight" style={{ color: fg }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
        {/* Desktop */}
        <div className="hidden sm:grid grid-cols-4 md:grid-cols-7 gap-3">
          {INFOS.map(({ Icon, label, href, bg, fg, border }) => (
            <Link key={href} to={href}>
              <motion.div whileHover={{ scale: 1.06, y: -4 }}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 aspect-square text-center transition-all"
                style={{ background: bg, borderColor: border }}>
                <Icon className="h-6 w-6" style={{ color: fg }} strokeWidth={2} />
                <span className="esup-font-body text-xs font-bold leading-tight" style={{ color: fg }}>{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// LOYALTY BANNER
// ─────────────────────────────────────────────────────────────
function LoyaltyBanner() {
  const navigate = useNavigate()
  const TIERS = [
    { label: 'Bronze', color: '#cd7f32' },
    { label: 'Argent', color: '#a8a9ad' },
    { label: 'Or',     color: '#e8a010' },
    { label: 'Platinum', color: '#e5e4e2' },
  ]

  return (
    <section className="py-7 sm:py-10" style={{ background: 'var(--esup-cream)' }}>
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl shadow-xl esup-grain"
          style={{ background: 'linear-gradient(145deg, var(--esup-dark) 0%, #3a2210 50%, var(--esup-earth) 100%)' }}>
          {/* Decorative */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--esup-amber-light) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--esup-amber) 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-10 md:p-14">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,130,12,0.2)' }}>
                  <Star className="h-4 w-4 fill-current" style={{ color: 'var(--esup-amber)' }} />
                </div>
                <span className="esup-font-body font-bold text-xs uppercase tracking-widest" style={{ color: 'var(--esup-amber)' }}>
                  Programme Fidélité
                </span>
              </div>
              <h2 className="esup-font-display text-xl sm:text-3xl font-black text-white leading-tight">
                Gagnez des points<br />à chaque achat
              </h2>
              <p className="esup-font-body mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                1 point par 100 FCFA · Niveau Platinum = ×3
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                {TIERS.map(t => (
                  <span key={t.label} className="esup-font-body flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)', color: t.color, border: `1px solid ${t.color}40` }}>
                    <Trophy className="h-3 w-3" style={{ color: t.color }} />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => navigate('/register')}
              className="esup-font-body flex items-center gap-2 font-bold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shrink-0 w-full sm:w-auto justify-center"
              style={{ background: 'var(--esup-amber)', color: 'white' }}>
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
    <div className="esup-font-body" style={{ background: 'var(--esup-cream)' }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
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