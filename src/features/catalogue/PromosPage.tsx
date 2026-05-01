// pages/PromosPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Percent, Tag, Flame, Timer, Zap, ChevronRight, 
  ShoppingCart, Clock, Home, Package, Filter,
  ArrowUpDown, Grid3x3, LayoutList, X, TrendingUp,
  Gift, Shield, Truck
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { promotionApi } from '@/api'
import type { Product } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'

// ============================================================
// STYLES
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .promo-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .promo-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .promo-hero {
    background: linear-gradient(135deg, #e8820c 0%, #f59e0b 50%, #fbbf24 100%);
    position: relative;
    overflow: hidden;
  }
  .promo-hero::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 1%, transparent 1%);
    background-size: 40px 40px;
    animation: promo-shift 20s linear infinite;
  }
  @keyframes promo-shift {
    from { transform: translate(0, 0); }
    to { transform: translate(40px, 40px); }
  }

  .promo-tab {
    padding: 10px 20px;
    border-radius: 60px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
    cursor: pointer;
    background: white;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }
  .promo-tab.active {
    background: #e8820c;
    border-color: #e8820c;
    color: white;
  }

  .promo-product-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(139,94,60,0.1);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s, box-shadow 0.22s;
  }
  .promo-product-card:hover { transform: translateY(-5px); box-shadow: 0 14px 32px rgba(139,94,60,0.13); }
  .promo-product-card .promo-img { transition: transform 0.5s ease; }
  .promo-product-card:hover .promo-img { transform: scale(1.07); }

  .promo-select {
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

  .promo-section-line { display: inline-block; position: relative; }
  .promo-section-line::after {
    content: ''; position: absolute; bottom: -4px; left: 0;
    width: 35%; height: 3px; background: #e8820c; border-radius: 2px;
  }

  @keyframes promoSkeleton { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .promo-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%; animation: promoSkeleton 1.4s infinite;
    border-radius: 10px;
  }
`

type PromoType = 'all' | 'soldes' | 'flash' | 'destockage'
type ViewMode = 'grid' | 'list'

const PROMO_TABS: { value: PromoType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Toutes les offres', icon: <Percent className="h-4 w-4" /> },
  { value: 'soldes', label: 'Soldes', icon: <Tag className="h-4 w-4" /> },
  { value: 'flash', label: 'Flash', icon: <Timer className="h-4 w-4" /> },
  { value: 'destockage', label: 'Déstockage', icon: <Flame className="h-4 w-4" /> },
]

const SORT_OPTIONS = [
  { value: 'discount_desc', label: 'Meilleure réduction', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'price:asc', label: 'Prix croissant', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: 'price:desc', label: 'Prix décroissant', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: 'newest', label: 'Plus récents', icon: <Clock className="h-3.5 w-3.5" /> },
]

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

function getDiscountPercent(product: Product): number | null {
  if ((product as any).discount_percentage) return (product as any).discount_percentage
  if (!product.compare_price || product.compare_price <= product.price) return null
  return Math.round((1 - product.price / product.compare_price) * 100)
}

// ============================================================
// PRODUCT CARD
// ============================================================
function PromoProductCard({ product, index, viewMode, promoType }: { product: Product; index: number; viewMode: ViewMode; promoType: string }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const imgUrl = getProductImageUrl(product)
  const discount = getDiscountPercent(product)
  const inStock = (product as any).in_stock ?? product.stock > 0

  const getBadgeColor = () => {
    if (promoType === 'flash') return 'bg-red-500'
    if (promoType === 'soldes') return 'bg-orange-500'
    if (promoType === 'destockage') return 'bg-orange-600'
    return discount ? 'bg-red-500' : 'bg-orange-500'
  }

  const getBadgeIcon = () => {
    if (promoType === 'flash') return <Zap className="h-3 w-3" />
    if (promoType === 'soldes') return <Tag className="h-3 w-3" />
    if (promoType === 'destockage') return <Flame className="h-3 w-3" />
    return <Percent className="h-3 w-3" />
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 hover:shadow-md transition cursor-pointer"
        onClick={() => navigate(`/produit/${(product as any).slug ?? product.id}`)}
      >
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-stone-300" /></div>
          )}
          {discount && (
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold bg-red-500">-{discount}%</div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{product.category?.name}</p>
          <h3 className="font-bold text-stone-800">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
            {product.compare_price && <span className="text-xs text-stone-400 line-through">{formatCurrency(product.compare_price)}</span>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (inStock) addItem({ productId: product.id, quantity: 1 }) }}
            className="mt-2 px-4 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition"
          >
            Ajouter au panier
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="promo-product-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.028 }}
      onClick={() => navigate(`/produit/${(product as any).slug ?? product.id}`)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: '#f5efe6' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="promo-img w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-stone-300" /></div>
        )}
        {discount && (
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center bg-red-600">
            <span className="text-[10px] font-black text-white">-{discount}%</span>
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[9px] font-bold flex items-center gap-1 ${getBadgeColor()}`}>
          {getBadgeIcon()} {promoType === 'flash' ? 'FLASH' : promoType === 'soldes' ? 'SOLDES' : promoType === 'destockage' ? 'DÉSTOCK' : 'PROMO'}
        </div>
      </div>
      <div className="p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider truncate text-stone-400">{product.category?.name}</p>
        <h3 className="text-xs font-semibold line-clamp-2 leading-snug text-stone-800">{product.name}</h3>
        <div className="flex items-center justify-between mt-2.5">
          <div>
            <p className="font-black text-sm text-stone-800">{formatCurrency(product.price)}</p>
            {product.compare_price && <p className="text-[9px] line-through text-stone-400">{formatCurrency(product.compare_price)}</p>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (inStock) addItem({ productId: product.id, quantity: 1 }) }}
            disabled={!inStock}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${inStock ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 transition' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
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
    <div className="promo-product-card" style={{ pointerEvents: 'none' }}>
      <div className="promo-skeleton" style={{ aspectRatio: '4/3' }} />
      <div className="p-3 space-y-2">
        <div className="promo-skeleton h-2.5 w-16 rounded" />
        <div className="promo-skeleton h-3.5 w-full rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="promo-skeleton h-4 w-20 rounded" />
          <div className="promo-skeleton w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function PromosPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PromoType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState('discount_desc')

  const { data: soldesData, isLoading: soldesLoading } = useQuery({
    queryKey: ['promotions', 'soldes'],
    queryFn: () => promotionApi.soldes(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: flashData, isLoading: flashLoading } = useQuery({
    queryKey: ['promotions', 'flash'],
    queryFn: () => promotionApi.flash(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: destockageData, isLoading: destockageLoading } = useQuery({
    queryKey: ['promotions', 'destockage'],
    queryFn: () => promotionApi.destockage(),
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = soldesLoading || flashLoading || destockageLoading

  const soldes: Product[] = Array.isArray(soldesData) ? soldesData : (soldesData as any)?.data ?? []
  const flash: Product[] = Array.isArray(flashData) ? flashData : (flashData as any)?.data ?? []
  const destockage: Product[] = Array.isArray(destockageData) ? destockageData : (destockageData as any)?.data ?? []

  const getCurrentProducts = (): Product[] => {
    let products: Product[] = []
    switch (activeTab) {
      case 'soldes': products = soldes; break
      case 'flash': products = flash; break
      case 'destockage': products = destockage; break
      default: products = [...soldes, ...flash, ...destockage]
    }
    if (sortBy === 'discount_desc') {
      return [...products].sort((a, b) => (getDiscountPercent(b) || 0) - (getDiscountPercent(a) || 0))
    }
    if (sortBy === 'price:asc') {
      return [...products].sort((a, b) => a.price - b.price)
    }
    if (sortBy === 'price:desc') {
      return [...products].sort((a, b) => b.price - a.price)
    }
    return products
  }

  const products = getCurrentProducts()
  const totalCount = products.length

  return (
    <div className="promo-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* Hero Section */}
      <div className="promo-hero relative py-12 md:py-20">
        <div className="container-app relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <Percent className="h-4 w-4" />
              <span className="text-sm font-semibold">Offres exclusives</span>
            </div>
            <h1 className="promo-font-display font-black text-4xl md:text-5xl lg:text-6xl mb-4">
              Promotions & Soldes
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Profitez de nos meilleures offres du moment. Économisez sur vos produits préférés !
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-app px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6 text-stone-500">
          <Link to="/" className="flex items-center gap-1 hover:text-orange-600 transition"><Home className="h-3 w-3" /> Accueil</Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-semibold text-stone-800">Promotions</span>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {PROMO_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`promo-tab flex items-center gap-2 ${activeTab === tab.value ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Header with controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-stone-500">{totalCount} produit{totalCount !== 1 ? 's' : ''} en promotion</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-stone-200">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-stone-400'}`}>
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-stone-400'}`}>
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="promo-select">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"}>
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-10 w-10 text-stone-300" />
            </div>
            <p className="text-stone-500">Aucune promotion pour le moment</p>
            <button onClick={() => navigate('/catalogue')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
              Voir le catalogue
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"}>
            {products.map((product, i) => (
              <PromoProductCard key={product.id} product={product} index={i} viewMode={viewMode} promoType={activeTab} />
            ))}
          </div>
        )}

        {/* Features footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-stone-200">
          {[
            { icon: <Timer className="h-5 w-5" />, label: 'Offres limitées', desc: 'Profitez-en vite !' },
            { icon: <Tag className="h-5 w-5" />, label: 'Meilleurs prix', desc: 'Jusqu\'à -70%' },
            { icon: <Truck className="h-5 w-5" />, label: 'Livraison offerte', desc: 'Dès 50 000 FCFA' },
            { icon: <Shield className="h-5 w-5" />, label: 'Paiement sécurisé', desc: '100% garanti' },
          ].map((feature, i) => (
            <div key={i} className="text-center p-4 bg-white rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2 text-orange-600">
                {feature.icon}
              </div>
              <p className="font-bold text-stone-800 text-sm">{feature.label}</p>
              <p className="text-xs text-stone-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}