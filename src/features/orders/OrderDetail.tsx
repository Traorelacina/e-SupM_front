import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, MapPin, CreditCard, ArrowLeft, Download, RefreshCw, X } from 'lucide-react'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(Number(id))
  const cancelMutation = useCancelOrder()

  if (isLoading) return <div className="container-app py-20 text-center"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" /></div>
  if (!order) return <div className="container-app py-20 text-center text-stone-500">Commande introuvable</div>

  const statusCfg = ORDER_STATUS_CONFIG[order.status]

  return (
    <div className="py-8">
      <div className="container-app max-w-3xl">
        <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux commandes
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900 font-display">Commande #{order.order_number}</h1>
            <p className="text-stone-500 text-sm mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <Badge variant={statusCfg.color.replace('badge-', '') as 'orange' | 'green' | 'red' | 'blue'}>{statusCfg.icon} {statusCfg.label}</Badge>
        </div>

        <div className="space-y-5">
          {/* Items */}
          <div className="card p-5">
            <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-brand-orange" /> Articles ({order.items?.length ?? 0})</h2>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                    {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-stone-500">Qté: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-bold text-stone-900 shrink-0">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card p-5">
            <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-brand-orange" /> Récapitulatif</h2>
            <div className="space-y-2">
              {[
                { label: 'Sous-total', value: formatCurrency(order.subtotal) },
                order.discount_amount > 0 && { label: `Code promo (${order.coupon_code})`, value: `-${formatCurrency(order.discount_amount)}`, color: 'text-green-600' },
                { label: 'Livraison', value: order.delivery_fee === 0 ? 'Gratuite 🎉' : formatCurrency(order.delivery_fee) },
              ].filter(Boolean).map((row: unknown) => {
                const r = row as { label: string; value: string; color?: string }
                return (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-stone-600">{r.label}</span>
                    <span className={`font-semibold ${r.color ?? 'text-stone-900'}`}>{r.value}</span>
                  </div>
                )
              })}
              <div className="flex justify-between text-base font-black pt-3 border-t border-stone-100">
                <span>Total</span>
                <span className="text-brand-red">{formatCurrency(order.total)}</span>
              </div>
            </div>
            {order.loyalty_points_earned > 0 && <p className="mt-3 text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-lg">⭐ {order.loyalty_points_earned} points fidélité gagnés sur cette commande</p>}
          </div>

          {/* Delivery */}
          {order.address && (
            <div className="card p-5">
              <h2 className="font-bold text-stone-900 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-orange" /> Livraison</h2>
              <p className="text-sm font-semibold text-stone-900">{order.address.recipient_name}</p>
              <p className="text-sm text-stone-600">{order.address.address_line1}</p>
              <p className="text-sm text-stone-600">{order.address.district}, {order.address.city}</p>
              <p className="text-sm text-stone-500">{order.address.phone}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {order.status === 'delivered' && (
              <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
                Télécharger la facture
              </Button>
            )}
            {order.status === 'delivered' && (
              <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />}>
                Recommander
              </Button>
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <Button
                variant="danger"
                leftIcon={<X className="h-4 w-4" />}
                loading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate({ id: order.id })}
              >
                Annuler la commande
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
