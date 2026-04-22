import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pause,
  RefreshCw,
  Star,
  Package,
  Calendar,
  Users,
  ShoppingBag,
  CheckCircle,
  ChevronRight,
  Tag,
  Sparkles,
  AlertCircle,
  X,
  Clock,
  Shield,
  Gift,
  ArrowRight,
  ShoppingBasket,
  Sliders,
  Layers,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/data/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { publicFoodBoxApi, subscriptionApi, storageUrl } from '@/api'
import type { FoodBox } from '@/api'
import { useToast, ToastContainer } from '@/hooks/useToast'
import FoodBoxSubscriptionWizard from '@/features/subscriptions/FoodBoxSubscriptionWizard'

// ============================================================
// STYLES e-Sup'M
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .sub-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .sub-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  /* Selective promo card */
  .sub-selective-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    background: linear-gradient(145deg, #1a1209 0%, #3a2210 55%, #8b5e3c 100%);
  }
  .sub-selective-card::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,130,12,0.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .sub-selective-card::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139,94,60,0.3) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Feature chip on dark bg */
  .sub-dark-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 20px;
    background: rgba(255,255,255,0.1);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.12);
  }

  /* Comparison row */
  .sub-compare-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sub-compare-row:last-child { border-bottom: none; }

  /* Box card */
  .sub-box-card {
    background: white;
    border: 1px solid rgba(139,94,60,0.1);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
  }
  .sub-box-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(139,94,60,0.13); }
  .sub-box-card .sub-box-img { transition: transform 0.5s ease; }
  .sub-box-card:hover .sub-box-img { transform: scale(1.06); }

  /* Subscription row */
  .sub-row {
    background: white;
    border: 1px solid rgba(139,94,60,0.1);
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .sub-row:hover { box-shadow: 0 6px 20px rgba(139,94,60,0.1); }

  /* Skeleton */
  @keyframes subShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .sub-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%;
    animation: subShimmer 1.4s infinite;
    border-radius: 10px;
  }

  /* Section line */
  .sub-section-line { display:inline-block; position:relative; }
  .sub-section-line::after {
    content:''; position:absolute; bottom:-4px; left:0;
    width:35%; height:3px; background:#e8820c; border-radius:2px;
  }

  /* Filter pill */
  .sub-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 6px 14px; border-radius: 20px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px; font-weight: 700;
    border: 1.5px solid rgba(139,94,60,0.2);
    background: white;
    color: #8b5e3c;
    cursor: pointer; transition: all 0.18s;
  }
  .sub-pill.active { background: #e8820c; border-color: #e8820c; color: white; }
  .sub-pill:hover:not(.active) { border-color: rgba(232,130,12,0.4); color: #e8820c; }
`

// ============================================================
// CONSTANTES
// ============================================================
const FREQ_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  weekly:   { label: 'Hebdomadaire', bg: '#e0f2fe', fg: '#0369a1' },
  biweekly: { label: 'Bi-mensuelle', bg: '#f3e8ff', fg: '#7e22ce' },
  monthly:  { label: 'Mensuelle',    bg: '#fef3c7', fg: '#92400e' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  active:    { label: 'Actif',      bg: '#f0fdf4', fg: '#166534', dot: '#22c55e' },
  suspended: { label: 'Suspendu',   bg: '#fffbeb', fg: '#92400e', dot: '#f59e0b' },
  cancelled: { label: 'Annulé',     bg: '#fef2f2', fg: '#991b1b', dot: '#ef4444' },
  pending:   { label: 'En attente', bg: '#f8fafc', fg: '#475569', dot: '#94a3b8' },
}

function getBoxImageUrl(box: FoodBox): string | null {
  if (box.image_url) return box.image_url
  if (box.image) return storageUrl(box.image)
  return null
}

async function fetchPublicFoodBoxes(): Promise<FoodBox[]> {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res  = await fetch('/api/food-boxes', { headers })
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  const json = await res.json()
  if (json.success && Array.isArray(json.data)) return json.data
  if (Array.isArray(json)) return json
  if (json.data && Array.isArray(json.data)) return json.data
  return []
}

// ============================================================
// SKELETON
// ============================================================
function BoxCardSkeleton() {
  return (
    <div className="sub-box-card">
      <div className="sub-skeleton" style={{ height: 140 }} />
      <div className="p-3 space-y-2">
        <div className="sub-skeleton h-4 w-3/4 rounded" />
        <div className="sub-skeleton h-3 w-1/2 rounded" />
        <div className="sub-skeleton h-6 w-1/3 rounded" />
        <div className="sub-skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ============================================================
// FOOD BOX CARD
// ============================================================
function FoodBoxCard({ box, onSubscribe, isAlreadySubscribed }: {
  box: FoodBox; onSubscribe: (box: FoodBox) => void; isAlreadySubscribed: boolean
}) {
  const imageUrl    = getBoxImageUrl(box)
  const freq        = FREQ_LABELS[box.frequency]
  const itemCount   = (box as any).items?.length ?? (box as any).active_items_count ?? 0
  const discount    = box.compare_price && box.compare_price > box.price
    ? Math.round((1 - box.price / box.compare_price) * 100) : null
  const isFull      = box.max_subscribers ? box.subscribers_count >= box.max_subscribers : false
  const availSpots  = box.max_subscribers ? Math.max(0, box.max_subscribers - (box.subscribers_count ?? 0)) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="sub-box-card"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 140, background: '#f5efe6' }}>
        {imageUrl
          ? <img src={imageUrl} alt={box.name} className="sub-box-img w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8" style={{ color: '#8b5e3c', opacity: 0.25 }} />
            </div>
        }
        {/* Top badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {box.badge_label && (
            <span className="sub-font-body text-[9px] font-bold px-2 py-0.5 rounded-md text-white"
              style={{ background: box.badge_color || '#e8820c' }}>
              {box.badge_label}
            </span>
          )}
          {box.is_featured && (
            <span className="sub-font-body text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5"
              style={{ background: '#e8820c', color: 'white' }}>
              <Star className="h-2 w-2 fill-white" /> Vedette
            </span>
          )}
        </div>
        {discount !== null && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-xl flex flex-col items-center justify-center"
            style={{ background: '#16a34a' }}>
            <span className="sub-font-body text-[8px] font-bold text-green-100 leading-none">-</span>
            <span className="sub-font-body text-xs font-black text-white leading-none">{discount}%</span>
          </div>
        )}
        {isFull && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
            <span className="sub-font-body text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>Complet</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="sub-font-body font-bold text-sm leading-tight line-clamp-1" style={{ color: '#1a1209' }}>
            {box.name}
          </h3>
          {box.tagline && (
            <p className="sub-font-body text-[10px] mt-0.5 line-clamp-1" style={{ color: '#8b5e3c', opacity: 0.65 }}>
              {box.tagline}
            </p>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="sub-font-display font-black text-lg" style={{ color: '#e8820c' }}>
            {formatCurrency(box.price)}
          </span>
          {box.compare_price && (
            <span className="sub-font-body text-[10px] line-through" style={{ color: '#8b5e3c', opacity: 0.4 }}>
              {formatCurrency(box.compare_price)}
            </span>
          )}
          <span className="sub-font-body text-[9px] ml-auto" style={{ color: '#8b5e3c', opacity: 0.5 }}>/cycle</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {freq && (
            <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: freq.bg, color: freq.fg }}>
              <Calendar className="h-2 w-2" /> {freq.label}
            </span>
          )}
          {itemCount > 0 && (
            <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: '#faf7f2', color: '#8b5e3c' }}>
              <Package className="h-2 w-2" /> {itemCount}
            </span>
          )}
          {availSpots !== null && availSpots <= 5 && availSpots > 0 && (
            <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Users className="h-2 w-2" /> {availSpots} places
            </span>
          )}
        </div>

        <button
          onClick={() => !isFull && !isAlreadySubscribed && onSubscribe(box)}
          disabled={isFull || isAlreadySubscribed}
          className="sub-font-body w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-98"
          style={isAlreadySubscribed
            ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }
            : isFull
            ? { background: '#f5f5f5', color: '#9ca3af', cursor: 'not-allowed' }
            : { background: '#e8820c', color: 'white', boxShadow: '0 2px 8px rgba(232,130,12,0.3)' }
          }
        >
          {isAlreadySubscribed
            ? <><CheckCircle className="h-3 w-3" /> Abonné</>
            : isFull ? 'Complet'
            : <><Plus className="h-3 w-3" /> S'abonner</>
          }
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================
// FILTER BAR
// ============================================================
function FilterBar({ filters, onFilterChange, frequencies }: {
  filters: { featured: boolean; frequency: string }
  onFilterChange: (key: string, value: any) => void
  frequencies?: any
}) {
  const hasActive = filters.featured || !!filters.frequency
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button className={`sub-pill ${!filters.frequency && !filters.featured ? 'active' : ''}`}
        onClick={() => { onFilterChange('frequency', ''); onFilterChange('featured', false) }}>
        Toutes
      </button>
      {frequencies && Object.entries(frequencies).map(([key, value]: [string, any]) => (
        <button key={key}
          className={`sub-pill ${filters.frequency === key ? 'active' : ''}`}
          onClick={() => onFilterChange('frequency', filters.frequency === key ? '' : key)}>
          <Calendar className="h-2.5 w-2.5" /> {value.label}
        </button>
      ))}
      <button className={`sub-pill ${filters.featured ? 'active' : ''}`}
        onClick={() => onFilterChange('featured', !filters.featured)}>
        <Star className={`h-2.5 w-2.5 ${filters.featured ? 'fill-white' : ''}`} /> Vedettes
      </button>
      <AnimatePresence>
        {hasActive && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { onFilterChange('featured', false); onFilterChange('frequency', '') }}
            className="sub-font-body flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-full transition-colors"
            style={{ color: '#dc2626' }}>
            <X className="h-3 w-3" /> Effacer
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// ★ SECTION ABONNEMENT SELECTIF — nouveau composant
// ============================================================
function SelectiveSubscriptionPromo() {
  const navigate = useNavigate()

  const FEATURES = [
    { Icon: Sliders,      label: 'Composez votre panier',    desc: 'Choisissez librement dans tout le catalogue' },
    { Icon: ToggleRight,  label: 'Activez article par article', desc: 'Chaque produit peut être ON ou OFF par cycle' },
    { Icon: Tag,          label: '5% de remise sur chaque cycle', desc: 'Automatiquement appliqué à chaque livraison' },
    { Icon: Shield,       label: 'Sans engagement',          desc: 'Modifiez ou résiliez à tout moment' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="sub-selective-card"
    >
      <div className="relative z-10 p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* LEFT — texte */}
          <div>
            {/* Tag */}
            <span className="sub-font-body text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4"
              style={{ background: 'rgba(232,130,12,0.2)', color: '#f5a623', border: '1px solid rgba(232,130,12,0.3)' }}>
              <Sparkles className="h-3 w-3" /> Nouveau
            </span>

            <h2 className="sub-font-display font-black text-white leading-tight mb-2"
              style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}>
              Créez votre abonnement<br />sur mesure
            </h2>
            <p className="sub-font-body text-sm mb-5"
              style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Contrairement aux boxes prédéfinies, l'abonnement sélectif vous laisse choisir chaque
              produit depuis notre catalogue. Vous décidez de ce qui est inclus — et vous pouvez
              ajuster votre panier avant chaque cycle.
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { Icon: Package, label: 'Jusqu\'à 3 paniers' },
                { Icon: Clock,   label: 'Modifiable à tout moment' },
                { Icon: Gift,    label: 'Points de fidélité x2' },
              ].map(({ Icon, label }) => (
                <span key={label} className="sub-dark-chip">
                  <Icon className="h-3 w-3" style={{ color: '#f5a623' }} />
                  {label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/subscriptions/selective')}
              className="sub-font-body flex items-center gap-2 font-bold text-sm px-6 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: '#e8820c', color: 'white', boxShadow: '0 8px 24px rgba(232,130,12,0.4)' }}
            >
              Composer mon panier
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* RIGHT — liste des avantages */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="sub-font-display font-black text-white text-sm mb-4">
              Comment ca fonctionne
            </p>
            <div className="space-y-0">
              {FEATURES.map(({ Icon, label, desc }, i) => (
                <div key={label} className="sub-compare-row">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(232,130,12,0.18)' }}>
                    <Icon className="h-4 w-4" style={{ color: '#f5a623' }} />
                  </div>
                  <div>
                    <p className="sub-font-body text-xs font-bold text-white">{label}</p>
                    <p className="sub-font-body text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison vs box */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <ShoppingBag className="h-5 w-5 mx-auto mb-1.5" style={{ color: '#f5a623' }} />
                  <p className="sub-font-body text-[9px] font-bold text-white">Box composée</p>
                  <p className="sub-font-body text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Selection e-Sup'M
                  </p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(232,130,12,0.18)', border: '1px solid rgba(232,130,12,0.3)' }}>
                  <ShoppingBasket className="h-5 w-5 mx-auto mb-1.5" style={{ color: '#f5a623' }} />
                  <p className="sub-font-body text-[9px] font-bold text-white">Panier selectif</p>
                  <p className="sub-font-body text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Votre selection libre
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// SUBSCRIPTION ROW (mes abonnements)
// ============================================================
function SubscriptionRow({ sub, onSuspend, onResume, suspending, resuming }: {
  sub: any; onSuspend: (id: number) => void; onResume: (id: number) => void
  suspending: boolean; resuming: boolean
}) {
  const sc   = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.pending
  const freq = FREQ_LABELS[sub.frequency]
  const itemCount = sub.items?.length ?? 0
  const isActive    = sub.status === 'active'
  const isSuspended = sub.status === 'suspended'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="sub-row"
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="sub-font-display font-bold text-sm" style={{ color: '#1a1209' }}>
                {sub.name}
              </h3>
              <span className="sub-font-body text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: sc.bg, color: sc.fg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                {sc.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {freq && (
                <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: freq.bg, color: freq.fg }}>
                  <Calendar className="h-2.5 w-2.5" /> {freq.label}
                </span>
              )}
              <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: '#faf7f2', color: '#8b5e3c' }}>
                <Package className="h-2.5 w-2.5" /> {itemCount} article{itemCount !== 1 ? 's' : ''}
              </span>
              {sub.next_delivery_at && (
                <span className="sub-font-body text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                  <Calendar className="h-2.5 w-2.5" /> {formatDate(sub.next_delivery_at)}
                </span>
              )}
            </div>
          </div>

          {/* Right price + actions */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              <p className="sub-font-display font-black text-lg" style={{ color: '#1a1209' }}>
                {formatCurrency(sub.total)}
              </p>
              <p className="sub-font-body text-[9px]" style={{ color: '#8b5e3c', opacity: 0.55 }}>par cycle</p>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  onClick={() => onSuspend(sub.id)}
                  disabled={suspending}
                  className="sub-font-body flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                  <Pause className="h-3 w-3" /> Suspendre
                </button>
              )}
              {isSuspended && (
                <button
                  onClick={() => onResume(sub.id)}
                  disabled={resuming}
                  className="sub-font-body flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                  <RefreshCw className="h-3 w-3" /> Réactiver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// BENEFIT CARD
// ============================================================
function BenefitCard({ Icon, title, description }: { Icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: 'white', border: '1px solid rgba(139,94,60,0.1)' }}>
      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(232,130,12,0.1)' }}>
        <Icon className="h-4 w-4" style={{ color: '#e8820c' }} />
      </div>
      <div>
        <p className="sub-font-body text-xs font-bold" style={{ color: '#1a1209' }}>{title}</p>
        <p className="sub-font-body text-[10px]" style={{ color: '#8b5e3c', opacity: 0.65 }}>{description}</p>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SubscriptionsPage() {
  const [selectedBox, setSelectedBox] = useState<FoodBox | null>(null)
  const [filters, setFilters]         = useState({ featured: false, frequency: '' })
  const { toast, toasts, removeToast } = useToast()
  const queryClient = useQueryClient()

  const { data: frequenciesData } = useQuery({
    queryKey: ['food-box-frequencies'],
    queryFn: () => publicFoodBoxApi.frequencies(),
    select: (r) => r.data,
  })

  const { data: boxesData, isLoading: boxesLoading, error: boxesError, refetch: refetchBoxes } = useQuery({
    queryKey: ['public-food-boxes', filters],
    queryFn: fetchPublicFoodBoxes,
    staleTime: 1000 * 60 * 5,
  })

  const boxes     = Array.isArray(boxesData) ? boxesData : []
  const activeBoxes = boxes.filter((b: FoodBox) => b.is_active === true)

  const { data: subs, isLoading: subsLoading, refetch: refetchSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.list().then((r: any) => r.data ?? r),
  })

  const activeSubs: any[]        = Array.isArray(subs) ? subs : []
  const subscribedBoxNames       = new Set(activeSubs.map((s: any) => s.name))

  const suspendMutation = useMutation({
    mutationFn: (id: number) => subscriptionApi.suspend(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); toast({ type: 'success', message: 'Abonnement suspendu' }) },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la suspension' }),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: number) => subscriptionApi.resume(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); toast({ type: 'success', message: 'Abonnement réactivé' }) },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la réactivation' }),
  })

  const handleSubscriptionCreated = () => {
    setSelectedBox(null)
    refetchSubs()
    refetchBoxes()
    toast({ type: 'success', message: 'Abonnement créé avec succès' })
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="sub-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #e8820c 0%, #f5a623 55%, #e8820c 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3"
              style={{ background: 'white' }} />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 translate-y-1/2 -translate-x-1/4"
              style={{ background: 'rgba(0,0,0,0.3)' }} />
          </div>
          <div className="relative container-app py-8 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <span className="sub-font-body text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <Sparkles className="h-3 w-3" /> Livraison automatique — 5% de remise
                </span>
                <h1 className="sub-font-display font-black text-white leading-tight"
                  style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
                  Abonnements alimentaires
                </h1>
                <p className="sub-font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Boxes composées par e-Sup'M ou panier sélectif personnalisé — recevez vos produits automatiquement.
                </p>
              </div>
              {/* Stats pills */}
              <div className="grid grid-cols-4 gap-2 shrink-0">
                {[
                  { Icon: Tag,    v: '5%',   label: 'remise' },
                  { Icon: Clock,  v: 'Flex',  label: 'modifiable' },
                  { Icon: Shield, v: '0',     label: 'frais résil.' },
                  { Icon: Gift,   v: 'x2',    label: 'points' },
                ].map(({ Icon, v, label }) => (
                  <div key={label} className="rounded-2xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                    <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <p className="sub-font-display font-black text-white text-base leading-none">{v}</p>
                    <p className="sub-font-body text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container-app py-7 sm:py-10 space-y-10">

          {/* ── Bénéfices ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <BenefitCard Icon={Tag}    title="5% de remise"       description="Sur chaque livraison" />
            <BenefitCard Icon={Gift}   title="Points doublés"     description="Fidélité x2" />
            <BenefitCard Icon={Clock}  title="100% flexible"      description="Modifiable à tout moment" />
            <BenefitCard Icon={Shield} title="Sans engagement"    description="Résiliez sans frais" />
          </motion.div>

          {/* ── ★ SECTION ABONNEMENT SELECTIF ── */}
          <section>
            <div className="mb-5">
              <h2 className="sub-font-display sub-section-line font-black text-xl sm:text-2xl" style={{ color: '#1a1209' }}>
                Composez votre propre panier
              </h2>
              <p className="sub-font-body text-sm mt-3" style={{ color: '#8b5e3c', opacity: 0.75 }}>
                En plus de nos boxes prédéfinies, vous avez la liberté de construire votre abonnement depuis le catalogue.
              </p>
            </div>
            <SelectiveSubscriptionPromo />
          </section>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(139,94,60,0.12)' }} />
            <span className="sub-font-body text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
              style={{ background: 'white', color: '#8b5e3c', border: '1px solid rgba(139,94,60,0.15)' }}>
              Ou choisissez une box
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139,94,60,0.12)' }} />
          </div>

          {/* ── Boxes disponibles ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="sub-font-display sub-section-line font-black text-xl sm:text-2xl" style={{ color: '#1a1209' }}>
                  Boxes disponibles
                </h2>
                <p className="sub-font-body text-xs mt-2" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                  {activeBoxes.length > 0
                    ? `${activeBoxes.length} box${activeBoxes.length > 1 ? 'es' : ''} disponible${activeBoxes.length > 1 ? 's' : ''}`
                    : 'Chargement...'
                  }
                </p>
              </div>
            </div>

            <FilterBar filters={filters} onFilterChange={handleFilterChange} frequencies={frequenciesData} />

            {boxesLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array(10).fill(0).map((_, i) => <BoxCardSkeleton key={i} />)}
              </div>
            )}

            {!boxesLoading && boxesError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 rounded-2xl"
                style={{ background: 'white', border: '1px solid rgba(139,94,60,0.1)' }}>
                <AlertCircle className="h-10 w-10 mb-3" style={{ color: '#dc2626', opacity: 0.5 }} />
                <p className="sub-font-body font-semibold text-sm mb-2" style={{ color: '#1a1209' }}>
                  Chargement impossible
                </p>
                <p className="sub-font-body text-xs mb-5" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                  Nous n'arrivons pas à charger les boxes disponibles.
                </p>
                <button onClick={() => refetchBoxes()}
                  className="sub-font-body font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ background: '#faf7f2', color: '#8b5e3c', border: '1px solid rgba(139,94,60,0.2)' }}>
                  Réessayer
                </button>
              </motion.div>
            )}

            {!boxesLoading && !boxesError && activeBoxes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                style={{ background: 'white', border: '2px dashed rgba(139,94,60,0.2)' }}>
                <ShoppingBag className="h-12 w-12 mb-4" style={{ color: '#8b5e3c', opacity: 0.2 }} />
                <p className="sub-font-display font-black text-lg mb-1" style={{ color: '#1a1209' }}>
                  Aucune box disponible
                </p>
                <p className="sub-font-body text-sm" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                  De nouvelles boxes arrivent bientôt.
                </p>
              </div>
            )}

            {!boxesLoading && !boxesError && activeBoxes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeBoxes.map((box: FoodBox, i: number) => (
                  <motion.div key={box.id}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', damping: 22 }}>
                    <FoodBoxCard
                      box={box}
                      onSubscribe={setSelectedBox}
                      isAlreadySubscribed={subscribedBoxNames.has(box.name)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* ── Mes abonnements ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="sub-font-display sub-section-line font-black text-xl sm:text-2xl" style={{ color: '#1a1209' }}>
                Mes abonnements
              </h2>
              {activeSubs.length > 0 && (
                <span className="sub-font-body text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#f5efe6', color: '#8b5e3c', border: '1px solid rgba(139,94,60,0.15)' }}>
                  {activeSubs.length}
                </span>
              )}
            </div>

            {subsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="sub-skeleton h-24 rounded-2xl" />)}
              </div>
            ) : activeSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 rounded-2xl"
                style={{ background: 'white', border: '2px dashed rgba(139,94,60,0.18)' }}>
                <Package className="h-10 w-10 mb-3" style={{ color: '#8b5e3c', opacity: 0.2 }} />
                <p className="sub-font-body text-sm font-semibold" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                  Aucun abonnement actif
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubs.map((sub: any, i: number) => (
                  <SubscriptionRow
                    key={sub.id}
                    sub={sub}
                    onSuspend={id => suspendMutation.mutate(id)}
                    onResume={id => resumeMutation.mutate(id)}
                    suspending={suspendMutation.isPending}
                    resuming={resumeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      <AnimatePresence>
        {selectedBox && (
          <FoodBoxSubscriptionWizard
            box={selectedBox}
            onClose={() => setSelectedBox(null)}
            onSuccess={handleSubscriptionCreated}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}