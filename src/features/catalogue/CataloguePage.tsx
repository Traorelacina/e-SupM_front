import { useState, useCallback } from 'react'
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ShoppingCart, Star, Clock, Search, ChevronRight, Home, Leaf, MapPin, Flame, Sparkles, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productApi, categoryApi, storageUrl } from '@/api'
import type { PaginatedResponse, Product } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/data/Pagination'
import { EmptyState } from '@/components/data/EmptyState'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// ============================================================
// STYLES
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .cat-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .cat-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  /* Skeleton */
  @keyframes catShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .cat-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%;
    animation: catShimmer 1.4s infinite;
    border-radius: 10px;
  }

  /* Product card */
  .cat-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(139,94,60,0.1);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
  }
  .cat-card:hover { transform: translateY(-5px); box-shadow: 0 14px 32px rgba(139,94,60,0.13); }
  .cat-card .cat-card-img { transition: transform 0.5s ease; }
  .cat-card:hover .cat-card-img { transform: scale(1.07); }

  /* Filter panel */
  .cat-filter-panel {
    background: white;
    border: 1px solid rgba(139,94,60,0.12);
    border-radius: 18px;
    padding: 20px;
  }

  /* Checkbox custom */
  .cat-checkbox {
    width: 16px; height: 16px;
    accent-color: #e8820c;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Sort select */
  .cat-select {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #1a1209;
    background: white;
    border: 1.5px solid rgba(139,94,60,0.2);
    border-radius: 12px;
    padding: 8px 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    appearance: none;
    padding-right: 32px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5e3c' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .cat-select:focus { border-color: #e8820c; }

  /* Price input */
  .cat-input {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px;
    color: #1a1209;
    background: #faf7f2;
    border: 1.5px solid rgba(139,94,60,0.18);
    border-radius: 10px;
    padding: 7px 10px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
  }
  .cat-input:focus { border-color: #e8820c; background: white; }
  .cat-input::placeholder { color: rgba(139,94,60,0.4); }

  /* Section line */
  .cat-section-line { display:inline-block; position:relative; }
  .cat-section-line::after {
    content:''; position:absolute; bottom:-4px; left:0;
    width:35%; height:3px; background:#e8820c; border-radius:2px;
  }

  /* Scrollbar hide */
  .cat-hide-scroll::-webkit-scrollbar { display: none; }
  .cat-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  /* Active filter chip */
  .cat-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; font-family: 'DM Sans', system-ui, sans-serif;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(232,130,12,0.12); color: #c2410c;
    border: 1px solid rgba(232,130,12,0.25);
    cursor: pointer; transition: background 0.15s;
  }
  .cat-chip:hover { background: rgba(232,130,12,0.2); }

  @media (max-width: 639px) {
    .cat-filter-panel { border-radius: 0; border-left: 0; border-right: 0; border-bottom: 0; }
  }
`

// ============================================================
// SORT OPTIONS
// ============================================================
const SORT_OPTIONS = [
  { value: 'created_at:desc',     label: 'Plus récents' },
  { value: 'price:asc',           label: 'Prix croissant' },
  { value: 'price:desc',          label: 'Prix décroissant' },
  { value: 'sales_count:desc',    label: 'Meilleures ventes' },
  { value: 'average_rating:desc', label: 'Mieux notés' },
]

// ============================================================
// HELPERS
// ============================================================
function getProductImageUrl(product: Product): string | null {
  const p = product as any
  if (p.primary_image_url) return p.primary_image_url
  if (product.primary_image?.url) return product.primary_image.url
  if (product.primary_image?.path) return storageUrl(product.primary_image.path)
  return null
}

function isInStock(product: Product): boolean {
  return (product as any).in_stock ?? product.stock > 0
}

function getDiscount(product: Product): number | null {
  const p = product as any
  if (p.discount_percentage) return p.discount_percentage
  if (!product.compare_price || product.compare_price <= product.price) return null
  return Math.round((1 - product.price / product.compare_price) * 100)
}

function getExpiryDate(product: Product): string | null {
  return (product as any).expiry_date ?? null
}

function isExpiringSoon(product: Product): boolean {
  return (product as any).is_expiring_soon ?? false
}

function isExpired(product: Product): boolean {
  return (product as any).is_expired ?? false
}

function getDaysUntilExpiry(product: Product): number | null {
  const expiryDate = getExpiryDate(product)
  if (expiryDate) {
    const diffMs = new Date(expiryDate).getTime() - Date.now()
    return diffMs <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }
  const raw = (product as any).days_until_expiry
  if (typeof raw === 'number' && raw > 0) return Math.round(raw)
  return null
}

function formatExpiryBadgeLabel(days: number | null): string | null {
  if (days === null) return null
  if (days === 0) return "Expire aujourd'hui"
  if (days === 1) return 'Expire demain'
  return `Expire dans ${days}j`
}

function expiryBadgeColor(days: number | null): { bg: string; color: string; border: string } {
  if (days === null || days <= 3)  return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  if (days <= 7)                   return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
  return                                  { bg: '#fffbeb', color: '#92400e', border: '#fde68a' }
}

// ============================================================
// PRODUCT CARD
// ============================================================
function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const rp = product as any

  const imgUrl      = getProductImageUrl(product)
  const inStock     = isInStock(product)
  const discount    = getDiscount(product)
  const expired     = isExpired(product)
  const expSoon     = isExpiringSoon(product)
  const days        = getDaysUntilExpiry(product)
  const expiryLabel = formatExpiryBadgeLabel(days)
  const expiryColor = expiryBadgeColor(days)

  return (
    <motion.div
      className="cat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.028, duration: 0.35 }}
      onClick={() => navigate(`/produit/${rp.slug ?? product.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: '#f5efe6' }}>
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={product.name}
            className="cat-card-img w-full h-full object-cover"
            style={{ opacity: expired ? 0.35 : 1 }} 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-stone-300" />
          </div>
        )}

        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(0,0,0,0.52)' }}>
            <span className="cat-font-body text-xs font-black px-3 py-1.5 rounded-full"
              style={{ background: '#dc2626', color: 'white' }}>EXPIRÉ</span>
          </div>
        )}

        {/* Discount badge */}
        {discount && !expired && (
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center z-10"
            style={{ background: '#dc2626' }}>
            <span className="cat-font-body text-[10px] font-black text-white">-{discount}%</span>
          </div>
        )}

        {/* Expiry badge */}
        {expSoon && !expired && expiryLabel && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: expiryColor.bg, color: expiryColor.color, border: `1px solid ${expiryColor.border}` }}>
            <Clock className="h-2.5 w-2.5 shrink-0" />
            <span className="cat-font-body text-[9px] font-bold">{expiryLabel}</span>
          </div>
        )}

        {/* Top-left labels (bio / local / new) */}
        {!expired && !expSoon && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.is_bio && (
              <span className="cat-font-body text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                style={{ background: '#16a34a', color: 'white' }}>
                <Leaf className="h-2 w-2" />Bio
              </span>
            )}
            {(product as any).is_local && (
              <span className="cat-font-body text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#166534', color: 'white' }}>
                Local CI
              </span>
            )}
            {product.is_new && (
              <span className="cat-font-body text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#e8820c', color: 'white' }}>
                Nouveau
              </span>
            )}
          </div>
        )}

        {/* Out of stock overlay */}
        {!inStock && !expired && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.7)' }}>
            <span className="cat-font-body text-[10px] font-bold px-3 py-1 rounded-full"
              style={{ background: '#1a1209', color: 'white' }}>Épuisé</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="cat-font-body text-[9px] font-semibold uppercase tracking-wider truncate mb-0.5"
          style={{ color: '#8b5e3c', opacity: 0.65 }}>
          {product.category?.name ?? rp.brand ?? ''}
        </p>
        <h3 className="cat-font-body text-xs font-semibold line-clamp-2 leading-snug"
          style={{ color: '#1a1209' }}>
          {product.name}
        </h3>

        {rp.reviews_count > 0 && rp.average_rating !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-2.5 w-2.5 fill-current" style={{ color: '#e8820c' }} />
            <span className="cat-font-body text-[10px] font-bold" style={{ color: '#8b5e3c' }}>
              {(rp.average_rating as number).toFixed(1)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div>
            <p className="cat-font-display font-black text-sm" style={{ color: '#1a1209' }}>
              {formatCurrency(product.price)}
            </p>
            {product.compare_price && (
              <p className="cat-font-body text-[10px] line-through" style={{ color: '#8b5e3c', opacity: 0.5 }}>
                {formatCurrency(product.compare_price)}
              </p>
            )}
          </div>

          <button
            onClick={e => {
              e.stopPropagation()
              if (inStock && !expired) addItem({ productId: product.id, quantity: 1 })
            }}
            disabled={!inStock || expired}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
            style={inStock && !expired
              ? { background: '#e8820c', color: 'white', boxShadow: '0 2px 8px rgba(232,130,12,0.35)' }
              : { background: '#f5efe6', color: '#8b5e3c', opacity: 0.38, cursor: 'not-allowed' }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// CARD SKELETON
// ============================================================
function CatCardSkeleton() {
  return (
    <div className="cat-card" style={{ pointerEvents: 'none' }}>
      <div className="cat-skeleton" style={{ aspectRatio: '4/3' }} />
      <div className="p-3 space-y-2">
        <div className="cat-skeleton h-2.5 w-16 rounded" />
        <div className="cat-skeleton h-3.5 w-full rounded" />
        <div className="cat-skeleton h-3 w-3/4 rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="cat-skeleton h-4 w-20 rounded" />
          <div className="cat-skeleton w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FILTER PANEL
// ============================================================
function FilterPanel({ searchParams, setFilter, activeFiltersCount, onClose, onReset }: {
  searchParams: URLSearchParams
  setFilter: (k: string, v: string | null) => void
  activeFiltersCount: number
  onClose: () => void
  onReset: () => void
}) {
  return (
    <div className="cat-filter-panel">
      <div className="flex items-center justify-between mb-5">
        <h3 className="cat-font-display font-black text-base" style={{ color: '#1a1209' }}>Filtres</h3>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#faf7f2', color: '#8b5e3c' }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Type */}
      <div className="mb-5">
        <p className="cat-font-body text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#8b5e3c', opacity: 0.65 }}>Type de produit</p>
        <div className="space-y-2.5">
          {[
            { key: 'bio',   label: 'Bio', icon: <Leaf className="h-3 w-3" /> },
            { key: 'local', label: 'Local CI', icon: <MapPin className="h-3 w-3" /> },
            { key: 'promo', label: 'En promo', icon: <Flame className="h-3 w-3" /> },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox"
                className="cat-checkbox"
                checked={searchParams.get(key) === '1'}
                onChange={e => setFilter(key, e.target.checked ? '1' : null)}
              />
              <span className="cat-font-body text-sm font-medium group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                style={{ color: '#1a1209', opacity: 0.75 }}>
                {icon} {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div className="mb-5">
        <p className="cat-font-body text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#8b5e3c', opacity: 0.65 }}>Prix (FCFA)</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" className="cat-input"
            defaultValue={searchParams.get('min_price') ?? ''}
            onChange={e => setFilter('min_price', e.target.value || null)} />
          <span style={{ color: '#8b5e3c', opacity: 0.4, fontSize: 12, fontWeight: 700 }}>–</span>
          <input type="number" placeholder="Max" className="cat-input"
            defaultValue={searchParams.get('max_price') ?? ''}
            onChange={e => setFilter('max_price', e.target.value || null)} />
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button onClick={onReset}
          className="cat-font-body w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <X className="h-3.5 w-3.5" />
          Réinitialiser ({activeFiltersCount})
        </button>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug: categorySlug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage]               = useState(1)
  const [sortValue, setSortValue]     = useState('created_at:desc')

  const filters = {
    q:         searchParams.get('q')         ?? undefined,
    category:  categorySlug,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    is_bio:    searchParams.get('bio')   === '1' ? true : undefined,
    is_local:  searchParams.get('local') === '1' ? true : undefined,
    in_promo:  searchParams.get('promo') === '1' ? true : undefined,
    sort:      searchParams.get('sort')  ?? 'created_at',
    direction: searchParams.get('dir')   ?? 'desc',
    page,
    per_page: 20,
  }

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', filters],
    queryFn: () => productApi.list(filters),
    keepPreviousData: true,
  })

  const { data: category } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => categoryApi.get(categorySlug!),
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

  const handleSort = (val: string) => {
    setSortValue(val)
    const [s, d] = val.split(':')
    setFilter('sort', s)
    setFilter('dir', d)
  }

  const handleReset = () => { setSearchParams({}); setPage(1) }

  const activeFiltersCount = [
    filters.is_bio, filters.is_local, filters.in_promo,
    filters.min_price, filters.max_price,
  ].filter(Boolean).length

  const products: Product[] = data?.data ?? []
  const total    = data?.total ?? 0
  const lastPage = data?.last_page ?? 1

  // Active filter chips for display
  const activeChips: { label: string; key: string }[] = []
  if (filters.is_bio)   activeChips.push({ label: 'Bio', key: 'bio' })
  if (filters.is_local) activeChips.push({ label: 'Local CI', key: 'local' })
  if (filters.in_promo) activeChips.push({ label: 'En promo', key: 'promo' })
  if (filters.min_price) activeChips.push({ label: `Min ${filters.min_price} FCFA`, key: 'min_price' })
  if (filters.max_price) activeChips.push({ label: `Max ${filters.max_price} FCFA`, key: 'max_price' })

  return (
    <div className="cat-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="container-app py-5 sm:py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap mb-5"
          style={{ color: '#8b5e3c', opacity: 0.75 }}>
          <Link to="/" className="flex items-center gap-1 hover:opacity-100 transition-opacity">
            <Home className="h-3 w-3" /> Accueil
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          {categorySlug ? (
            <>
              <Link to="/rayons" className="hover:opacity-100 transition-opacity">Rayons</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="font-bold" style={{ color: '#1a1209', opacity: 1 }}>
                {category?.name ?? categorySlug}
              </span>
            </>
          ) : (
            <span className="font-bold" style={{ color: '#1a1209', opacity: 1 }}>
              {filters.q ? `Résultats pour "${filters.q}"` : 'Catalogue'}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="cat-font-display cat-section-line font-black"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: '#1a1209' }}>
              {category?.name ?? (filters.q ? `"${filters.q}"` : 'Tous les produits')}
            </h1>
            {data && (
              <p className="cat-font-body text-sm mt-2" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                {total.toLocaleString('fr-CI')} produit{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <select value={sortValue} onChange={e => handleSort(e.target.value)} className="cat-select">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button
              onClick={() => setFiltersOpen(v => !v)}
              className="cat-font-body flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              style={filtersOpen || activeFiltersCount > 0
                ? { background: '#e8820c', color: 'white', boxShadow: '0 2px 8px rgba(232,130,12,0.3)' }
                : { background: 'white', color: '#1a1209', border: '1.5px solid rgba(139,94,60,0.2)' }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: 'rgba(255,255,255,0.3)' }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-5">
              {activeChips.map(chip => (
                <button key={chip.key} className="cat-chip" onClick={() => setFilter(chip.key, null)}>
                  {chip.label} <X className="h-2.5 w-2.5" />
                </button>
              ))}
              <button className="cat-chip" onClick={handleReset}
                style={{ background: '#fef2f2', color: '#dc2626', borderColor: 'rgba(220,38,38,0.2)' }}>
                Tout effacer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-5 items-start">

          {/* Filter panel — desktop sidebar / mobile top panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                key="filter-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="hidden sm:block shrink-0"
                style={{ width: 220 }}
              >
                <div className="sticky top-24">
                  <FilterPanel
                    searchParams={searchParams}
                    setFilter={setFilter}
                    activeFiltersCount={activeFiltersCount}
                    onClose={() => setFiltersOpen(false)}
                    onReset={handleReset}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile filter panel — inline above grid */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                key="filter-mobile"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="block sm:hidden w-full mb-4 overflow-hidden"
              >
                <FilterPanel
                  searchParams={searchParams}
                  setFilter={setFilter}
                  activeFiltersCount={activeFiltersCount}
                  onClose={() => setFiltersOpen(false)}
                  onReset={handleReset}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array(12).fill(0).map((_, i) => <CatCardSkeleton key={i} />)}
              </div>
            ) : !products.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background: '#f5efe6' }}>
                  <Search className="h-8 w-8 text-stone-400" />
                </div>
                <h3 className="cat-font-display font-black text-xl mb-2" style={{ color: '#1a1209' }}>
                  Aucun produit trouvé
                </h3>
                <p className="cat-font-body text-sm mb-6" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                  Essayez d'autres filtres ou cherchez un autre terme.
                </p>
                <button onClick={handleReset}
                  className="cat-font-body font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-105"
                  style={{ background: '#e8820c', color: 'white', boxShadow: '0 4px 14px rgba(232,130,12,0.35)' }}>
                  Voir tous les produits
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {lastPage > 1 && (
                  <div className="mt-10">
                    <Pagination
                      currentPage={page}
                      totalPages={lastPage}
                      onPageChange={p => {
                        setPage(p)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}