import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Star,
  Heart,
  Package,
  Truck,
  Shield,
  Plus,
  Minus,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Leaf,
  Award,
  MapPin,
  RefreshCw,
  CreditCard,
  Home,
  Sparkles,
  ZoomIn,
  ArrowLeft,
  Tag,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { productApi, storageUrl } from '@/api'
import type { Product, ProductImage } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// ============================================================
// DESIGN TOKEN STYLES (harmonisé avec HomePage e-Sup'M)
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .pd-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .pd-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .pd-grain::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.3;
    pointer-events: none;
    border-radius: inherit;
  }

  .pd-thumb-active { border-color: #e8820c !important; box-shadow: 0 0 0 2px rgba(232,130,12,0.3); }

  .pd-feature-card {
    background: #faf7f2;
    border: 1px solid rgba(139,94,60,0.12);
    border-radius: 14px;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    transition: transform 0.2s;
  }
  .pd-feature-card:hover { transform: translateY(-2px); }

  .pd-qty-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1.5px solid rgba(139,94,60,0.2);
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .pd-qty-btn:hover:not(:disabled) { background: #f5efe6; border-color: #e8820c; }
  .pd-qty-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  /* Related card */
  .pd-related-card {
    border-radius: 14px;
    overflow: hidden;
    background: white;
    border: 1px solid rgba(139,94,60,0.1);
    transition: transform 0.22s, box-shadow 0.22s;
    cursor: pointer;
  }
  .pd-related-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(139,94,60,0.13); }
  .pd-related-card .pd-related-img { transition: transform 0.5s; }
  .pd-related-card:hover .pd-related-img { transform: scale(1.07); }

  /* Skeleton */
  @keyframes pdShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .pd-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%;
    animation: pdShimmer 1.4s infinite;
    border-radius: 10px;
  }

  /* Zoom backdrop */
  .pd-zoom-backdrop { backdrop-filter: blur(16px); }

  /* Section line */
  .pd-section-line {
    display: inline-block;
    position: relative;
  }
  .pd-section-line::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 35%;
    height: 3px;
    background: #e8820c;
    border-radius: 2px;
  }

  /* Scrollbar hide */
  .pd-hide-scroll::-webkit-scrollbar { display: none; }
  .pd-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`

// ============================================================
// HELPERS
// ============================================================
function getPrimaryImageUrl(product: Product): string | null {
  const p = product as any
  if (p.primary_image_url) return p.primary_image_url
  if (product.primary_image?.url) return product.primary_image.url
  if (product.primary_image?.path) return storageUrl(product.primary_image.path)
  if (product.images?.length) {
    const primary = product.images.find(i => i.is_primary) ?? product.images[0]
    return primary.url ?? storageUrl(primary.path)
  }
  return null
}

function getImageUrl(img: { url?: string; path: string }): string {
  return img.url ?? storageUrl(img.path) ?? ''
}

function isInStock(product: Product): boolean {
  return (product as any).in_stock ?? product.stock > 0
}

function isLowStock(product: Product): boolean {
  return (product as any).is_low_stock ?? (product.stock > 0 && product.stock <= product.low_stock_threshold)
}

function discountPercentage(product: Product): number | null {
  if ((product as any).discount_percentage) return (product as any).discount_percentage
  if (!product.compare_price || product.compare_price <= product.price) return null
  return Math.round((1 - product.price / product.compare_price) * 100)
}

function getExpiryDate(product: Product): string | null {
  return (product as any).expiry_date ?? null
}

function isExpired(product: Product): boolean {
  return (product as any).is_expired ?? false
}

function isExpiringSoon(product: Product): boolean {
  return (product as any).is_expiring_soon ?? false
}

// Toujours calculer depuis la date réelle pour éviter les valeurs négatives/décimales de l'API
function getDaysUntilExpiry(product: Product): number | null {
  const expiryDate = getExpiryDate(product)
  if (expiryDate) {
    const diffMs = new Date(expiryDate).getTime() - Date.now()
    return diffMs <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }
  // Fallback sur la valeur API uniquement si positive et entière
  const raw = (product as any).days_until_expiry
  if (typeof raw === 'number' && raw > 0) return Math.round(raw)
  return null
}

function formatExpiryDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================================
// SKELETON
// ============================================================
function ProductDetailSkeleton() {
  return (
    <div className="pd-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <div className="container-app py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6">
          {[80, 90, 140].map((w, i) => (
            <div key={i} className="pd-skeleton h-4 rounded" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          <div>
            <div className="pd-skeleton rounded-2xl" style={{ aspectRatio: '1 / 1', maxHeight: 420 }} />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3].map(i => <div key={i} className="pd-skeleton w-16 h-16 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="pd-skeleton h-6 w-28 rounded-full" />
            <div className="pd-skeleton h-9 w-3/4 rounded-xl" />
            <div className="pd-skeleton h-4 w-36 rounded" />
            <div className="pd-skeleton h-12 w-44 rounded-xl" />
            <div className="pd-skeleton h-28 w-full rounded-2xl" />
            <div className="pd-skeleton h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// IMAGE GALLERY
// ============================================================
interface ImageGalleryProps {
  images: ProductImage[]
  productName: string
  isExpiredProd: boolean
}

function ImageGallery({ images, productName, isExpiredProd }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — taille maîtrisée */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border"
        style={{
          background: '#f5efe6',
          borderColor: 'rgba(139,94,60,0.12)',
          aspectRatio: '4/3',
          maxHeight: 380,
        }}
      >
        {isExpiredProd && (
          <div className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <span className="pd-font-body font-black text-sm px-4 py-2 rounded-full shadow-lg"
              style={{ background: '#dc2626', color: 'white', transform: 'rotate(-8deg)' }}>
              PRODUIT EXPIRÉ
            </span>
          </div>
        )}

        <img
          src={getImageUrl(images[activeIndex])}
          alt={`${productName} - vue ${activeIndex + 1}`}
          className="w-full h-full object-contain p-4 transition-all duration-300 hover:scale-[1.04]"
          style={{ opacity: isExpiredProd ? 0.35 : 1, cursor: isExpiredProd ? 'default' : 'zoom-in' }}
          onClick={() => !isExpiredProd && setIsZoomed(true)}
        />

        {/* Zoom hint */}
        {!isExpiredProd && (
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(139,94,60,0.15)', color: '#8b5e3c' }}>
            <ZoomIn className="h-4 w-4" />
          </div>
        )}
      </motion.div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pd-hide-scroll pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id ?? idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                idx === activeIndex ? 'pd-thumb-active' : ''
              }`}
              style={{ borderColor: idx === activeIndex ? '#e8820c' : 'rgba(139,94,60,0.18)' }}
            >
              <img src={getImageUrl(img)} alt={`Vue ${idx + 1}`}
                className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pd-zoom-backdrop"
            style={{ background: 'rgba(10,6,2,0.92)' }}
            onClick={() => setIsZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={getImageUrl(images[activeIndex])}
              alt={productName}
              className="max-w-full max-h-full object-contain rounded-2xl"
              style={{ maxWidth: '90vw', maxHeight: '88vh' }}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              onClick={() => setIsZoomed(false)}
            >
              <XCircle className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// BADGES
// ============================================================
function ProductBadges({ category, brand, isBio, isLocal, isNew, isPremium, expiringSoon, expired, lowStock }: {
  category?: { name: string }; brand?: string; isBio: boolean; isLocal: boolean
  isNew: boolean; isPremium: boolean; expiringSoon: boolean; expired: boolean; lowStock: boolean
}) {
  const badges = []
  if (expired) {
    badges.push({ variant: 'red', icon: XCircle, label: 'Expiré' })
  } else {
    if (category) badges.push({ variant: 'orange', icon: null, label: category.name })
    if (brand) badges.push({ variant: 'gray', icon: null, label: brand })
    if (isBio) badges.push({ variant: 'green', icon: Leaf, label: 'Bio' })
    if (isLocal) badges.push({ variant: 'green', icon: MapPin, label: 'Local CI' })
    if (isNew) badges.push({ variant: 'blue', icon: Sparkles, label: 'Nouveau' })
    if (isPremium) badges.push({ variant: 'gray', icon: Award, label: 'Premium' })
    if (expiringSoon) badges.push({ variant: 'orange', icon: Clock, label: 'Expire bientôt' })
    if (lowStock) badges.push({ variant: 'orange', icon: AlertCircle, label: 'Stock limité' })
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {badges.map(({ variant, icon: Icon, label }) => (
        <Badge key={label} variant={variant as any} className="flex items-center gap-1 text-xs py-0.5 px-2.5">
          {Icon && <Icon className="h-2.5 w-2.5" />}
          {label}
        </Badge>
      ))}
    </div>
  )
}

// ============================================================
// EXPIRY ALERT — ✅ BUGFIX affichage jours
// ============================================================
function ExpiryAlert({ expired, expiringSoon, expiryDate, daysUntilExpiry }: {
  expired: boolean; expiringSoon: boolean; expiryDate: string | null; daysUntilExpiry: number | null
}) {
  if (expired) return null
  if (!expiryDate) return null

  const dayLabel = daysUntilExpiry === null
    ? null
    : daysUntilExpiry === 0
    ? "Expiration aujourd'hui"
    : daysUntilExpiry === 1
    ? 'Expiration demain'
    : `Expiration dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`

  if (expiringSoon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 px-4 py-3 rounded-2xl"
        style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
      >
        <Clock className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
        <div>
          {dayLabel && <p className="pd-font-body font-bold text-sm" style={{ color: '#92400e' }}>{dayLabel}</p>}
          <p className="pd-font-body text-xs mt-0.5" style={{ color: '#b45309' }}>
            À consommer avant le {formatExpiryDate(expiryDate)}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-2xl"
      style={{ background: '#faf7f2', border: '1px solid rgba(139,94,60,0.15)' }}>
      <Clock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#8b5e3c', opacity: 0.7 }} />
      <p className="pd-font-body text-xs" style={{ color: '#8b5e3c' }}>
        À consommer de préférence avant le{' '}
        <span className="font-semibold">{formatExpiryDate(expiryDate)}</span>
      </p>
    </div>
  )
}

// ============================================================
// STOCK STATUS
// ============================================================
function StockStatus({ inStock, expired, lowStock, stock }: {
  inStock: boolean; expired: boolean; lowStock: boolean; stock: number
}) {
  if (expired || !inStock) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <XCircle className="h-4 w-4 shrink-0" style={{ color: '#dc2626' }} />
        <p className="pd-font-body text-sm font-semibold" style={{ color: '#dc2626' }}>
          {expired ? 'Produit expiré' : 'Rupture de stock'}
        </p>
      </div>
    )
  }
  if (lowStock) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <AlertCircle className="h-4 w-4 shrink-0" style={{ color: '#d97706' }} />
        <p className="pd-font-body text-sm font-semibold" style={{ color: '#92400e' }}>
          Stock limité · {stock} restant{stock > 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
      <CheckCircle className="h-4 w-4 shrink-0" style={{ color: '#16a34a' }} />
      <p className="pd-font-body text-sm font-semibold" style={{ color: '#166534' }}>
        En stock · Livraison 24-48h
      </p>
    </div>
  )
}

// ============================================================
// RATING
// ============================================================
function Rating({ avg, count }: { avg: number; count: number }) {
  const full = Math.floor(avg)
  const half = avg % 1 >= 0.5
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s}
            className={`h-3.5 w-3.5 ${
              s <= full ? 'fill-current' : s === full + 1 && half ? 'fill-current opacity-50' : 'opacity-20'
            }`}
            style={{ color: '#e8820c' }}
          />
        ))}
      </div>
      <span className="pd-font-body text-sm font-bold" style={{ color: '#1a1209' }}>{avg.toFixed(1)}</span>
      <span className="pd-font-body text-xs" style={{ color: '#8b5e3c', opacity: 0.65 }}>({count} avis)</span>
    </div>
  )
}

// ============================================================
// PRICE
// ============================================================
function Price({ price, comparePrice, discount }: { price: number; comparePrice?: number; discount?: number | null }) {
  return (
    <div className="flex items-end gap-3 flex-wrap mt-4">
      <span className="pd-font-display font-black" style={{ fontSize: 'clamp(22px, 5vw, 32px)', color: '#1a1209' }}>
        {formatCurrency(price)}
      </span>
      {comparePrice && discount && (
        <>
          <span className="pd-font-body text-base line-through" style={{ color: '#8b5e3c', opacity: 0.5 }}>
            {formatCurrency(comparePrice)}
          </span>
          <span className="pd-font-body text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: '#dc2626', color: 'white' }}>
            -{discount}%
          </span>
        </>
      )}
    </div>
  )
}

// ============================================================
// QUANTITY SELECTOR
// ============================================================
function QtySelector({ qty, onInc, onDec, max }: { qty: number; onInc: () => void; onDec: () => void; max: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 rounded-xl border"
      style={{ background: '#faf7f2', borderColor: 'rgba(139,94,60,0.18)', display: 'inline-flex' }}>
      <button className="pd-qty-btn" onClick={onDec} disabled={qty <= 1}>
        <Minus className="h-3.5 w-3.5" style={{ color: '#8b5e3c' }} />
      </button>
      <span className="pd-font-body font-bold text-base w-9 text-center" style={{ color: '#1a1209' }}>{qty}</span>
      <button className="pd-qty-btn" onClick={onInc} disabled={qty >= max}>
        <Plus className="h-3.5 w-3.5" style={{ color: '#8b5e3c' }} />
      </button>
    </div>
  )
}

// ============================================================
// DELIVERY FEATURES
// ============================================================
const DELIVERY = [
  { Icon: Truck, label: 'Livraison 24-48h', sub: 'À Abidjan' },
  { Icon: Shield, label: 'Paiement sécurisé', sub: 'CB · Mobile Money' },
  { Icon: RefreshCw, label: 'Retour 48h', sub: 'Produit défectueux' },
  { Icon: CreditCard, label: 'Paiement livraison', sub: 'Espèces ou Orange Money' },
]

function DeliveryInfo() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
      {DELIVERY.map(({ Icon, label, sub }) => (
        <div key={label} className="pd-feature-card">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(232,130,12,0.1)' }}>
            <Icon className="h-4 w-4" style={{ color: '#e8820c' }} />
          </div>
          <span className="pd-font-body text-[10px] sm:text-xs font-bold leading-tight"
            style={{ color: '#1a1209' }}>{label}</span>
          <span className="pd-font-body text-[9px] leading-tight hidden sm:block"
            style={{ color: '#8b5e3c', opacity: 0.6 }}>{sub}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// BREADCRUMB
// ============================================================
function Breadcrumb({ categoryName, categorySlug, productName }: {
  categoryName?: string; categorySlug?: string; productName: string
}) {
  return (
    <div className="pd-font-body flex items-center gap-1.5 text-xs flex-wrap mb-6"
      style={{ color: '#8b5e3c', opacity: 0.75 }}>
      <Link to="/" className="flex items-center gap-1 hover:opacity-100 transition-opacity">
        <Home className="h-3 w-3" /> Accueil
      </Link>
      <ChevronRight className="h-3 w-3 opacity-50" />
      {categoryName && categorySlug ? (
        <>
          <Link to={`/rayons/${categorySlug}`} className="hover:opacity-100 transition-opacity">{categoryName}</Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </>
      ) : (
        <>
          <Link to="/catalogue" className="hover:opacity-100 transition-opacity">Catalogue</Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </>
      )}
      <span className="font-semibold truncate max-w-[200px]" style={{ color: '#1a1209', opacity: 1 }}>
        {productName}
      </span>
    </div>
  )
}

// ============================================================
// RELATED PRODUCT CARD
// ============================================================
function RelatedCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const imgUrl = getPrimaryImageUrl(product)
  const expiredProd = isExpired(product)
  const expiringSoonProd = isExpiringSoon(product)
  const disc = discountPercentage(product)

  return (
    <div className="pd-related-card" onClick={onClick}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: '#f5efe6' }}>
        {expiredProd && (
          <div className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <span className="pd-font-body text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#dc2626', color: 'white' }}>Expiré</span>
          </div>
        )}
        {imgUrl
          ? <img src={imgUrl} alt={product.name}
              className="pd-related-img w-full h-full object-cover"
              style={{ opacity: expiredProd ? 0.35 : 1 }} />
          : <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8" style={{ color: '#8b5e3c', opacity: 0.25 }} />
            </div>
        }
        {disc && !expiredProd && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#dc2626' }}>
            <span className="pd-font-body text-[9px] font-black text-white">-{disc}%</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="pd-font-body text-[9px] truncate" style={{ color: '#8b5e3c', opacity: 0.65 }}>
          {product.category?.name}
        </p>
        <h4 className="pd-font-body text-xs font-semibold line-clamp-2 mt-0.5 leading-tight"
          style={{ color: '#1a1209' }}>
          {product.name}
        </h4>
        <p className="pd-font-display font-black text-sm mt-2" style={{ color: '#1a1209' }}>
          {formatCurrency(product.price)}
        </p>
        {expiringSoonProd && !expiredProd && (
          <p className="pd-font-body text-[9px] flex items-center gap-0.5 mt-1" style={{ color: '#d97706' }}>
            <Clock className="h-2 w-2" /> Expire bientôt
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem, isAdding } = useCart()
  const [qty, setQty] = useState(1)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['products', 'detail', slug],
    queryFn: () => productApi.get(slug!),
    enabled: !!slug,
  })

  const { data: related } = useQuery({
    queryKey: ['products', 'related', product?.id],
    queryFn: () => productApi.related(product!.id),
    enabled: !!product?.id,
  })

  useEffect(() => { setQty(1) }, [product?.id])

  if (isLoading) return <ProductDetailSkeleton />

  if (error || !product) {
    return (
      <div className="pd-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
        <div className="container-app py-20 text-center">
          <div className="max-w-xs mx-auto">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: '#f5efe6' }}>
              <Package className="h-10 w-10" style={{ color: '#8b5e3c', opacity: 0.45 }} />
            </div>
            <h2 className="pd-font-display text-2xl font-black mb-2" style={{ color: '#1a1209' }}>
              Produit introuvable
            </h2>
            <p className="pd-font-body text-sm mb-6" style={{ color: '#8b5e3c', opacity: 0.75 }}>
              Ce produit n'existe pas ou a été retiré du catalogue.
            </p>
            <Button variant="orange" onClick={() => navigate('/catalogue')}>
              Voir le catalogue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Computed values ──
  const images = product.images?.length
    ? product.images
    : getPrimaryImageUrl(product)
      ? [{ id: 0, path: '', url: getPrimaryImageUrl(product)!, is_primary: true }]
      : []

  const inStock     = isInStock(product) && !isExpired(product)
  const lowStock    = isLowStock(product)
  const discount    = discountPercentage(product)
  const avgRating   = (product as any).average_rating as number | undefined
  const reviewCount = (product as any).reviews_count as number | undefined
  const brand       = (product as any).brand as string | undefined
  const expiryDate  = getExpiryDate(product)
  const expired     = isExpired(product)
  const expiringSoon = isExpiringSoon(product)
  const daysUntilExpiry = getDaysUntilExpiry(product)

  return (
    <div className="pd-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="container-app py-5 sm:py-8">

        {/* ── Back + Breadcrumb ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'white', border: '1px solid rgba(139,94,60,0.2)', color: '#8b5e3c' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <Breadcrumb
            categoryName={product.category?.name}
            categorySlug={product.category?.slug}
            productName={product.name}
          />
        </div>

        {/* ── Expiry alert banner ── */}
        <ExpiryAlert
          expired={expired}
          expiringSoon={expiringSoon}
          expiryDate={expiryDate}
          daysUntilExpiry={daysUntilExpiry}
        />

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-start">

          {/* LEFT — Image gallery */}
          {images.length > 0 ? (
            <ImageGallery
              images={images}
              productName={product.name}
              isExpiredProd={expired}
            />
          ) : (
            <div className="rounded-2xl flex items-center justify-center"
              style={{ aspectRatio: '4/3', maxHeight: 380, background: '#f5efe6', border: '1px solid rgba(139,94,60,0.12)' }}>
              <Package className="h-16 w-16" style={{ color: '#8b5e3c', opacity: 0.2 }} />
            </div>
          )}

          {/* RIGHT — Product info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-0"
          >
            {/* Badges */}
            <ProductBadges
              category={product.category}
              brand={brand}
              isBio={product.is_bio}
              isLocal={product.is_local}
              isNew={product.is_new}
              isPremium={product.is_premium}
              expiringSoon={expiringSoon}
              expired={expired}
              lowStock={lowStock}
            />

            {/* Title */}
            <h1 className="pd-font-display font-black leading-tight"
              style={{ fontSize: 'clamp(20px, 4vw, 30px)', color: '#1a1209' }}>
              {product.name}
            </h1>

            {/* Rating */}
            {reviewCount && reviewCount > 0 && avgRating !== undefined && (
              <Rating avg={avgRating} count={reviewCount} />
            )}

            {/* Price */}
            <Price price={product.price} comparePrice={product.compare_price} discount={discount} />

            {/* Description */}
            {product.description && (
              <div className="mt-5 p-4 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(139,94,60,0.1)' }}>
                <p className="pd-font-body text-sm leading-relaxed" style={{ color: '#4a3728' }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Stock status */}
            <div className="mt-4">
              <StockStatus inStock={inStock} expired={expired} lowStock={lowStock} stock={product.stock} />
            </div>

            {/* Add to cart */}
            {inStock && (
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <QtySelector
                  qty={qty}
                  onInc={() => setQty(q => Math.min(product.stock, q + 1))}
                  onDec={() => setQty(q => Math.max(1, q - 1))}
                  max={product.stock}
                />
                <Button
                  variant="orange"
                  size="lg"
                  className="flex-1 w-full sm:w-auto"
                  loading={isAdding}
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                  onClick={() => addItem({ productId: product.id, quantity: qty })}
                >
                  Ajouter · {formatCurrency(product.price * qty)}
                </Button>
                <button
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
                  style={{ border: '1.5px solid rgba(139,94,60,0.2)', background: 'white', color: '#8b5e3c' }}
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Delivery info */}
            <DeliveryInfo />
          </motion.div>
        </div>

        {/* ── Related products ── */}
        {related && related.length > 0 && (
          <section className="mt-14 pt-8" style={{ borderTop: '1px solid rgba(139,94,60,0.12)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="pd-font-display pd-section-line font-black text-lg sm:text-2xl"
                style={{ color: '#1a1209' }}>
                Produits similaires
              </h2>
              <Link
                to={`/rayons/${product.category?.slug ?? 'catalogue'}`}
                className="pd-font-body flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2"
                style={{ color: '#e8820c' }}
              >
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {related.slice(0, 5).map(rel => (
                <RelatedCard
                  key={rel.id}
                  product={rel}
                  onClick={() => navigate(`/produit/${(rel as any).slug ?? rel.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}