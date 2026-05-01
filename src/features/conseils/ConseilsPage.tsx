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

const CATEGORIES = [
  { key: 'all', label: 'Tous', icon: BookOpen, color: 'bg-stone-100 text-stone-700 border-stone-200', active: 'bg-green-700 text-white border-green-700' },
  { key: 'nutrition', label: 'Nutrition', icon: Leaf, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
  { key: 'astuce', label: 'Astuce', icon: Lightbulb, color: 'bg-amber-50 text-amber-700 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
  { key: 'recette', label: 'Recette', icon: ChefHat, color: 'bg-orange-50 text-orange-700 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
]

const CONTENT_TYPE_BADGE = {
  text:  { label: 'Article', bg: 'bg-blue-100 text-blue-700' },
  video: { label: 'Vidéo',   bg: 'bg-purple-100 text-purple-700' },
  image: { label: 'Photo',   bg: 'bg-pink-100 text-pink-700' },
  mixed: { label: 'Mix',     bg: 'bg-teal-100 text-teal-700' },
}

const CATEGORY_BADGE = {
  nutrition: { label: 'Nutrition', bg: 'bg-emerald-100 text-emerald-700', icon: Leaf },
  astuce:    { label: 'Astuce',    bg: 'bg-amber-100 text-amber-700',   icon: Lightbulb },
  recette:   { label: 'Recette',   bg: 'bg-orange-100 text-orange-700', icon: ChefHat },
}

const ConseilCard: FC<{ conseil: Conseil; index: number }> = ({ conseil, index }) => {
  const catBadge  = CATEGORY_BADGE[conseil.category]
  const typeBadge = CONTENT_TYPE_BADGE[conseil.content_type]
  const CatIcon   = catBadge?.icon ?? Leaf

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-100 hover:border-green-200 transition-all duration-300 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-[16/9] bg-gradient-to-br from-green-50 to-emerald-100 flex-shrink-0">
        {conseil.thumbnail_url ? (
          <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon className="w-16 h-16 text-green-300" />
          </div>
        )}
        {conseil.content_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-green-700 ml-1" />
            </div>
            {conseil.video_duration && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-mono">{conseil.video_duration}</span>
            )}
          </div>
        )}
        {conseil.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3" /> À la une
          </div>
        )}
        {typeBadge && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge.bg}`}>{typeBadge.label}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          {catBadge && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${catBadge.bg}`}>
              <CatIcon className="w-3 h-3" />{catBadge.label}
            </span>
          )}
          {conseil.reading_time && (
            <span className="text-xs text-stone-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {conseil.reading_time}
            </span>
          )}
        </div>

        <h3 className="font-bold text-stone-900 text-base leading-snug mb-1.5 group-hover:text-green-700 transition-colors line-clamp-2">{conseil.title}</h3>
        {conseil.excerpt && <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-3 flex-1">{conseil.excerpt}</p>}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {conseil.views.toLocaleString('fr-CI')}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {conseil.likes.toLocaleString('fr-CI')}</span>
          </div>
          <Link to={`/conseils/${conseil.slug}`} className="flex items-center gap-1 text-green-700 text-sm font-semibold hover:gap-2 transition-all">
            Lire <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

const FeaturedCard: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const catBadge = CATEGORY_BADGE[conseil.category]
  const CatIcon  = catBadge?.icon ?? Leaf

  return (
    <Link to={`/conseils/${conseil.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[4/3] block shadow-md hover:shadow-xl transition-shadow">
      {conseil.thumbnail_url ? (
        <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center">
          <CatIcon className="w-20 h-20 text-white/50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {conseil.content_type === 'video' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 text-green-700 ml-1" />
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
    conseilApi.categoryStats()
      .then(r => setStats(r.data))
      .catch(() => {})
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
    <div className="min-h-screen bg-stone-50">
      <div className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white">
        <div className="container-app px-4 sm:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3 text-green-300 text-sm font-semibold">
              <Leaf className="w-4 h-4" /> Nos Conseils
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
              Nutrition, astuces & recettes
            </h1>
            <p className="text-green-200 text-base leading-relaxed">
              Découvrez nos conseils pratiques pour mieux manger, économiser et cuisiner facilement au quotidien.
            </p>
          </div>
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Rechercher un conseil, une recette..."
                defaultValue={search}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white text-stone-900 placeholder-stone-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-app px-4 sm:px-6 py-8">
        {featured.length > 0 && !search && category === 'all' && (
          <section className="mb-10">
            <h2 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> À la une
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(c => <FeaturedCard key={c.id} conseil={c} />)}
            </div>
          </section>
        )}

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
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="recent">Plus récents</option>
              <option value="popular">Plus vus</option>
              <option value="liked">Plus aimés</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-full" />
                  <div className="h-4 bg-stone-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conseils.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">Aucun conseil trouvé</p>
            <p className="text-sm mt-1">Essayez une autre catégorie ou un autre mot-clé.</p>
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
                  className="px-8 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors shadow"
                >
                  {loadingMore ? 'Chargement…' : 'Voir plus de conseils'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}