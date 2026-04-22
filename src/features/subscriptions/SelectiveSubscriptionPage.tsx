import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, Trash2, Check, ChevronRight, ChevronLeft,
  Search, Filter, X, ToggleLeft, ToggleRight, ShoppingBasket,
  Calendar, CreditCard, Truck, RefreshCw, Pause, AlertCircle,
  Package, ArrowRight, Layers, Clock, Shield, Tag, Star,
} from 'lucide-react'
import { productApi, selectiveSubscriptionApi, storageUrl } from '@/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast, ToastContainer } from '@/hooks/useToast'
import { useNormalizedProducts } from '@/hooks/useNormalizedProducts'
import type { Product } from '@/types'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface CartItem {
  product: Product
  quantity: number
  is_active: boolean
}

interface SelectiveSubscription {
  id: number
  name: string
  status: 'active' | 'suspended' | 'cancelled'
  frequency: 'weekly' | 'biweekly' | 'monthly'
  delivery_type: 'home' | 'click_collect' | 'locker'
  payment_method: 'auto' | 'manual'
  discount_percent: number
  subtotal: number
  total: number
  next_delivery_at: string | null
  active_items_count: number
  items_count: number
  items: Array<{
    id: number
    product_id: number
    quantity: number
    price: number
    is_active: boolean
    line_total: number
    product: {
      id: number
      name: string
      slug: string
      price: number
      in_stock: boolean
      primary_image_url: string | null
      category: { id: number; name: string } | null
    } | null
  }>
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const FREQ_OPTIONS = [
  { value: 'weekly',   label: 'Chaque semaine',       desc: 'Livraison tous les 7 jours' },
  { value: 'biweekly', label: 'Toutes les 2 semaines', desc: 'Livraison bi-mensuelle' },
  { value: 'monthly',  label: 'Chaque mois',           desc: 'Livraison mensuelle' },
]

const DELIVERY_OPTIONS = [
  { value: 'home',          label: 'A domicile',     Icon: Truck },
  { value: 'click_collect', label: 'Click & Collect', Icon: Package },
  { value: 'locker',        label: 'Casier',          Icon: Layers },
]

const PAYMENT_OPTIONS = [
  { value: 'auto',   label: 'Paiement automatique', desc: 'Débité à chaque cycle' },
  { value: 'manual', label: 'Paiement manuel',       desc: 'Vous validez chaque commande' },
]

const STATUS_CFG = {
  active:    { label: 'Actif',      bg: '#dcfce7', fg: '#15803d', dot: '#22c55e' },
  suspended: { label: 'Suspendu',   bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  cancelled: { label: 'Annulé',     bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  pending:   { label: 'En attente', bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Hebdomadaire', biweekly: 'Bi-mensuel', monthly: 'Mensuel',
}
const DELIVERY_LABELS: Record<string, string> = {
  home: 'Domicile', click_collect: 'Click & Collect', locker: 'Casier',
}
const PAYMENT_LABELS: Record<string, string> = {
  auto: 'Automatique', manual: 'Manuel',
}

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  .sel-display { font-family: 'Syne', sans-serif; }
  .sel-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .sel-toggle-on  { background: #16a34a; }
  .sel-toggle-off { background: #d1d5db; }

  .sel-card-hover { transition: box-shadow 0.2s, transform 0.2s; }
  .sel-card-hover:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }

  .sel-step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    transition: all 0.3s;
  }
  .sel-step-dot.active  { background: #1a1209; color: white; }
  .sel-step-dot.done    { background: #16a34a; color: white; }
  .sel-step-dot.pending { background: #e5e7eb; color: #9ca3af; }

  .sel-qty-btn {
    width: 28px; height: 28px; border-radius: 8px; display: flex;
    align-items: center; justify-content: center; transition: all 0.15s;
    border: 1.5px solid #e5e7eb; background: white; cursor: pointer;
  }
  .sel-qty-btn:hover { border-color: #1a1209; background: #faf7f2; }

  .sel-product-card { border-radius: 14px; overflow: hidden; background: white;
    border: 1.5px solid #f0ede8; transition: all 0.2s; cursor: pointer; }
  .sel-product-card:hover { border-color: #e8820c; box-shadow: 0 4px 16px rgba(232,130,12,0.12); }
  .sel-product-card.selected { border-color: #16a34a; box-shadow: 0 4px 16px rgba(22,163,74,0.15); }

  .sel-option-pill {
    border-radius: 12px; border: 2px solid #e5e7eb; padding: 10px 16px;
    cursor: pointer; transition: all 0.2s; background: white;
  }
  .sel-option-pill.active { border-color: #1a1209; background: #faf7f2; }
  .sel-option-pill:hover:not(.active) { border-color: #d4c9b8; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sel-animate { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
`

// ─────────────────────────────────────────────────────────────
// TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'sel-toggle-on' : 'sel-toggle-off'}`}
      style={{ width: 40, height: 22 }}>
      <span className="sr-only">{checked ? 'Désactiver' : 'Activer'}</span>
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// PRODUCT MINI CARD (catalogue de sélection)
// ─────────────────────────────────────────────────────────────
function ProductPickCard({
  product, cartItem, onAdd, onUpdate,
}: {
  product: Product
  cartItem?: CartItem
  onAdd: (p: Product) => void
  onUpdate: (productId: number, qty: number) => void
}) {
  const inCart = !!cartItem
  const qty    = cartItem?.quantity ?? 0

  return (
    <div
      onClick={() => !inCart && product.in_stock && onAdd(product)}
      className={`sel-product-card ${inCart ? 'selected' : ''} ${!product.in_stock ? 'opacity-50' : ''}`}
      style={{ position: 'relative' }}>
      {/* Image */}
      <div style={{ aspectRatio: '4/3', background: '#faf7f2', position: 'relative', overflow: 'hidden' }}>
        {product.primary_image_url
          ? <img src={product.primary_image_url} alt={product.name}
              className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center">
              <ShoppingBasket className="h-8 w-8" style={{ color: '#c49a51', opacity: 0.4 }} />
            </div>
        }
        {inCart && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(22,163,74,0.12)' }}>
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="text-white text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)' }}>Epuise</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="sel-body text-[10px] font-semibold truncate" style={{ color: '#8b5e3c', opacity: 0.7 }}>
          {product.category?.name ?? ''}
        </p>
        <p className="sel-body text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#1a1209', minHeight: 32 }}>
          {product.name}
        </p>
        <p className="sel-display text-sm font-bold mt-1" style={{ color: '#e8820c' }}>
          {formatCurrency(product.price)}
        </p>

        {/* Qty control */}
        {inCart && (
          <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
            <button className="sel-qty-btn" onClick={() => onUpdate(product.id, qty - 1)}>
              <Minus className="h-3 w-3" style={{ color: '#1a1209' }} />
            </button>
            <span className="sel-body text-sm font-bold flex-1 text-center" style={{ color: '#1a1209' }}>{qty}</span>
            <button className="sel-qty-btn" onClick={() => onUpdate(product.id, qty + 1)}>
              <Plus className="h-3 w-3" style={{ color: '#1a1209' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CART ITEM ROW (panier de l'abonnement)
// ─────────────────────────────────────────────────────────────
function CartItemRow({
  item, onQtyChange, onToggle, onRemove,
}: {
  item: CartItem
  onQtyChange: (productId: number, qty: number) => void
  onToggle: (productId: number) => void
  onRemove: (productId: number) => void
}) {
  const { product, quantity, is_active } = item

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: is_active ? 'white' : '#f9f9f9', border: `1.5px solid ${is_active ? '#f0ede8' : '#e5e7eb'}`, opacity: is_active ? 1 : 0.65 }}>
      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: '#faf7f2' }}>
        {product.primary_image_url
          ? <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5" style={{ color: '#c49a51', opacity: 0.5 }} />
            </div>
        }
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="sel-body text-xs font-semibold line-clamp-1" style={{ color: '#1a1209' }}>{product.name}</p>
        <p className="sel-body text-[10px] mt-0.5" style={{ color: '#8b5e3c', opacity: 0.65 }}>
          {formatCurrency(product.price)} / unité
        </p>
      </div>

      {/* Qty */}
      <div className="flex items-center gap-1.5">
        <button className="sel-qty-btn" onClick={() => onQtyChange(product.id, quantity - 1)}>
          <Minus className="h-3 w-3" />
        </button>
        <span className="sel-body text-xs font-bold w-6 text-center" style={{ color: '#1a1209' }}>{quantity}</span>
        <button className="sel-qty-btn" onClick={() => onQtyChange(product.id, quantity + 1)}>
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Total */}
      <p className="sel-display text-xs font-bold w-16 text-right shrink-0" style={{ color: is_active ? '#16a34a' : '#9ca3af' }}>
        {is_active ? formatCurrency(product.price * quantity) : '—'}
      </p>

      {/* Toggle */}
      <Toggle checked={is_active} onChange={() => onToggle(product.id)} />

      {/* Remove */}
      <button onClick={() => onRemove(product.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
        <Trash2 className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
      </button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// WIZARD : CREATION D'UN ABONNEMENT SELECTIF
// ─────────────────────────────────────────────────────────────
function CreateSelectiveWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [config, setConfig] = useState({
    name: '',
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
    delivery_type: 'home' as 'home' | 'click_collect' | 'locker',
    payment_method: 'manual' as 'auto' | 'manual',
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Charger les produits
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'selective', search, categoryFilter],
    queryFn: () => productApi.list({
      q: search || undefined,
      category: categoryFilter || undefined,
      per_page: 40,
    }).then((r: any) => r.data ?? r),
    staleTime: 1000 * 60 * 5,
  })

  const products = useNormalizedProducts(productsData?.data ?? productsData)

  // Categories from products
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    products.forEach((p: Product) => {
      if (p.category) seen.set(p.category.slug ?? p.category.name, p.category.name)
    })
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }))
  }, [products])

  const mutation = useMutation({
    mutationFn: (payload: any) => selectiveSubscriptionApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selective-subscriptions'] })
      onSuccess()
    },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la creation de l\'abonnement' }),
  })

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      if (prev.find(i => i.product.id === product.id)) return prev
      return [...prev, { product, quantity: 1, is_active: true }]
    })
  }, [])

  const updateQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
    } else {
      setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.min(qty, 99) } : i))
    }
  }, [])

  const toggleItem = useCallback((productId: number) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, is_active: !i.is_active } : i))
  }, [])

  const removeItem = useCallback((productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const activeItems = cart.filter(i => i.is_active)
  const subtotal   = activeItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const discount   = 5
  const total      = subtotal * (1 - discount / 100)

  const handleSubmit = () => {
    if (cart.length === 0) { toast({ type: 'error', message: 'Ajoutez au moins un produit.' }); return }
    mutation.mutate({
      ...config,
      name: config.name || 'Mon panier selectif',
      items: cart.map(i => ({
        product_id: i.product.id,
        quantity:   i.quantity,
        is_active:  i.is_active,
      })),
    })
  }

  const STEPS = [
    { n: 1, label: 'Produits' },
    { n: 2, label: 'Panier' },
    { n: 3, label: 'Paramètres' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,18,9,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#faf7f2', maxHeight: '90vh', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ background: '#1a1209', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="sel-display text-white font-bold text-base">Créer un abonnement sélectif</h2>
            <p className="sel-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Composez votre panier, nous livrons automatiquement
            </p>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.n} className="flex items-center gap-1.5">
                <div className={`sel-step-dot ${step > s.n ? 'done' : step === s.n ? 'active' : 'pending'}`}
                  style={step === s.n ? { background: '#e8820c' } : {}}>
                  {step > s.n ? <Check className="h-3 w-3" /> : s.n}
                </div>
                <span className="sel-body text-[10px] hidden sm:inline"
                  style={{ color: step >= s.n ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className="w-6 h-px mx-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
            ))}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* STEP 1 : Catalogue */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-5 space-y-4">
                {/* Search + filter */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border"
                    style={{ background: 'white', borderColor: '#e5e7eb' }}>
                    <Search className="h-4 w-4 shrink-0" style={{ color: '#8b5e3c', opacity: 0.5 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher un produit..."
                      className="sel-body flex-1 bg-transparent text-sm outline-none" style={{ color: '#1a1209' }} />
                    {search && <button onClick={() => setSearch('')}><X className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} /></button>}
                  </div>
                </div>

                {/* Category chips */}
                {categories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    <button onClick={() => setCategoryFilter('')}
                      className="sel-body text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all"
                      style={!categoryFilter ? { background: '#1a1209', color: 'white' } : { background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280' }}>
                      Tout
                    </button>
                    {categories.map(cat => (
                      <button key={cat.slug} onClick={() => setCategoryFilter(c => c === cat.slug ? '' : cat.slug)}
                        className="sel-body text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all"
                        style={categoryFilter === cat.slug ? { background: '#e8820c', color: 'white' } : { background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280' }}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Cart summary bar */}
                {cart.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: '#1a1209' }}>
                    <div className="flex items-center gap-2">
                      <ShoppingBasket className="h-4 w-4 text-amber-400" />
                      <span className="sel-body text-xs font-semibold text-white">
                        {cart.length} produit{cart.length > 1 ? 's' : ''} sélectionné{cart.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="sel-display text-sm font-bold text-amber-400">
                      {formatCurrency(cart.reduce((s, i) => s + i.product.price * i.quantity, 0))} /cycle
                    </span>
                  </div>
                )}

                {/* Products grid */}
                {isLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {Array(12).fill(0).map((_, i) => (
                      <div key={i} className="rounded-xl bg-stone-100 animate-pulse" style={{ aspectRatio: '3/4' }} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {products.map((p: Product) => (
                      <ProductPickCard
                        key={p.id}
                        product={p}
                        cartItem={cart.find(i => i.product.id === p.id)}
                        onAdd={addToCart}
                        onUpdate={updateQty}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2 : Revue du panier */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-5 space-y-4">
                <div>
                  <h3 className="sel-display font-bold text-base mb-1" style={{ color: '#1a1209' }}>
                    Votre panier sélectif
                  </h3>
                  <p className="sel-body text-xs" style={{ color: '#8b5e3c', opacity: 0.7 }}>
                    Activez ou désactivez chaque article pour ce cycle. Vous pourrez ajuster à tout moment.
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <ShoppingBasket className="h-10 w-10" style={{ color: '#c49a51', opacity: 0.4 }} />
                    <p className="sel-body text-sm text-center" style={{ color: '#9ca3af' }}>
                      Votre panier est vide. Retournez à l'étape 1 pour ajouter des produits.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-2">
                      {cart.map(item => (
                        <CartItemRow
                          key={item.product.id}
                          item={item}
                          onQtyChange={updateQty}
                          onToggle={toggleItem}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="rounded-xl p-4 space-y-2"
                    style={{ background: 'white', border: '1.5px solid #f0ede8' }}>
                    <div className="flex justify-between text-sm">
                      <span className="sel-body" style={{ color: '#6b7280' }}>
                        Sous-total ({activeItems.length} article actif)
                      </span>
                      <span className="sel-body font-semibold" style={{ color: '#1a1209' }}>
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="sel-body text-green-700">Remise abonnement (-{discount}%)</span>
                      <span className="sel-body font-semibold text-green-700">
                        -{formatCurrency(subtotal * discount / 100)}
                      </span>
                    </div>
                    <div className="h-px" style={{ background: '#f0ede8' }} />
                    <div className="flex justify-between">
                      <span className="sel-display font-bold" style={{ color: '#1a1209' }}>Total / cycle</span>
                      <span className="sel-display text-lg font-bold" style={{ color: '#e8820c' }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3 : Configuration */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-5 space-y-5">

                {/* Nom */}
                <div>
                  <label className="sel-body text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{ color: '#8b5e3c' }}>
                    Nom de l'abonnement
                  </label>
                  <input
                    value={config.name}
                    onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                    placeholder="Ex: Mon panier hebdomadaire"
                    className="sel-body w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: 'white', borderColor: '#e5e7eb', color: '#1a1209' }} />
                </div>

                {/* Frequence */}
                <div>
                  <label className="sel-body text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{ color: '#8b5e3c' }}>
                    Fréquence de livraison
                  </label>
                  <div className="space-y-2">
                    {FREQ_OPTIONS.map(opt => (
                      <div key={opt.value}
                        onClick={() => setConfig(c => ({ ...c, frequency: opt.value as any }))}
                        className={`sel-option-pill flex items-center justify-between ${config.frequency === opt.value ? 'active' : ''}`}>
                        <div>
                          <p className="sel-body text-sm font-semibold" style={{ color: '#1a1209' }}>{opt.label}</p>
                          <p className="sel-body text-xs" style={{ color: '#9ca3af' }}>{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${config.frequency === opt.value ? 'border-amber-600 bg-amber-600' : 'border-gray-300'}`}>
                          {config.frequency === opt.value && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Livraison */}
                <div>
                  <label className="sel-body text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{ color: '#8b5e3c' }}>
                    Mode de livraison
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DELIVERY_OPTIONS.map(opt => (
                      <div key={opt.value}
                        onClick={() => setConfig(c => ({ ...c, delivery_type: opt.value as any }))}
                        className={`sel-option-pill flex flex-col items-center gap-1.5 py-3 ${config.delivery_type === opt.value ? 'active' : ''}`}>
                        <opt.Icon className="h-5 w-5" style={{ color: config.delivery_type === opt.value ? '#e8820c' : '#9ca3af' }} />
                        <span className="sel-body text-xs font-semibold text-center" style={{ color: '#1a1209' }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paiement */}
                <div>
                  <label className="sel-body text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{ color: '#8b5e3c' }}>
                    Mode de paiement
                  </label>
                  <div className="space-y-2">
                    {PAYMENT_OPTIONS.map(opt => (
                      <div key={opt.value}
                        onClick={() => setConfig(c => ({ ...c, payment_method: opt.value as any }))}
                        className={`sel-option-pill flex items-center justify-between ${config.payment_method === opt.value ? 'active' : ''}`}>
                        <div>
                          <p className="sel-body text-sm font-semibold" style={{ color: '#1a1209' }}>{opt.label}</p>
                          <p className="sel-body text-xs" style={{ color: '#9ca3af' }}>{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${config.payment_method === opt.value ? 'border-amber-600 bg-amber-600' : 'border-gray-300'}`}>
                          {config.payment_method === opt.value && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Résumé final */}
                <div className="rounded-xl p-4" style={{ background: '#1a1209' }}>
                  <p className="sel-display text-white font-bold text-sm mb-3">Résumé de votre abonnement</p>
                  <div className="space-y-2">
                    {[
                      ['Produits', `${cart.length} (${activeItems.length} actifs)`],
                      ['Total / cycle', formatCurrency(total)],
                      ['Fréquence', FREQ_LABELS[config.frequency]],
                      ['Livraison', DELIVERY_LABELS[config.delivery_type]],
                      ['Paiement', PAYMENT_LABELS[config.payment_method]],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="sel-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
                        <span className="sel-body text-xs font-semibold text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-t"
          style={{ background: 'white', borderColor: '#f0ede8' }}>
          <button
            onClick={() => step > 1 ? setStep(s => (s - 1) as any) : onClose()}
            className="sel-body flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            style={{ background: '#f5efe6', color: '#8b5e3c' }}>
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          <div className="flex items-center gap-2">
            {cart.length > 0 && step === 1 && (
              <span className="sel-body text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#dcfce7', color: '#15803d' }}>
                {cart.length} produit{cart.length > 1 ? 's' : ''}
              </span>
            )}
            {step < 3 ? (
              <button
                onClick={() => step === 1 && cart.length === 0
                  ? toast({ type: 'error', message: 'Ajoutez au moins un produit.' })
                  : setStep(s => (s + 1) as any)
                }
                className="sel-body flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                style={{ background: '#e8820c', color: 'white' }}>
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="sel-body flex items-center gap-1.5 text-sm font-bold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#16a34a', color: 'white' }}>
                {mutation.isPending ? 'Création...' : 'Créer l\'abonnement'}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION CARD (liste des abonnements sélectifs actifs)
// ─────────────────────────────────────────────────────────────
function SubscriptionCard({
  sub, onSuspend, onResume, onCancel, suspending, resuming,
}: {
  sub: SelectiveSubscription
  onSuspend: (id: number) => void
  onResume:  (id: number) => void
  onCancel:  (id: number) => void
  suspending: boolean
  resuming:   boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_CFG[sub.status] ?? STATUS_CFG.pending

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'white', border: '1.5px solid #f0ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="sel-display font-bold text-sm" style={{ color: '#1a1209' }}>{sub.name}</h3>
              {/* Status badge */}
              <span className="sel-body text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: sc.bg, color: sc.fg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                {sc.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: FREQ_LABELS[sub.frequency] ?? sub.frequency, Icon: Calendar },
                { label: DELIVERY_LABELS[sub.delivery_type] ?? sub.delivery_type, Icon: Truck },
                { label: PAYMENT_LABELS[sub.payment_method] ?? sub.payment_method, Icon: CreditCard },
                { label: `${sub.active_items_count}/${sub.items_count} articles`, Icon: Package },
              ].map(({ label, Icon }) => (
                <span key={label} className="sel-body text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: '#faf7f2', color: '#8b5e3c' }}>
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="sel-display font-black text-base" style={{ color: '#e8820c' }}>
              {formatCurrency(sub.total)}
            </p>
            <p className="sel-body text-[10px]" style={{ color: '#9ca3af' }}>/cycle</p>
            {sub.next_delivery_at && (
              <p className="sel-body text-[10px] mt-1 font-semibold" style={{ color: '#16a34a' }}>
                Prochaine : {formatDate(sub.next_delivery_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded : articles */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="px-4 pb-2" style={{ borderTop: '1px solid #f5efe6' }}>
              <div className="pt-3 space-y-1.5">
                {sub.items.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg"
                    style={{ background: item.is_active ? '#f9fdf9' : '#f9f9f9', opacity: item.is_active ? 1 : 0.6 }}>
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: '#faf7f2' }}>
                      {item.product?.primary_image_url
                        ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" />
                        : <Package className="h-4 w-4 m-2" style={{ color: '#c49a51', opacity: 0.5 }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="sel-body text-xs font-semibold truncate" style={{ color: '#1a1209' }}>
                        {item.product?.name ?? 'Produit inconnu'}
                      </p>
                    </div>
                    <span className="sel-body text-[10px]" style={{ color: '#9ca3af' }}>x{item.quantity}</span>
                    <span className="sel-display text-xs font-bold" style={{ color: item.is_active ? '#16a34a' : '#9ca3af' }}>
                      {item.is_active ? formatCurrency(item.line_total) : '—'}
                    </span>
                    <span className="sel-body text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: item.is_active ? '#dcfce7' : '#f3f4f6', color: item.is_active ? '#15803d' : '#9ca3af' }}>
                      {item.is_active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: '1px solid #f5efe6' }}>
        <button onClick={() => setExpanded(e => !e)}
          className="sel-body flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: '#faf7f2', color: '#8b5e3c' }}>
          {expanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? 'Réduire' : 'Voir les articles'}
        </button>
        <div className="flex-1" />
        {sub.status === 'active' && (
          <button
            onClick={() => onSuspend(sub.id)}
            disabled={suspending}
            className="sel-body flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#fef3c7', color: '#92400e' }}>
            <Pause className="h-3 w-3" />
            Suspendre
          </button>
        )}
        {sub.status === 'suspended' && (
          <button
            onClick={() => onResume(sub.id)}
            disabled={resuming}
            className="sel-body flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#dcfce7', color: '#15803d' }}>
            <RefreshCw className="h-3 w-3" />
            Réactiver
          </button>
        )}
        {sub.status !== 'cancelled' && (
          <button
            onClick={() => onCancel(sub.id)}
            className="sel-body flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#fee2e2', color: '#991b1b' }}>
            <X className="h-3 w-3" />
            Annuler
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function SelectiveSubscriptionPage() {
  const [showWizard, setShowWizard] = useState(false)
  const { toast, toasts, removeToast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['selective-subscriptions'],
    queryFn: () => selectiveSubscriptionApi.list().then((r: any) => r.data ?? r),
    staleTime: 1000 * 60 * 2,
  })

  const subscriptions: SelectiveSubscription[] = Array.isArray(data) ? data : (data?.data ?? [])

  const suspendMutation = useMutation({
    mutationFn: (id: number) => selectiveSubscriptionApi.suspend(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['selective-subscriptions'] }); toast({ type: 'success', message: 'Abonnement suspendu.' }) },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la suspension.' }),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: number) => selectiveSubscriptionApi.resume(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['selective-subscriptions'] }); toast({ type: 'success', message: 'Abonnement réactivé.' }) },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la réactivation.' }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => selectiveSubscriptionApi.cancel(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['selective-subscriptions'] }); toast({ type: 'success', message: 'Abonnement annulé.' }) },
    onError: () => toast({ type: 'error', message: 'Erreur lors de l\'annulation.' }),
  })

  const activeSubs   = subscriptions.filter(s => s.status === 'active')
  const inactiveSubs = subscriptions.filter(s => s.status !== 'active')
  const canCreate    = activeSubs.length < 3

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="min-h-screen sel-body" style={{ background: '#faf7f2' }}>

        {/* Hero */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1209 0%, #3a2210 50%, #8b5e3c 100%)' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #e8820c 0%, transparent 70%)' }} />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <span className="sel-body text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block"
                  style={{ background: 'rgba(232,130,12,0.2)', color: '#f5a623' }}>
                  Panier personnalise
                </span>
                <h1 className="sel-display text-2xl sm:text-3xl font-bold text-white leading-tight mt-2">
                  Abonnement sélectif
                </h1>
                <p className="sel-body text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Composez votre panier depuis le catalogue. Activez ou désactivez chaque produit par cycle.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {[
                    { Icon: Tag,      label: '5% de remise sur chaque cycle' },
                    { Icon: Clock,    label: 'Modifiable à tout moment' },
                    { Icon: Shield,   label: 'Sans engagement' },
                  ].map(({ Icon, label }) => (
                    <span key={label} className="sel-body flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
                      <Icon className="h-3 w-3" style={{ color: '#f5a623' }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {canCreate && (
                <button
                  onClick={() => setShowWizard(true)}
                  className="sel-display flex items-center gap-2 font-bold text-sm px-6 py-3.5 rounded-2xl shrink-0 transition-all hover:opacity-90"
                  style={{ background: '#e8820c', color: 'white', boxShadow: '0 8px 24px rgba(232,130,12,0.35)' }}>
                  <Plus className="h-4 w-4" />
                  Créer un panier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Abonnements actifs', value: activeSubs.length, max: '/ 3' },
              { label: 'Total / cycle', value: formatCurrency(activeSubs.reduce((s, sub) => s + sub.total, 0)), max: '' },
              { label: 'Articles actifs', value: activeSubs.reduce((s, sub) => s + sub.active_items_count, 0), max: 'articles' },
            ].map(({ label, value, max }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ background: 'white', border: '1.5px solid #f0ede8' }}>
                <p className="sel-body text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: '#8b5e3c', opacity: 0.65 }}>{label}</p>
                <p className="sel-display text-xl font-bold" style={{ color: '#1a1209' }}>
                  {value} <span className="text-sm font-normal" style={{ color: '#9ca3af' }}>{max}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Abonnements actifs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="sel-display font-bold text-base" style={{ color: '#1a1209' }}>
                Mes abonnements sélectifs
              </h2>
              {!canCreate && (
                <span className="sel-body text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#fef3c7', color: '#92400e' }}>
                  Maximum atteint (3/3)
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse bg-stone-100" />)}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center justify-center py-16 gap-4"
                style={{ background: 'white', border: '2px dashed #e5e7eb' }}>
                <ShoppingBasket className="h-12 w-12" style={{ color: '#c49a51', opacity: 0.35 }} />
                <div className="text-center">
                  <p className="sel-display font-bold text-base" style={{ color: '#1a1209' }}>
                    Aucun abonnement sélectif
                  </p>
                  <p className="sel-body text-sm mt-1" style={{ color: '#9ca3af' }}>
                    Créez votre premier panier personnalisé depuis le catalogue.
                  </p>
                </div>
                <button onClick={() => setShowWizard(true)}
                  className="sel-display flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                  style={{ background: '#e8820c', color: 'white' }}>
                  <Plus className="h-4 w-4" /> Créer mon panier
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubs.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    onSuspend={id => suspendMutation.mutate(id)}
                    onResume={id => resumeMutation.mutate(id)}
                    onCancel={id => cancelMutation.mutate(id)}
                    suspending={suspendMutation.isPending}
                    resuming={resumeMutation.isPending}
                  />
                ))}
                {inactiveSubs.length > 0 && (
                  <>
                    <p className="sel-body text-xs font-semibold uppercase tracking-wider pt-2"
                      style={{ color: '#9ca3af' }}>Inactifs</p>
                    {inactiveSubs.map(sub => (
                      <SubscriptionCard
                        key={sub.id}
                        sub={sub}
                        onSuspend={id => suspendMutation.mutate(id)}
                        onResume={id => resumeMutation.mutate(id)}
                        onCancel={id => cancelMutation.mutate(id)}
                        suspending={suspendMutation.isPending}
                        resuming={resumeMutation.isPending}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showWizard && (
          <CreateSelectiveWizard
            onClose={() => setShowWizard(false)}
            onSuccess={() => {
              setShowWizard(false)
              queryClient.invalidateQueries({ queryKey: ['selective-subscriptions'] })
              toast({ type: 'success', message: 'Abonnement selectif cree avec succes !' })
            }}
          />
        )}
      </AnimatePresence>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}