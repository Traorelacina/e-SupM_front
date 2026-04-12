import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api'
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/data/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OrderStatus } from '@/types'

const STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'dispatched', label: 'En livraison' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
]

export default function AdminOrders() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, status],
    queryFn: () => adminApi.orders.list({ page, per_page: 20, status: status || undefined }).then(r => r.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, s }: { id: number; s: string }) => adminApi.orders.updateStatus(id, s),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast.success('Statut mis à jour') },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-stone-900 font-display">Commandes</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => { setStatus(s.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${status === s.value ? 'bg-brand-orange text-stone-900 shadow-brand' : 'bg-white border border-stone-200 text-stone-600 hover:border-brand-orange'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>{['N° Commande', 'Client', 'Date', 'Total', 'Paiement', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
              )) : data?.data.map(order => {
                const sc = ORDER_STATUS_CONFIG[order.status]
                const bv = sc.color.replace('badge-', '') as 'orange' | 'green' | 'red' | 'blue' | 'gray'
                return (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-stone-900">#{order.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-stone-900">{order.user?.name ?? '—'}</p>
                      <p className="text-xs text-stone-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-black text-stone-900">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3"><Badge variant={order.payment_status === 'paid' ? 'green' : 'orange'}>{order.payment_status === 'paid' ? 'Payée' : 'En attente'}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={bv}>{sc.icon} {sc.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"><Eye className="h-4 w-4" /></button>
                        <select
                          value={order.status}
                          onChange={e => updateStatusMutation.mutate({ id: order.id, s: e.target.value })}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
                        >
                          {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data && data.meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-stone-100">
            <Pagination currentPage={page} totalPages={data.meta.last_page} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
