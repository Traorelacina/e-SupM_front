import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, ArrowRight, Trash2, Plus, Minus,
  Package, Truck, Shield, Tag, ChevronRight, Home,
  CreditCard, RefreshCw,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCart, getCartItemImageUrl } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

// ─── Styles ───────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  .cart-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .cart-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  @keyframes cartShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .cart-skeleton {
    background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%);
    background-size: 800px 100%; animation: cartShimmer 1.4s infinite; border-radius: 10px;
  }

  .cart-item {
    background: white; border: 1px solid rgba(139,94,60,0.1);
    border-radius: 16px; padding: 14px; transition: box-shadow 0.2s;
  }
  .cart-item:hover { box-shadow: 0 4px 16px rgba(139,94,60,0.09); }

  .cart-qty-btn {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1.5px solid rgba(139,94,60,0.2); background: #faf7f2;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; color: #8b5e3c;
  }
  .cart-qty-btn:hover:not(:disabled) { background: #f5efe6; border-color: #e8820c; color: #e8820c; }
  .cart-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .cart-remove-btn {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1.5px solid rgba(220,38,38,0.18); background: #fef2f2;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; color: #dc2626;
  }
  .cart-remove-btn:hover { background: #dc2626; color: white; }

  .cart-summary-card {
    background: white; border: 1px solid rgba(139,94,60,0.12);
    border-radius: 20px; padding: 24px;
  }

  .cart-coupon-input {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    background: #faf7f2; border: 1.5px solid rgba(139,94,60,0.2);
    border-radius: 12px; padding: 10px 14px; outline: none; width: 100%;
    color: #1a1209; transition: border-color 0.15s;
  }
  .cart-coupon-input:focus { border-color: #e8820c; background: white; }
  .cart-coupon-input::placeholder { color: rgba(139,94,60,0.35); font-weight: 500; letter-spacing: 0.5px; }

  .cart-section-line { display:inline-block; position:relative; }
  .cart-section-line::after {
    content:''; position:absolute; bottom:-4px; left:0;
    width:35%; height:3px; background:#e8820c; border-radius:2px;
  }

  .cart-feature {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: #faf7f2; border: 1px solid rgba(139,94,60,0.1);
  }
`

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Truck,      label: 'Livraison 24-48h',          sub: 'À Abidjan et environs' },
  { Icon: Shield,     label: 'Paiement sécurisé',          sub: 'Mobile Money · CB' },
  { Icon: RefreshCw,  label: 'Retour sous 48h',            sub: 'Produit défectueux' },
  { Icon: CreditCard, label: 'Paiement à la livraison',    sub: 'Espèces ou Orange Money' },
]

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCart({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: '#f5efe6', border: '1px solid rgba(139,94,60,0.12)' }}>
        <ShoppingCart className="h-10 w-10" style={{ color: '#8b5e3c', opacity: 0.45 }} />
      </div>
      <h2 className="cart-font-display font-black text-2xl mb-2" style={{ color: '#1a1209' }}>
        Votre panier est vide
      </h2>
      <p className="cart-font-body text-sm mb-8 max-w-xs" style={{ color: '#8b5e3c', opacity: 0.7 }}>
        Ajoutez des produits depuis le catalogue pour commencer vos courses.
      </p>
      <button onClick={onNavigate}
        className="cart-font-body flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-2xl transition-all hover:scale-105"
        style={{ background: '#e8820c', color: 'white', boxShadow: '0 4px 16px rgba(232,130,12,0.35)' }}>
        Explorer le catalogue <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

// ─── Cart item card ───────────────────────────────────────────────────────────

function CartItemCard({ item, onUpdate, onRemove, isUpdating }: {
  item: ReturnType<typeof useCart>['cart'] extends null ? never : NonNullable<ReturnType<typeof useCart>['cart']>['items'][number]
  onUpdate: (id: number, qty: number) => void
  onRemove: (id: number) => void
  isUpdating?: boolean
}) {
  const imgUrl    = getCartItemImageUrl(item)
  const unitPrice = item.price ?? item.product?.price ?? 0
  const lineTotal = item.line_total ?? unitPrice * item.quantity

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.22 } }}
      className="cart-item">
      <div className="flex gap-3">
        {/* Image */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden"
          style={{ background: '#f5efe6', border: '1px solid rgba(139,94,60,0.1)' }}>
          {imgUrl
            ? <img src={imgUrl} alt={item.product?.name ?? 'Produit'} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8" style={{ color: '#8b5e3c', opacity: 0.25 }} />
              </div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.product?.category?.name && (
                <p className="cart-font-body text-[9px] font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: '#8b5e3c', opacity: 0.6 }}>
                  {item.product.category.name}
                </p>
              )}
              <h3 className="cart-font-body text-sm font-semibold line-clamp-2 leading-snug"
                style={{ color: '#1a1209' }}>
                {item.product?.name ?? `Produit #${item.product_id}`}
              </h3>
              {(item.size || item.color) && (
                <p className="cart-font-body text-xs mt-0.5" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                  {item.size && `Taille: ${item.size}`}
                  {item.color && ` · ${item.color}`}
                </p>
              )}
            </div>
            <button className="cart-remove-btn shrink-0" onClick={() => onRemove(item.id)} disabled={isUpdating}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            {/* Qty */}
            <div className="flex items-center gap-1.5"
              style={{ background: '#faf7f2', borderRadius: 10, padding: '3px', border: '1px solid rgba(139,94,60,0.15)', display: 'inline-flex' }}>
              <button className="cart-qty-btn" style={{ width: 26, height: 26 }}
                onClick={() => item.quantity > 1 ? onUpdate(item.id, item.quantity - 1) : onRemove(item.id)}
                disabled={isUpdating}>
                {item.quantity === 1
                  ? <Trash2 className="h-3 w-3" style={{ color: '#dc2626' }} />
                  : <Minus className="h-3 w-3" />
                }
              </button>
              <span className="cart-font-body font-bold text-sm w-7 text-center" style={{ color: '#1a1209' }}>
                {item.quantity}
              </span>
              <button className="cart-qty-btn" style={{ width: 26, height: 26 }}
                onClick={() => onUpdate(item.id, item.quantity + 1)}
                disabled={isUpdating}>
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="cart-font-display font-black text-sm" style={{ color: '#1a1209' }}>
                {formatCurrency(lineTotal)}
              </p>
              {item.quantity > 1 && (
                <p className="cart-font-body text-[10px]" style={{ color: '#8b5e3c', opacity: 0.55 }}>
                  {formatCurrency(unitPrice)} / u
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Order summary ────────────────────────────────────────────────────────────

function OrderSummary({ summary, couponInput, setCouponInput, showCoupon, setShowCoupon,
  onApplyCoupon, onRemoveCoupon, onCheckout, isApplyingCoupon }: {
  summary: ReturnType<typeof useCart>['summary']
  couponInput: string; setCouponInput: (v: string) => void
  showCoupon: boolean; setShowCoupon: (v: boolean) => void
  onApplyCoupon: () => void; onRemoveCoupon: () => void; onCheckout: () => void
  isApplyingCoupon?: boolean
}) {
  const subtotal       = summary?.subtotal        ?? 0
  const total          = summary?.total           ?? 0
  const deliveryFee    = summary?.delivery_fee    ?? 0
  const couponCode     = summary?.coupon_code     ?? null
  const couponDiscount = summary?.coupon_discount ?? 0

  return (
    <div className="cart-summary-card sticky top-24">
      <h3 className="cart-font-display font-black text-lg mb-5" style={{ color: '#1a1209' }}>Récapitulatif</h3>

      <div className="space-y-3 mb-5">
        <div className="flex justify-between items-center">
          <span className="cart-font-body text-sm" style={{ color: '#8b5e3c' }}>Sous-total</span>
          <span className="cart-font-body text-sm font-semibold" style={{ color: '#1a1209' }}>
            {formatCurrency(subtotal)}
          </span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between items-center">
            <span className="cart-font-body text-sm" style={{ color: '#16a34a' }}>
              Réduction {couponCode && `(${couponCode})`}
            </span>
            <span className="cart-font-body text-sm font-bold" style={{ color: '#16a34a' }}>
              -{formatCurrency(couponDiscount)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="cart-font-body text-sm" style={{ color: '#8b5e3c' }}>Livraison</span>
          <span className="cart-font-body text-sm font-semibold"
            style={{ color: deliveryFee === 0 ? '#16a34a' : '#1a1209' }}>
            {deliveryFee === 0 ? 'Gratuite' : formatCurrency(deliveryFee)}
          </span>
        </div>
        <div className="h-px" style={{ background: 'rgba(139,94,60,0.1)' }} />
        <div className="flex justify-between items-center">
          <span className="cart-font-display font-black text-base" style={{ color: '#1a1209' }}>Total</span>
          <span className="cart-font-display font-black text-xl" style={{ color: '#dc2626' }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Livraison gratuite hint */}
      {subtotal > 0 && subtotal < 50000 && (
        <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="cart-font-body text-xs font-semibold" style={{ color: '#92400e' }}>
            Plus que {formatCurrency(50000 - subtotal)} pour la livraison gratuite
          </p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,94,60,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (subtotal / 50000) * 100)}%`, background: '#e8820c' }} />
          </div>
        </div>
      )}

      {/* Coupon */}
      <div className="mb-5">
        {couponCode ? (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
              <span className="cart-font-body text-sm font-bold" style={{ color: '#166534' }}>{couponCode}</span>
            </div>
            <button onClick={onRemoveCoupon}
              className="cart-font-body text-xs font-semibold hover:opacity-70"
              style={{ color: '#dc2626' }}>
              Retirer
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowCoupon(!showCoupon)}
              className="cart-font-body flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ color: '#e8820c' }}>
              <Tag className="h-3.5 w-3.5" />
              {showCoupon ? 'Annuler' : 'Ajouter un code promo'}
            </button>
            <AnimatePresence>
              {showCoupon && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                  <div className="flex gap-2">
                    <input value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="CODE PROMO" className="cart-coupon-input" 
                      disabled={isApplyingCoupon} />
                    <button onClick={onApplyCoupon} disabled={!couponInput.trim() || isApplyingCoupon}
                      className="cart-font-body shrink-0 font-bold text-sm px-4 rounded-xl transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#e8820c', color: 'white' }}>
                      {isApplyingCoupon ? '...' : 'OK'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* CTA */}
      <button onClick={onCheckout}
        className="cart-font-body w-full flex items-center justify-center gap-2 font-bold text-sm py-4 rounded-2xl transition-all hover:scale-[1.02]"
        style={{ background: '#e8820c', color: 'white', boxShadow: '0 4px 18px rgba(232,130,12,0.38)' }}>
        Commander · {formatCurrency(total)}
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        <Shield className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
        <span className="cart-font-body text-[10px] font-semibold" style={{ color: '#8b5e3c', opacity: 0.6 }}>
          Paiement 100% sécurisé
        </span>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CartPage() {
  const { cart, summary, isLoading, updateItem, removeItem, applyCoupon, removeCoupon, isUpdating, isRemoving, error, refetch } = useCart()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [couponInput, setCouponInput] = useState('')
  const [showCoupon, setShowCoupon]   = useState(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const items   = cart?.items ?? []
  const isEmpty = !isLoading && items.length === 0

  // Gérer l'application du coupon
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || isApplyingCoupon) return
    setIsApplyingCoupon(true)
    try {
      await applyCoupon(couponInput)
      setCouponInput('')
      setShowCoupon(false)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // Recharger automatiquement en cas d'erreur
  useEffect(() => {
    if (error && isAuthenticated) {
      console.log('Erreur de chargement du panier, tentative de rechargement...')
      const timer = setTimeout(() => refetch(), 2000)
      return () => clearTimeout(timer)
    }
  }, [error, isAuthenticated, refetch])

  if (isLoading) {
    return (
      <div className="cart-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
        <div className="container-app py-5 sm:py-8">
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="cart-skeleton h-28 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="container-app py-5 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: '#8b5e3c', opacity: 0.75 }}>
          <Link to="/" className="flex items-center gap-1 hover:opacity-100 transition-opacity">
            <Home className="h-3 w-3" /> Accueil
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-bold" style={{ color: '#1a1209', opacity: 1 }}>Mon Panier</span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="cart-font-display cart-section-line font-black"
            style={{ fontSize: 'clamp(22px, 4vw, 30px)', color: '#1a1209' }}>
            Mon Panier
          </h1>
          {!isEmpty && (
            <span className="cart-font-body text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: '#f5efe6', color: '#8b5e3c', border: '1px solid rgba(139,94,60,0.15)' }}>
              {summary?.items_count ?? items.reduce((s, i) => s + i.quantity, 0)} article{(summary?.items_count ?? 1) !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm" style={{ color: '#dc2626' }}>
              Erreur de chargement du panier. 
              <button onClick={() => refetch()} className="ml-2 font-semibold underline">
                Réessayer
              </button>
            </p>
          </div>
        )}

        {isEmpty ? (
          <EmptyCart onNavigate={() => navigate('/catalogue')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <CartItemCard key={item.id} item={item}
                    onUpdate={(id, qty) => updateItem({ id, quantity: qty })}
                    onRemove={id => removeItem(id)}
                    isUpdating={isUpdating || isRemoving}
                  />
                ))}
              </AnimatePresence>

              <div className="pt-2">
                <Link to="/catalogue"
                  className="cart-font-body inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: '#e8820c' }}>
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Continuer mes achats
                </Link>
              </div>

              {/* Features mobile */}
              <div className="grid grid-cols-2 gap-2 mt-4 lg:hidden">
                {FEATURES.map(({ Icon, label, sub }) => (
                  <div key={label} className="cart-feature">
                    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(232,130,12,0.1)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#e8820c' }} />
                    </div>
                    <div>
                      <p className="cart-font-body text-[10px] font-bold leading-tight" style={{ color: '#1a1209' }}>{label}</p>
                      <p className="cart-font-body text-[9px] leading-tight hidden sm:block" style={{ color: '#8b5e3c', opacity: 0.6 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                summary={summary}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                showCoupon={showCoupon}
                setShowCoupon={setShowCoupon}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={removeCoupon}
                onCheckout={() => navigate('/checkout')}
                isApplyingCoupon={isApplyingCoupon}
              />
              {/* Features desktop */}
              <div className="hidden lg:grid grid-cols-1 gap-2 mt-4">
                {FEATURES.map(({ Icon, label, sub }) => (
                  <div key={label} className="cart-feature">
                    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(232,130,12,0.1)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#e8820c' }} />
                    </div>
                    <div>
                      <p className="cart-font-body text-[10px] font-bold" style={{ color: '#1a1209' }}>{label}</p>
                      <p className="cart-font-body text-[9px]" style={{ color: '#8b5e3c', opacity: 0.6 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}