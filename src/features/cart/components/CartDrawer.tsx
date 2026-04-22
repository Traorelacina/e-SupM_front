import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShoppingCart, Trash2, Plus, Minus,
  Tag, ArrowRight, Package, Shield, Truck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'

// ============================================================
// STYLES
// ============================================================
const DRAWER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .cdr-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .cdr-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .cdr-item {
    display: flex; gap: 12px;
    background: #faf7f2;
    border: 1px solid rgba(139,94,60,0.1);
    border-radius: 14px;
    padding: 12px;
    transition: background 0.15s;
  }
  .cdr-item:hover { background: #f5efe6; }

  .cdr-qty-btn {
    width: 26px; height: 26px;
    border-radius: 7px;
    border: 1.5px solid rgba(139,94,60,0.2);
    background: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .cdr-qty-btn:hover { background: #f5efe6; border-color: #e8820c; }

  .cdr-coupon-input {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    background: #faf7f2;
    border: 1.5px solid rgba(139,94,60,0.2);
    border-radius: 10px;
    padding: 9px 12px;
    outline: none; flex: 1;
    color: #1a1209;
    transition: border-color 0.15s;
  }
  .cdr-coupon-input:focus { border-color: #e8820c; background: white; }
  .cdr-coupon-input::placeholder { color: rgba(139,94,60,0.35); font-weight: 500; }

  .cdr-scrollbar::-webkit-scrollbar { width: 4px; }
  .cdr-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .cdr-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,94,60,0.2); border-radius: 2px; }
`

export function CartDrawer() {
  const { isOpen, closeCart }   = useCartStore()
  const { cart, summary, updateItem, removeItem, applyCoupon, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [showCoupon, setShowCoupon]   = useState(false)
  const navigate = useNavigate()

  const handleCheckout = () => { closeCart(); navigate('/checkout') }
  const items = cart?.items ?? []

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DRAWER_STYLES }} />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(10,6,2,0.55)', backdropFilter: 'blur(6px)' }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
              style={{
                width: '100%', maxWidth: 420,
                background: 'white',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(139,94,60,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(232,130,12,0.12)' }}>
                    <ShoppingCart className="h-4 w-4" style={{ color: '#e8820c' }} />
                  </div>
                  <div>
                    <h2 className="cdr-font-display font-black text-base" style={{ color: '#1a1209' }}>
                      Mon Panier
                    </h2>
                    <p className="cdr-font-body text-xs" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                      {summary?.items_count ?? 0} article{(summary?.items_count ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: '#faf7f2', color: '#8b5e3c', border: '1px solid rgba(139,94,60,0.15)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto cdr-scrollbar px-5 py-4 space-y-2.5">
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16"
                  >
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                      style={{ background: '#f5efe6' }}>
                      <ShoppingCart className="h-9 w-9" style={{ color: '#8b5e3c', opacity: 0.35 }} />
                    </div>
                    <p className="cdr-font-display font-black text-lg mb-2" style={{ color: '#1a1209' }}>
                      Panier vide
                    </p>
                    <p className="cdr-font-body text-sm mb-6" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                      Ajoutez des produits pour commencer vos courses.
                    </p>
                    <button
                      onClick={() => { closeCart(); navigate('/catalogue') }}
                      className="cdr-font-body font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                      style={{ background: '#e8820c', color: 'white' }}
                    >
                      Explorer le catalogue
                    </button>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map(item => {
                      const product = item.product
                      const imgUrl  = product?.primary_image_url ?? null

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                          className="cdr-item"
                        >
                          {/* Image */}
                          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden"
                            style={{ background: 'white', border: '1px solid rgba(139,94,60,0.1)' }}>
                            {imgUrl
                              ? <img src={imgUrl} alt={product?.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-6 w-6" style={{ color: '#8b5e3c', opacity: 0.25 }} />
                                </div>
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="cdr-font-body text-xs font-semibold line-clamp-2 leading-snug"
                              style={{ color: '#1a1209' }}>
                              {product?.name ?? 'Produit'}
                            </p>
                            {(item.size || item.color) && (
                              <p className="cdr-font-body text-[10px] mt-0.5" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                                {item.size && `Taille: ${item.size}`}
                                {item.color && ` · ${item.color}`}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              {/* Qty controls */}
                              <div className="flex items-center gap-1"
                                style={{ background: 'white', border: '1px solid rgba(139,94,60,0.15)', borderRadius: 9, padding: '2px', display: 'inline-flex' }}>
                                <button className="cdr-qty-btn"
                                  style={{ width: 24, height: 24, borderRadius: 6 }}
                                  onClick={() => item.quantity > 1
                                    ? updateItem({ id: item.id, quantity: item.quantity - 1 })
                                    : removeItem(item.id)
                                  }>
                                  {item.quantity === 1
                                    ? <Trash2 className="h-2.5 w-2.5" style={{ color: '#dc2626' }} />
                                    : <Minus className="h-2.5 w-2.5" style={{ color: '#8b5e3c' }} />
                                  }
                                </button>
                                <span className="cdr-font-body font-bold text-xs w-6 text-center" style={{ color: '#1a1209' }}>
                                  {item.quantity}
                                </span>
                                <button className="cdr-qty-btn"
                                  style={{ width: 24, height: 24, borderRadius: 6 }}
                                  onClick={() => updateItem({ id: item.id, quantity: item.quantity + 1 })}>
                                  <Plus className="h-2.5 w-2.5" style={{ color: '#8b5e3c' }} />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="cdr-font-display font-black text-sm" style={{ color: '#1a1209' }}>
                                  {formatCurrency(item.line_total)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="cdr-font-body text-[9px]" style={{ color: '#8b5e3c', opacity: 0.55 }}>
                                    {formatCurrency(item.price)} / u
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-5 py-5 space-y-4"
                  style={{ borderTop: '1px solid rgba(139,94,60,0.1)', background: 'white' }}>

                  {/* Coupon */}
                  <div>
                    {summary?.coupon_code ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
                          <span className="cdr-font-body text-sm font-bold" style={{ color: '#166534' }}>
                            {summary.coupon_code}
                          </span>
                          <span className="cdr-font-body text-xs" style={{ color: '#16a34a' }}>
                            · -{formatCurrency(summary.coupon_discount)}
                          </span>
                        </div>
                        <button onClick={() => removeCoupon()}
                          className="cdr-font-body text-xs font-semibold" style={{ color: '#dc2626' }}>
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowCoupon(!showCoupon)}
                          className="cdr-font-body flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                          style={{ color: '#e8820c' }}>
                          <Tag className="h-3.5 w-3.5" />
                          {showCoupon ? 'Annuler' : 'Code promo'}
                        </button>
                        <AnimatePresence>
                          {showCoupon && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-2">
                              <div className="flex gap-2">
                                <input value={couponInput}
                                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                  placeholder="CODE PROMO"
                                  className="cdr-coupon-input" />
                                <button
                                  onClick={() => { applyCoupon(couponInput); setShowCoupon(false) }}
                                  disabled={!couponInput}
                                  className="cdr-font-body shrink-0 font-bold text-sm px-4 rounded-xl disabled:opacity-40 transition-all hover:scale-105"
                                  style={{ background: '#e8820c', color: 'white' }}>
                                  OK
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="cdr-font-body text-sm" style={{ color: '#8b5e3c' }}>Sous-total</span>
                      <span className="cdr-font-body text-sm font-semibold" style={{ color: '#1a1209' }}>
                        {formatCurrency(summary?.subtotal ?? 0)}
                      </span>
                    </div>
                    {(summary?.coupon_discount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="cdr-font-body text-sm" style={{ color: '#16a34a' }}>Réduction</span>
                        <span className="cdr-font-body text-sm font-bold" style={{ color: '#16a34a' }}>
                          -{formatCurrency(summary.coupon_discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="cdr-font-body text-sm" style={{ color: '#8b5e3c' }}>Livraison</span>
                      <span className="cdr-font-body text-sm font-semibold"
                        style={{ color: (summary?.delivery_fee ?? 0) === 0 ? '#16a34a' : '#1a1209' }}>
                        {(summary?.delivery_fee ?? 0) === 0 ? 'Gratuite' : formatCurrency(summary!.delivery_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2"
                      style={{ borderTop: '1px solid rgba(139,94,60,0.1)' }}>
                      <span className="cdr-font-display font-black text-base" style={{ color: '#1a1209' }}>Total</span>
                      <span className="cdr-font-display font-black text-lg" style={{ color: '#dc2626' }}>
                        {formatCurrency(summary?.total ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleCheckout}
                    className="cdr-font-body w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-98"
                    style={{ background: '#e8820c', color: 'white', boxShadow: '0 4px 16px rgba(232,130,12,0.38)' }}
                  >
                    Commander · {formatCurrency(summary?.total ?? 0)}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {/* Bottom info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" style={{ color: '#16a34a' }} />
                      <span className="cdr-font-body text-[10px] font-semibold" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                        Paiement sécurisé
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3" style={{ color: '#e8820c' }} />
                      <span className="cdr-font-body text-[10px] font-semibold" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                        Livraison 24-48h
                      </span>
                    </div>
                    <Link
                      to="/cart"
                      onClick={closeCart}
                      className="cdr-font-body text-[10px] font-semibold transition-opacity hover:opacity-75"
                      style={{ color: '#e8820c' }}
                    >
                      Voir le panier
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}