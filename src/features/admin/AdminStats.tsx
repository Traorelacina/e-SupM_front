import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { adminApi } from '@/api'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/ui/ExtraComponents'
import { TrendingUp, ShoppingBag, Users, Package } from 'lucide-react'

export default function AdminStats() {
  const [year] = useState(new Date().getFullYear())

  const { data: revenue } = useQuery({
    queryKey: ['admin', 'stats', 'revenue', year],
    queryFn: () => adminApi.stats.revenue(year).then(r => r.data),
  })

  const { data: userStats } = useQuery({
    queryKey: ['admin', 'stats', 'users'],
    queryFn: () => adminApi.stats.users().then(r => r.data),
  })

  const { data: productStats } = useQuery({
    queryKey: ['admin', 'stats', 'products'],
    queryFn: () => adminApi.stats.products().then(r => r.data),
  })

  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-stone-900 font-display">Statistiques {year}</h1>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="CA annuel" value={formatCurrency((revenue as { total?: number })?.total ?? 0)} iconBg="bg-amber-100" />
        <StatCard icon={ShoppingBag} label="Total commandes" value={((revenue as { monthly?: Array<{ orders: number }> })?.monthly ?? []).reduce((a: number, m: { orders: number }) => a + m.orders, 0)} iconBg="bg-blue-100" />
        <StatCard icon={Users} label="Clients" value={(userStats as { total?: number })?.total ?? 0} iconBg="bg-green-100" />
        <StatCard icon={Package} label="Produits actifs" value={(productStats as { active_count?: number })?.active_count ?? 0} iconBg="bg-purple-100" />
      </div>

      {/* Monthly revenue chart (simple bar) */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
        <h2 className="font-bold text-stone-900 mb-6">Chiffre d'affaires mensuel {year}</h2>
        {(revenue as { monthly?: Array<{ month: number; revenue: number; orders: number }> })?.monthly ? (
          <div className="flex items-end gap-2 h-48">
            {months.map((m, i) => {
              const monthData = ((revenue as { monthly?: Array<{ month: number; revenue: number; orders: number }> }).monthly ?? []).find((d: { month: number }) => d.month === i + 1)
              const maxRev = Math.max(...((revenue as { monthly?: Array<{ revenue: number }> }).monthly ?? []).map((d: { revenue: number }) => d.revenue || 0), 1)
              const height = monthData ? (monthData.revenue / maxRev) * 100 : 0
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold text-stone-600">{monthData?.revenue ? formatCurrency(monthData.revenue).replace(' FCFA', '') : ''}</p>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-xl ${height > 0 ? 'bg-brand-orange' : 'bg-stone-100'}`}
                    title={monthData ? `${m}: ${formatCurrency(monthData.revenue)}` : m}
                  />
                  <p className="text-[9px] text-stone-400 font-medium">{m}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-stone-400">Aucune donnée</div>
        )}
      </div>

      {/* Top products */}
      {(productStats as { top_sellers?: Array<{ product_name: string; sold: number }> })?.top_sellers && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
          <h2 className="font-bold text-stone-900 mb-4">Top 10 produits vendus</h2>
          <div className="space-y-3">
            {((productStats as { top_sellers?: Array<{ product_name: string; sold: number }> }).top_sellers ?? []).map((p: { product_name: string; sold: number }, i: number) => {
              const max = ((productStats as { top_sellers?: Array<{ sold: number }> }).top_sellers ?? [])[0]?.sold ?? 1
              return (
                <div key={p.product_name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">{p.product_name}</p>
                    <div className="mt-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(p.sold / max) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="h-full bg-brand-orange rounded-full" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-700 shrink-0">{p.sold} ventes</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
