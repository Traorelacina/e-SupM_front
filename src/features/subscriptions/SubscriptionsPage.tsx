import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '@/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/data/EmptyState'
import { RefreshCw, Plus, Pause, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SubscriptionsPage() {
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.list().then(r => r.data),
  })

  const STATUS_CONFIG: Record<string, { label: string; variant: 'green' | 'orange' | 'red' | 'gray' }> = {
    active:    { label: '✓ Actif',      variant: 'green' },
    suspended: { label: '⏸ Suspendu',  variant: 'orange' },
    cancelled: { label: '✕ Annulé',    variant: 'red' },
    pending:   { label: '⏳ En attente', variant: 'gray' },
  }

  return (
    <div className="py-8 container-app max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">🔄 Mes Abonnements</h1>
          <p className="section-subtitle">Panier Essentiel Automatique · 5% de remise</p>
        </div>
        <Button variant="orange" size="sm" leftIcon={<Plus className="h-4 w-4" />}>Nouvel abonnement</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
      ) : !subs?.length ? (
        <div className="card p-8">
          <EmptyState emoji="🔄" title="Aucun abonnement" description="Abonnez-vous et recevez vos produits essentiels chaque mois avec 5% de remise !" action={<Button variant="orange" leftIcon={<Plus className="h-4 w-4" />}>Créer mon abonnement</Button>} />
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((sub, i) => {
            const sc = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.pending
            return (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">{sub.name}</h3>
                    <p className="text-xs text-stone-500 capitalize">{sub.frequency === 'monthly' ? 'Mensuel' : 'Hebdomadaire'} · {sub.items.length} articles</p>
                  </div>
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div>
                    <p className="text-lg font-black">{formatCurrency(sub.total)}<span className="text-xs text-stone-400 font-normal">/mois</span></p>
                    {sub.next_delivery_at && <p className="text-xs text-stone-500">Prochaine: {formatDate(sub.next_delivery_at)}</p>}
                  </div>
                  <div className="flex gap-2">
                    {sub.status === 'active' && <Button size="sm" variant="secondary" leftIcon={<Pause className="h-3.5 w-3.5" />}>Suspendre</Button>}
                    {sub.status === 'suspended' && <Button size="sm" variant="orange" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Réactiver</Button>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
