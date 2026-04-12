import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, RefreshCw, Eye } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/data/Pagination'
import { EmptyState } from '@/components/data/EmptyState'
import { OrderCardSkeleton } from '@/components/ui/Skeleton'

const STATUS_TABS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'dispatched', label: 'En livraison' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
]

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useOrders({ page, per_page: 10 } as { page: number; per_page?: number })

  return (
    <div className="py-8">
      <div className="container-app max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Mes Commandes</h1>
            <p className="section-subtitle">{data?.meta.total ?? 0} commande{data?.meta.total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.value ? 'bg-brand-orange text-stone-900 shadow-brand' : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-orange hover:text-brand-orange'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array(5).fill(0).map((_, i) => <OrderCardSkeleton key={i} />)}</div>
        ) : !data?.data?.length ? (
          <EmptyState
            emoji="📦"
            title="Aucune commande"
            description="Vous n'avez pas encore passé de commande. Commencez vos courses !"
            action={<Button variant="orange" onClick={() => navigate('/catalogue')}>Explorer le catalogue</Button>}
          />
        ) : (
          <div className="space-y-4">
            {data.data.map((order, i) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status]
              const badgeVariant = statusCfg.color.replace('badge-', '') as 'orange' | 'green' | 'red' | 'blue' | 'gray'

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
                        {statusCfg.icon}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 text-sm">#{order.order_number}</p>
                        <p className="text-xs text-stone-500">{formatDate(order.created_at)} · {order.items?.length ?? 0} article{(order.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <Badge variant={badgeVariant}>{statusCfg.label}</Badge>
                  </div>

                  {/* Items preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 overflow-hidden">
                      {order.items.slice(0, 4).map(item => (
                        <div key={item.id} className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                          {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🛒</div>}
                        </div>
                      ))}
                      {order.items.length > 4 && <span className="text-xs font-semibold text-stone-500">+{order.items.length - 4}</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                    <div>
                      <p className="text-lg font-black text-stone-900">{formatCurrency(order.total)}</p>
                      {order.loyalty_points_earned > 0 && <p className="text-xs text-amber-600 font-semibold">+{order.loyalty_points_earned} points fidélité</p>}
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'delivered' && (
                        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                          Recommander
                        </Button>
                      )}
                      <Button variant="orange" size="sm" onClick={() => navigate(`/orders/${order.id}`)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                        Détails
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {data.meta.last_page > 1 && (
              <Pagination currentPage={page} totalPages={data.meta.last_page} onPageChange={setPage} className="mt-6" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
