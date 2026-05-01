// pages/NouveautesPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, ChevronRight, Home, Package, Filter, 
  ArrowUpDown, Clock, Grid3x3, LayoutList, X,
  TrendingUp, ShoppingBag, ShoppingCart
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api'
import type { Product } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Pagination } from '@/components/data/Pagination'

// ============================================================
// STYLES
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .new-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .new-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .new-hero {
    background: linear-gradient(135deg, #e8820c 0%, #f59e0b 50%, #fbbf24 100%);
    position: relative;
    overflow: hidden;
  }
  .new-hero::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 1%, transparent 1%);
    background-size: 40px 40px;
    animation: new-shift 20s linear infinite;
  }
  @keyframes new-shift {
    from { transform: translate(0, 0); }
    to { transform: translate(40px, 40px); }
  }

  .new-product-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(139,94,60,0.1);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
  }
  .new-product-card:hover { transform: translateY(-5px); box-shadow: 0 14px 32px rgba(139,94,60,0.13); }
  .new-product-card .new-img { transition: transform 0.5s ease; }
  .new-product-card:hover .new-img { transform: scale(1.07); }

  .new-filter-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(232,130,12,0.12); color: #c2410c;
    border: 1px solid rgba(232,130,12,0.25);
    cursor: pointer; transition: background 0.15s;
  }
  .new-filter-chip:hover { background: rgba(232,130,12,0.2); }

  .new-select {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px; font-weight: 600;
    color: #1a1209; background: white;
    border: 1.5px solid rgba(139,94,60,0.2);
    border-radius: 12px; padding: 8px 12px;
    cursor: pointer; outline: none;
    appearance: none; padding-right: 32px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5e3c' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .new-select:focus { border-color: #e8820c; }

  .new-section-line { display: inline-block; position: relative; }
  .new-section-line::after {
    content: ''; position: absolute; bottom: -4px; left: 0;
    width: 35%; height: 3px; background: #e8820c; border-radius: 2px;
  }

  @keyframes newShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .new-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%; animation: newShimmer 1.4s infinite;
    border-radius: 10px;
  }
`

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Plus récents', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'price:asc', label: 'Prix croissant', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: 'price:desc', label: 'Prix décroissant', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: 'sales_count:desc', label: 'Les plus consultés', icon: <TrendingUp className="h-3.5 w-3.5" /> },
]

type ViewMode = 'grid' | 'list'

// ============================================================
// HELPERS
// ============================================================
function getProductImageUrl(product: Product): string | null {
  const p = product as any
  if (p.primary_image_url) return p.primary_image_url
  if (product.primary_image?.url) return product.primary_image.url
  if (product.primary_image?.path) return `/storage/${product.primary_image.path}`
  return null
}

function isInStock(product: Product): boolean {
  return (product as any).in_stock ?? product.stock > 0
}

function getDiscount(product: Product): number | null {
  if ((product as any).discount_percentage) return (product as any).discount_percentage
  if (!product.compare_price || product.compare_price <= product.price) return null
  return Math.round((1 - product.price / product.compare_price) * 100)
}

// ============================================================
// PRODUCT CARD
// ============================================================
function NewProductCard({ product, index, viewMode }: { product: Product; index: number; viewMode: ViewMode }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const rp = product as any

  const imgUrl = getProductImageUrl(product)
  const inStock = isInStock(product)
  const discount = getDiscount(product)

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.35 }}
        className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 hover:shadow-md transition cursor-pointer"
        onClick={() => navigate(`/produit/${rp.slug ?? product.id}`)}
      >
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-stone-300" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {product.category?.name ?? rp.brand ?? 'Nouveauté'}
          </p>
          <h3 className="font-bold text-stone-800 mt-0.5">{product.name}</h3>
          <p className="text-sm text-stone-500 mt-1 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
              {discount && (
                <span className="ml-2 text-xs text-stone-400 line-through">{formatCurrency(product.compare_price!)}</span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if (inStock) addItem({ productId: product.id, quantity: 1 }) }}
              disabled={!inStock}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition disabled:opacity-40"
            >
              Ajouter
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="new-product-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.028, duration: 0.35 }}
      onClick={() => navigate(`/produit/${rp.slug ?? product.id}`)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: '#f5efe6' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="new-img w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-stone-300" />
          </div>
        )}
        {discount && (
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center bg-red-600">
            <span className="text-[10px] font-black text-white">-{discount}%</span>
          </div>
        )}
        {product.is_new && !discount && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-orange-500 text-white text-[9px] font-bold">
            Nouveau
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider truncate text-stone-400">
          {product.category?.name ?? rp.brand ?? ''}
        </p>
        <h3 className="text-xs font-semibold line-clamp-2 leading-snug text-stone-800 mt-0.5">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2.5">
          <p className="font-black text-sm text-stone-800">{formatCurrency(product.price)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); if (inStock) addItem({ productId: product.id, quantity: 1 }) }}
            disabled={!inStock}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500 text-white shadow-md hover:bg-orange-600 transition disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// SKELETON
// ============================================================
function SkeletonCard() {
  return (
    <div className="new-product-card" style={{ pointerEvents: 'none' }}>
      <div className="new-skeleton" style={{ aspectRatio: '4/3' }} />
      <div className="p-3 space-y-2">
        <div className="new-skeleton h-2.5 w-16 rounded" />
        <div className="new-skeleton h-3.5 w-full rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="new-skeleton h-4 w-20 rounded" />
          <div className="new-skeleton w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function NouveautesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [sortValue, setSortValue] = useState('created_at:desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null })
  const [showFilters, setShowFilters] = useState(false)

  const [sortField, sortDir] = sortValue.split(':')

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals', page, sortField, sortDir, priceRange.min, priceRange.max],
    queryFn: async () => {
      const params: any = {
        page,
        per_page: 20,
        sort: sortField,
        direction: sortDir,
        is_new: true,
      }
      if (priceRange.min) params.min_price = priceRange.min
      if (priceRange.max) params.max_price = priceRange.max
      return productApi.list(params)
    },
    keepPreviousData: true,
  })

  const products: Product[] = data?.data ?? []
  const total = data?.total ?? 0
  const lastPage = data?.last_page ?? 1

  const activeFiltersCount = [priceRange.min, priceRange.max].filter(Boolean).length

  const resetFilters = () => {
    setPriceRange({ min: null, max: null })
    setPage(1)
  }

  return (
    <div className="new-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* Hero Section */}
      <div className="new-hero relative py-12 md:py-20">
        <div className="container-app relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Dernières arrivées</span>
            </div>
            <h1 className="new-font-display font-black text-4xl md:text-5xl lg:text-6xl mb-4">
              Nos Nouveautés
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Découvrez les derniers produits sélectionnés pour vous.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-app px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6 text-stone-500">
          <Link to="/" className="flex items-center gap-1 hover:text-orange-600 transition">
            <Home className="h-3 w-3" /> Accueil
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-semibold text-stone-800">Nouveautés</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="new-font-display new-section-line font-black text-2xl sm:text-3xl text-stone-800">
              Nouveautés
            </h1>
            <p className="text-sm text-stone-500 mt-2">{total} produit{total !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${showFilters || activeFiltersCount > 0 ? 'bg-orange-500 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-white/30">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View mode */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-stone-400'}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-stone-400'}`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>

            {/* Sort select */}
            <select value={sortValue} onChange={e => { setSortValue(e.target.value); setPage(1) }} className="new-select">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl p-5 border border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800">Filtres</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg hover:bg-stone-100">
                    <X className="h-4 w-4 text-stone-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-2">Prix minimum (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:outline-none"
                      value={priceRange.min ?? ''}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-2">Prix maximum (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:outline-none"
                      value={priceRange.max ?? ''}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters} className="mt-4 text-sm text-red-500 font-semibold flex items-center gap-1">
                    <X className="h-3 w-3" /> Réinitialiser
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters chips */}
        {(priceRange.min || priceRange.max) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {priceRange.min && (
              <span className="new-filter-chip">Min {priceRange.min} FCFA <X className="h-2.5 w-2.5" onClick={() => setPriceRange({ ...priceRange, min: null })} /></span>
            )}
            {priceRange.max && (
              <span className="new-filter-chip">Max {priceRange.max} FCFA <X className="h-2.5 w-2.5" onClick={() => setPriceRange({ ...priceRange, max: null })} /></span>
            )}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"}>
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-stone-300" />
            </div>
            <p className="text-stone-500">Aucune nouveauté pour le moment</p>
            <button onClick={() => navigate('/catalogue')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
              Voir le catalogue
            </button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"}>
              {products.map((product, i) => (
                <NewProductCard key={product.id} product={product} index={i} viewMode={viewMode} />
              ))}
            </div>
            {lastPage > 1 && (
              <div className="mt-10">
                <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}