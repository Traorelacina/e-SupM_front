import { useState, useCallback } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, ShoppingCart, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productApi, categoryApi } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency, debounce, RAYON_EMOJIS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/data/Pagination'
import { EmptyState } from '@/components/data/EmptyState'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useNavigate } from 'react-router-dom'
import type { ProductFilters } from '@/types'

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Plus récents' },
  { value: 'price:asc',       label: 'Prix croissant' },
  { value: 'price:desc',      label: 'Prix décroissant' },
  { value: 'sales_count:desc',label: 'Meilleures ventes' },
  { value: 'average_rating:desc', label: 'Mieux notés' },
]

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug: categorySlug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const filters: ProductFilters = {
    q:          searchParams.get('q') ?? undefined,
    category:   categorySlug,
    min_price:  searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price:  searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    is_bio:     searchParams.get('bio') === '1' ? true : undefined,
    is_local:   searchParams.get('local') === '1' ? true : undefined,
    in_promo:   searchParams.get('promo') === '1' ? true : undefined,
    sort:       (searchParams.get('sort') as ProductFilters['sort']) ?? 'created_at',
    direction:  (searchParams.get('dir') as ProductFilters['direction']) ?? 'desc',
    page,
    per_page: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.list(filters).then(r => r.data),
    keepPreviousData: true,
  } as Parameters<typeof useQuery>[0])

  const { data: category } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => categoryApi.get(categorySlug!).then(r => r.data),
    enabled: !!categorySlug,
  })

  const setFilter = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === null) next.delete(key)
      else next.set(key, value)
      return next
    })
    setPage(1)
  }, [setSearchParams])

  const [sortValue, setSortValue] = useState('created_at:desc')
  const handleSort = (val: string) => {
    setSortValue(val)
    const [s, d] = val.split(':')
    setFilter('sort', s)
    setFilter('dir', d)
  }

  const activeFiltersCount = [
    filters.is_bio, filters.is_local, filters.in_promo,
    filters.min_price, filters.max_price,
  ].filter(Boolean).length

  return (
    <div className="py-8">
      <div className="container-app">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <Link to="/" className="hover:text-brand-orange">Accueil</Link>
            <span>/</span>
            {categorySlug ? (
              <>
                <Link to="/rayons" className="hover:text-brand-orange">Rayons</Link>
                <span>/</span>
                <span className="text-stone-900 font-semibold">{category?.name ?? categorySlug}</span>
              </>
            ) : (
              <span className="text-stone-900 font-semibold">
                {filters.q ? `Résultats pour "${filters.q}"` : 'Catalogue'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="section-title flex items-center gap-2">
                {category && <span className="text-2xl">{RAYON_EMOJIS[category.slug] ?? '🛒'}</span>}
                {category?.name ?? (filters.q ? `"${filters.q}"` : 'Tous les produits')}
              </h1>
              {data && (
                <p className="text-stone-500 text-sm mt-1">
                  {data.meta.total.toLocaleString('fr-CI')} produit{data.meta.total !== 1 ? 's' : ''} trouvé{data.meta.total !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortValue}
                onChange={e => handleSort(e.target.value)}
                className="input-base !py-2 w-44 text-sm pr-8 cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Filter Toggle */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              >
                Filtres {activeFiltersCount > 0 && <Badge variant="orange">{activeFiltersCount}</Badge>}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 overflow-hidden"
              >
                <div className="w-60 space-y-5 sticky top-24">
                  <div className="card p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900">Filtres</h3>
                      <button onClick={() => setFiltersOpen(false)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quick filters */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Type de produit</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'bio', label: '🌿 Bio', param: 'bio' },
                          { key: 'local', label: '🇨🇮 Local', param: 'local' },
                          { key: 'promo', label: '🔥 En promo', param: 'promo' },
                        ].map(({ key, label, param }) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={searchParams.get(param) === '1'}
                              onChange={e => setFilter(param, e.target.checked ? '1' : null)}
                              className="w-4 h-4 accent-brand-orange rounded"
                            />
                            <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price range */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Prix (FCFA)</h4>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Min"
                          defaultValue={filters.min_price}
                          onChange={debounce(e => setFilter('min_price', e.target.value || null), 500)}
                          className="input-base !py-2 text-sm"
                        />
                        <span className="text-stone-400">–</span>
                        <input
                          type="number"
                          placeholder="Max"
                          defaultValue={filters.max_price}
                          onChange={debounce(e => setFilter('max_price', e.target.value || null), 500)}
                          className="input-base !py-2 text-sm"
                        />
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={() => { setSearchParams({}); setPage(1) }}
                        leftIcon={<X className="h-4 w-4" />}
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : !data?.data?.length ? (
              <EmptyState
                emoji="🔍"
                title="Aucun produit trouvé"
                description="Essayez d'autres filtres ou cherchez un autre terme."
                action={<Button variant="orange" onClick={() => { setSearchParams({}); setPage(1) }}>Voir tous les produits</Button>}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.data.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="card-hover overflow-hidden group cursor-pointer"
                      onClick={() => navigate(`/produit/${product.slug}`)}
                    >
                      <div className="relative aspect-square bg-stone-50 overflow-hidden">
                        {product.primary_image_url ? (
                          <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                        )}
                        {product.discount_percentage && (
                          <div className="absolute top-2 right-2 w-9 h-9 bg-brand-red text-white rounded-full flex items-center justify-center text-xs font-black">
                            -{product.discount_percentage}%
                          </div>
                        )}
                        {product.is_bio && <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Bio</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-stone-400 mb-1 uppercase tracking-wider truncate">{product.category?.name ?? product.brand ?? ''}</p>
                        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug">{product.name}</h3>
                        {product.reviews_count > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-brand-orange fill-brand-orange" />
                            <span className="text-xs font-semibold">{product.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="font-black text-stone-900 text-sm">{formatCurrency(product.price)}</p>
                            {product.compare_price && <p className="text-xs text-stone-400 line-through">{formatCurrency(product.compare_price)}</p>}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); product.in_stock && addItem({ productId: product.id, quantity: 1 }) }}
                            disabled={!product.in_stock}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${product.in_stock ? 'bg-brand-orange hover:bg-brand-orange-dark text-stone-900 shadow-brand' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {data.meta.last_page > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={data.meta.last_page}
                    onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="mt-8"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
