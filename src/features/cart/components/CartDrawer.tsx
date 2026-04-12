import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight, Package } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/data/EmptyState'

export function CartDrawer() {
  const { isOpen, closeCart } = useCartStore()
  const { cart, summary, updateItem, removeItem, applyCoupon, removeCoupon, isAdding } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)
  const navigate = useNavigate()

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 font-display">Mon Panier</h2>
                  <p className="text-xs text-stone-500">
                    {summary?.items_count ?? 0} article{(summary?.items_count ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-3">
              {!cart?.items || cart.items.length === 0 ? (
                <EmptyState
                  emoji="🛒"
                  title="Votre panier est vide"
                  description="Ajoutez des produits depuis le catalogue pour commencer vos courses."
                  action={
                    <Button variant="orange" onClick={() => { closeCart(); navigate('/catalogue') }}>
                      Explorer le catalogue
                    </Button>
                  }
                />
              ) : (
                cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 bg-stone-50 rounded-2xl p-3"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl bg-white border border-stone-100 overflow-hidden shrink-0">
                      {item.product?.primary_image_url ? (
                        <img
                          src={item.product.primary_image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug">
                        {item.product?.name ?? 'Produit'}
                      </p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {item.size && `Taille: ${item.size}`}
                          {item.color && ` · ${item.color}`}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-stone-200">
                          <button
                            onClick={() => item.quantity > 1
                              ? updateItem({ id: item.id, quantity: item.quantity - 1 })
                              : removeItem(item.id)
                            }
                            className="p-1.5 hover:bg-stone-50 rounded-l-xl text-stone-600 transition-colors"
                          >
                            {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-stone-900">{item.quantity}</span>
                          <button
                            onClick={() => updateItem({ id: item.id, quantity: item.quantity + 1 })}
                            className="p-1.5 hover:bg-stone-50 rounded-r-xl text-stone-600 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-stone-900">{formatCurrency(item.line_total)}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-stone-400">{formatCurrency(item.price)} / u</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart?.items && cart.items.length > 0 && (
              <div className="border-t border-stone-100 px-6 py-5 space-y-4 bg-white">
                {/* Coupon */}
                <div>
                  {summary?.coupon_code ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Tag className="h-4 w-4" />
                        <span className="text-sm font-semibold">{summary.coupon_code}</span>
                        <span className="text-xs">· -{formatCurrency(summary.coupon_discount)}</span>
                      </div>
                      <button onClick={() => removeCoupon()} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCoupon(!showCoupon)}
                      className="flex items-center gap-2 text-sm text-brand-orange font-semibold hover:underline"
                    >
                      <Tag className="h-4 w-4" />
                      {showCoupon ? 'Annuler' : 'Ajouter un code promo'}
                    </button>
                  )}

                  <AnimatePresence>
                    {showCoupon && !summary?.coupon_code && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 flex gap-2"
                      >
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="VOTRE CODE"
                          className="flex-1 input-base text-sm uppercase font-mono"
                        />
                        <Button
                          variant="orange"
                          size="sm"
                          onClick={() => { applyCoupon(couponInput); setShowCoupon(false) }}
                          disabled={!couponInput}
                        >
                          OK
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Sous-total</span>
                    <span className="font-semibold">{formatCurrency(summary?.subtotal ?? 0)}</span>
                  </div>
                  {(summary?.coupon_discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction</span>
                      <span className="font-semibold">-{formatCurrency(summary!.coupon_discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Livraison</span>
                    <span className="font-semibold">
                      {(summary?.delivery_fee ?? 0) === 0
                        ? <span className="text-green-600">Gratuite 🎉</span>
                        : formatCurrency(summary!.delivery_fee)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span className="text-brand-red">{formatCurrency(summary?.total ?? 0)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  variant="orange"
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={handleCheckout}
                >
                  Commander · {formatCurrency(summary?.total ?? 0)}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                  <Package className="h-3.5 w-3.5" />
                  Livraison gratuite à partir de 50 000 FCFA
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
