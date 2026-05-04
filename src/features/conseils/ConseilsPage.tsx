// features/conseils/ConseilsPage.tsx
import { useState, useEffect, useRef, FC, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, Lightbulb, ChefHat, Play, Clock, Eye, Heart,
  Star, Search, X, Filter, ArrowRight, BookOpen,
} from 'lucide-react'
import { conseilApi, type Conseil, type ConseilCategory, type ConseilStatsResponse } from '@/api'

type SortOption = 'recent' | 'popular' | 'liked'

interface Meta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

// ── Palette e-Sup'M (orange vif #F5A623 / rouge #E02020 / blanc / fond chaud)
const BRAND = {
  orange: '#F5A623',
  red: '#E02020',
  dark: '#1C0F00',
  warm: '#FFF8F0',
  text: '#3D1F00',
  muted: '#9E7554',
}

const CATEGORIES = [
  {
    key: 'all',
    label: 'Tous',
    icon: BookOpen,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    active: 'bg-amber-500 text-white border-amber-500',
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    icon: Leaf,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    key: 'astuce',
    label: 'Astuces',
    icon: Lightbulb,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    active: 'bg-yellow-500 text-white border-yellow-500',
  },
  {
    key: 'recette',
    label: 'Recettes',
    icon: ChefHat,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    active: 'bg-orange-500 text-white border-orange-500',
  },
]

const CONTENT_TYPE_BADGE: Record<string, { label: string; bg: string }> = {
  text:  { label: 'Article', bg: 'bg-blue-100 text-blue-700' },
  video: { label: 'Vidéo',   bg: 'bg-purple-100 text-purple-700' },
  image: { label: 'Photo',   bg: 'bg-pink-100 text-pink-700' },
  mixed: { label: 'Mix',     bg: 'bg-teal-100 text-teal-700' },
}

const CATEGORY_BADGE: Record<string, { label: string; bg: string; icon: FC<{ className?: string }> }> = {
  nutrition: { label: 'Nutrition', bg: 'bg-emerald-100 text-emerald-700', icon: Leaf },
  astuce:    { label: 'Astuce',    bg: 'bg-amber-100 text-amber-700',     icon: Lightbulb },
  recette:   { label: 'Recette',   bg: 'bg-orange-100 text-orange-700',   icon: ChefHat },
}

// ── Carte conseil
const ConseilCard: FC<{ conseil: Conseil; index: number }> = ({ conseil, index }) => {
  const catBadge  = CATEGORY_BADGE[conseil.category]
  const typeBadge = CONTENT_TYPE_BADGE[conseil.content_type]
  const CatIcon   = catBadge?.icon ?? Leaf

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{
        boxShadow: '0 2px 12px rgba(28,15,0,0.07)',
        border: '1.5px solid rgba(245,166,35,0.15)',
        transition: 'box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 8px 32px rgba(245,166,35,0.18)'
        el.style.borderColor = 'rgba(245,166,35,0.5)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 2px 12px rgba(28,15,0,0.07)'
        el.style.borderColor = 'rgba(245,166,35,0.15)'
      }}
    >
      {/* Vignette */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}
      >
        {conseil.thumbnail_url ? (
          <img
            src={conseil.thumbnail_url}
            alt={conseil.title}
            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon className="w-14 h-14 opacity-25" style={{ color: BRAND.orange }} />
          </div>
        )}

        {/* Play overlay */}
        {conseil.content_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(245,166,35,0.92)' }}
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
            {conseil.video_duration && (
              <span className="absolute bottom-2 right-2 bg-black/65 text-white text-xs px-2 py-0.5 rounded-md font-mono">
                {conseil.video_duration}
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        {conseil.is_featured && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: BRAND.orange, color: '#fff' }}
          >
            <Star className="w-3 h-3" /> À la une
          </div>
        )}
        {typeBadge && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>
        )}
      </div>

      {/* Corps */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          {catBadge && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${catBadge.bg}`}>
              <CatIcon className="w-3 h-3" /> {catBadge.label}
            </span>
          )}
          {conseil.reading_time && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: BRAND.muted }}>
              <Clock className="w-3 h-3" /> {conseil.reading_time}
            </span>
          )}
        </div>

        <h3
          className="font-bold text-base leading-snug mb-1.5 line-clamp-2 transition-colors"
          style={{ color: BRAND.dark }}
          onMouseEnter={e => (e.currentTarget.style.color = BRAND.red)}
          onMouseLeave={e => (e.currentTarget.style.color = BRAND.dark)}
        >
          {conseil.title}
        </h3>

        {conseil.excerpt && (
          <p className="text-sm leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: BRAND.muted }}>
            {conseil.excerpt}
          </p>
        )}

        <div
          className="flex items-center justify-between mt-auto pt-3"
          style={{ borderTop: '1px solid rgba(245,166,35,0.15)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.muted }}>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {conseil.views.toLocaleString('fr-CI')}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> {conseil.likes.toLocaleString('fr-CI')}
            </span>
          </div>
          <Link
            to={`/conseils/${conseil.slug}`}
            className="flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2"
            style={{ color: BRAND.red }}
          >
            Lire <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

// ── Carte à la une
const FeaturedCard: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const catBadge = CATEGORY_BADGE[conseil.category]
  const CatIcon  = catBadge?.icon ?? Leaf

  return (
    <Link
      to={`/conseils/${conseil.slug}`}
      className="group relative rounded-2xl overflow-hidden block"
      style={{ aspectRatio: '4/3', boxShadow: '0 4px 20px rgba(28,15,0,0.12)' }}
    >
      {conseil.thumbnail_url ? (
        <img
          src={conseil.thumbnail_url}
          alt={conseil.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E02020 100%)' }}
        >
          <CatIcon className="w-20 h-20 text-white/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {conseil.content_type === 'video' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
          style={{ background: 'rgba(245,166,35,0.9)' }}
        >
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {catBadge && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${catBadge.bg}`}>
            <CatIcon className="w-3 h-3" /> {catBadge.label}
          </span>
        )}
        <h3 className="font-bold text-base leading-tight line-clamp-2 drop-shadow">{conseil.title}</h3>
      </div>
    </Link>
  )
}

// ── Skeleton
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border: '1.5px solid rgba(245,166,35,0.1)' }}>
    <div className="aspect-[16/9]" style={{ background: '#F5EDD8' }} />
    <div className="p-4 space-y-2.5">
      <div className="h-3 rounded-full w-1/3" style={{ background: '#F5EDD8' }} />
      <div className="h-4 rounded-full w-full" style={{ background: '#F5EDD8' }} />
      <div className="h-4 rounded-full w-2/3" style={{ background: '#F5EDD8' }} />
    </div>
  </div>
)

// ── Page principale
export default function ConseilsPage() {
  const [conseils, setConseils]       = useState<Conseil[]>([])
  const [featured, setFeatured]       = useState<Conseil[]>([])
  const [stats, setStats]             = useState<ConseilStatsResponse>({ all: 0, nutrition: 0, astuce: 0, recette: 0 })
  const [category, setCategory]       = useState<string>('all')
  const [search, setSearch]           = useState<string>('')
  const [sort, setSort]               = useState<SortOption>('recent')
  const [page, setPage]               = useState<number>(1)
  const [meta, setMeta]               = useState<Meta | null>(null)
  const [loading, setLoading]         = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    conseilApi.categoryStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    conseilApi.list({
      category: category !== 'all' ? (category as ConseilCategory) : undefined,
      search: search || undefined,
      sort,
      per_page: 12,
      page: 1,
    }).then(response => {
      setConseils(response.data.data)
      setMeta({
        current_page: response.data.current_page,
        from: response.data.from,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        to: response.data.to,
        total: response.data.total,
        next_page_url: response.data.next_page_url,
        prev_page_url: null,
      })
      setFeatured(response.featured ?? [])
    }).catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [category, search, sort])

  const loadMore = () => {
    if (!meta?.next_page_url || loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    conseilApi.list({
      category: category !== 'all' ? (category as ConseilCategory) : undefined,
      search: search || undefined,
      sort,
      per_page: 12,
      page: nextPage,
    }).then(r => {
      setConseils(prev => [...prev, ...r.data.data])
      setMeta(prev => ({
        current_page: r.data.current_page,
        from: r.data.from,
        last_page: r.data.last_page,
        per_page: r.data.per_page,
        to: r.data.to,
        total: r.data.total,
        next_page_url: r.data.next_page_url,
        prev_page_url: prev?.next_page_url ?? null,
      }))
      setPage(nextPage)
    }).catch(err => console.error(err))
      .finally(() => setLoadingMore(false))
  }

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setSearch(e.currentTarget.value)
  }

  const handleClearSearch = () => {
    setSearch('')
    if (searchRef.current) searchRef.current.value = ''
  }

  return (
    <div className="min-h-screen" style={{ background: BRAND.warm }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #E02020 0%, #F5A623 100%)' }}>
        <div className="container-app px-4 sm:px-6 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="max-w-xl">
            {/* Fil d'Ariane */}
            <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
              <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
              <span>/</span>
              <span className="text-white font-medium">Nos Conseils</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              Nutrition, astuces &amp; recettes
            </h1>
            <p className="text-white/85 text-base leading-relaxed">
              Des conseils concrets pour mieux manger, économiser et cuisiner au quotidien — sélectionnés pour vous.
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mt-8 max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: BRAND.muted }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Rechercher un conseil, une recette..."
                defaultValue={search}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white text-sm font-medium focus:outline-none"
                style={{
                  color: BRAND.dark,
                  boxShadow: '0 4px 20px rgba(28,15,0,0.18)',
                  border: '2px solid transparent',
                }}
                onFocus={e => (e.currentTarget.style.border = `2px solid ${BRAND.orange}`)}
                onBlur={e => (e.currentTarget.style.border = '2px solid transparent')}
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: BRAND.muted }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-app px-4 sm:px-6 py-8 max-w-5xl mx-auto">

        {/* ── À la une ── */}
        {featured.length > 0 && !search && category === 'all' && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ background: BRAND.red }} />
              <h2 className="text-xl font-black" style={{ color: BRAND.dark }}>À la une</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(c => <FeaturedCard key={c.id} conseil={c} />)}
            </div>
          </section>
        )}

        {/* ── Filtres ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const isActive = category === cat.key
              const count = cat.key === 'all' ? stats.all : stats[cat.key as ConseilCategory]
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${isActive ? cat.active : cat.color}`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                  {count !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-white'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: BRAND.muted }} />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="text-sm rounded-xl px-3 py-2 bg-white focus:outline-none"
              style={{
                color: BRAND.dark,
                border: `1.5px solid rgba(245,166,35,0.3)`,
              }}
            >
              <option value="recent">Plus récents</option>
              <option value="popular">Plus vus</option>
              <option value="liked">Plus aimés</option>
            </select>
          </div>
        </div>

        {/* ── Grille ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : conseils.length === 0 ? (
          <div className="text-center py-20" style={{ color: BRAND.muted }}>
            <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">Aucun conseil trouvé</p>
            <p className="text-sm mt-1 opacity-70">Essayez une autre catégorie ou un autre mot-clé.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="wait">
                {conseils.map((c, i) => <ConseilCard key={c.id} conseil={c} index={i} />)}
              </AnimatePresence>
            </div>

            {meta?.next_page_url && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{
                    background: loadingMore ? BRAND.muted : `linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.orange} 100%)`,
                    boxShadow: '0 4px 16px rgba(224,32,32,0.25)',
                  }}
                >
                  {loadingMore ? 'Chargement...' : 'Voir plus de conseils'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}