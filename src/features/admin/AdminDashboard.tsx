import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShoppingBag, Users, Package, TrendingUp, AlertTriangle, ArrowUpRight, Clock } from 'lucide-react'
import { adminApi } from '@/api'
import { formatCurrency, formatRelativeDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 border border-stone-100 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-stone-300" />
      </div>
      <p className="text-2xl font-black text-stone-900 font-display">{value}</p>
      <p className="text-sm font-semibold text-stone-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['admin', 'alerts'],
    queryFn: () => adminApi.alerts().then(r => r.data),
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 font-display">Tableau de bord</h1>
        <p className="text-stone-500 text-sm mt-0.5">Vue d'ensemble de e-Sup'M en temps réel</p>
      </div>

      {/* Alerts */}
      {alerts && (alerts.low_stock_count > 0 || alerts.pending_preparation > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-800">⚠️ Alertes actives</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {alerts.low_stock_count > 0 && <span className="text-amber-700">{alerts.low_stock_count} produit(s) en stock faible</span>}
              {alerts.out_of_stock_count > 0 && <span className="text-red-700">{alerts.out_of_stock_count} produit(s) épuisé(s)</span>}
              {alerts.pending_preparation > 0 && <span className="text-blue-700">{alerts.pending_preparation} commande(s) à préparer</span>}
            </div>
          </div>
        </div>
      )}

      {/* Today stats */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Aujourd'hui</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag} label="Commandes" value={data?.today.orders ?? 0} color="bg-blue-500" delay={0} />
          <StatCard icon={TrendingUp} label="Chiffre d'affaires" value={formatCurrency(data?.today.revenue ?? 0)} color="bg-brand-orange" delay={0.05} />
          <StatCard icon={Users} label="Nouveaux clients" value={data?.today.new_users ?? 0} color="bg-green-500" delay={0.1} />
          <StatCard icon={Package} label="En préparation" value={data?.pending_preparation ?? 0} color="bg-purple-500" delay={0.15} />
        </div>
      </div>

      {/* Month stats */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Ce mois</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag} label="Commandes" value={data?.month.orders ?? 0} sub="Ce mois-ci" color="bg-blue-400" delay={0.2} />
          <StatCard icon={TrendingUp} label="CA du mois" value={formatCurrency(data?.month.revenue ?? 0)} color="bg-amber-500" delay={0.25} />
          <StatCard icon={Users} label="Clients actifs" value={data?.totals.users ?? 0} sub="Total" color="bg-green-400" delay={0.3} />
          <StatCard icon={Package} label="Panier moyen" value={formatCurrency(data?.month.avg_basket ?? 0)} color="bg-pink-500" delay={0.35} />
        </div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-orange" />
            Commandes récentes
          </h2>
        </div>
        <div className="divide-y divide-stone-50">
          {data?.recent_orders.slice(0, 8).map(order => {
            const sc = ORDER_STATUS_CONFIG[order.status]
            const bv = sc.color.replace('badge-', '') as 'orange' | 'green' | 'red' | 'blue' | 'gray'
            return (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-sm">{sc.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">#{order.order_number}</p>
                    <p className="text-xs text-stone-500">{order.user?.name ?? '—'} · {formatRelativeDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black text-stone-900">{formatCurrency(order.total)}</p>
                  <Badge variant={bv}>{sc.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
