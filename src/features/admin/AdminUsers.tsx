import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api'
import { getInitials, formatDate, LOYALTY_LEVELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/data/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { Search } from 'lucide-react'

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.users.list({ page, per_page: 20, search: search || undefined }).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-stone-900 font-display">Utilisateurs</h1>
      <Input placeholder="Rechercher un utilisateur…" leftElement={<Search className="h-4 w-4" />} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />

      <div className="bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>{['Utilisateur', 'Rôle', 'Niveau fidélité', 'Points', 'Statut', 'Inscrit le'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? Array(8).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
            )) : (data as { data?: unknown[] })?.data?.map((u: unknown) => {
              const user = u as { id: number; name: string; email: string; phone?: string; avatar?: string; role: string; status: string; loyalty_level: string; loyalty_points: number; created_at: string }
              const levelCfg = LOYALTY_LEVELS[user.loyalty_level as keyof typeof LOYALTY_LEVELS] ?? LOYALTY_LEVELS.bronze
              return (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div><p className="text-sm font-semibold text-stone-900">{user.name}</p><p className="text-xs text-stone-400">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="blue">{user.role}</Badge></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${levelCfg.bg} ${levelCfg.color}`}>{levelCfg.icon} {levelCfg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-stone-900">{user.loyalty_points.toLocaleString('fr-CI')}</td>
                  <td className="px-4 py-3"><Badge variant={user.status === 'active' ? 'green' : 'red'}>{user.status === 'active' ? 'Actif' : 'Suspendu'}</Badge></td>
                  <td className="px-4 py-3 text-xs text-stone-500">{formatDate(user.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(data as { meta?: { last_page: number; current_page: number } })?.meta && (data as { meta: { last_page: number; current_page: number } }).meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-stone-100">
            <Pagination currentPage={page} totalPages={(data as { meta: { last_page: number } }).meta.last_page} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
