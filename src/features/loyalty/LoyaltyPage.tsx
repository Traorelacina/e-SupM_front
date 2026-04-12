import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, Gift, Trophy, Zap, TrendingUp, Award } from 'lucide-react'
import { loyaltyApi } from '@/api'
import { formatCurrency, LOYALTY_LEVELS, formatRelativeDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/data/EmptyState'

export default function LoyaltyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => loyaltyApi.dashboard().then(r => r.data),
  })

  if (isLoading) return (
    <div className="container-app py-8 max-w-3xl">
      <div className="space-y-5">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
    </div>
  )

  if (!data) return null

  const levelCfg = LOYALTY_LEVELS[data.level as keyof typeof LOYALTY_LEVELS]
  const nextLevelCfg = data.progress.next_level ? LOYALTY_LEVELS[data.progress.next_level] : null

  const TX_ICONS: Record<string, string> = {
    earned: '🛒', spent: '💸', bonus: '🎁', game_win: '🎮', review: '⭐', charity_bonus: '💚', referral: '👥',
  }

  return (
    <div className="py-8">
      <div className="container-app max-w-3xl">
        <div className="mb-6">
          <h1 className="section-title">⭐ Mon Programme Fidélité</h1>
          <p className="section-subtitle">Accumulez des points et débloquez des avantages exclusifs</p>
        </div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 text-white bg-gradient-to-br mb-6 ${
            data.level === 'platinum' ? 'from-purple-600 to-indigo-600' :
            data.level === 'gold' ? 'from-yellow-500 to-amber-500' :
            data.level === 'silver' ? 'from-slate-500 to-slate-600' :
            'from-amber-600 to-orange-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Niveau actuel</p>
              <h2 className="text-4xl font-black mt-1 font-display">{levelCfg.icon} {levelCfg.label}</h2>
              <p className="text-3xl font-black mt-2">{data.points.toLocaleString('fr-CI')} <span className="text-lg font-semibold text-white/80">points</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">Multiplicateur</p>
              <p className="text-2xl font-black">×{data.progress.multiplier}</p>
            </div>
          </div>

          {nextLevelCfg && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/80">Progression vers {nextLevelCfg.icon} {nextLevelCfg.label}</span>
                <span className="font-bold">{data.progress.progress.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progress.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="mt-2 text-xs text-white/70">Encore {data.progress.points_to_next.toLocaleString('fr-CI')} points pour le niveau {nextLevelCfg.label}</p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {/* Badges */}
          <div className="card p-5">
            <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-brand-orange" /> Mes Badges</h2>
            {data.badges.length === 0 ? (
              <EmptyState emoji="🏅" title="Aucun badge encore" description="Passez des commandes pour gagner vos premiers badges !" className="py-6" />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {data.badges.slice(0, 6).map(badge => (
                  <div key={badge.id} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${badge.earned ? 'bg-amber-50 border border-amber-200' : 'bg-stone-50 opacity-50 grayscale'}`}>
                    <div className="text-2xl">{badge.image ? '🏅' : '🏅'}</div>
                    <p className="text-[9px] font-bold text-stone-700 text-center line-clamp-2">{badge.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redeem */}
          <div className="card p-5">
            <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Gift className="h-4 w-4 text-brand-orange" /> Utiliser mes points</h2>
            <div className="space-y-3">
              {[
                { label: 'Réduction -500 FCFA', points: 50000, icon: '💸' },
                { label: 'Livraison gratuite', points: 20000, icon: '🚚' },
                { label: 'Produit offert', points: 100000, icon: '🎁' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-stone-900">{r.label}</p>
                      <p className="text-xs text-stone-500">{r.points.toLocaleString('fr-CI')} pts</p>
                    </div>
                  </div>
                  <Button size="xs" variant={data.points >= r.points ? 'orange' : 'secondary'} disabled={data.points < r.points}>
                    {data.points >= r.points ? 'Échanger' : 'Insuffisant'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-orange" /> Historique des points</h2>
          {data.recent_transactions.length === 0 ? (
            <EmptyState emoji="📊" title="Aucune transaction" description="Vos points s'afficheront ici après vos achats." className="py-8" />
          ) : (
            <div className="space-y-3">
              {data.recent_transactions.map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TX_ICONS[tx.type] ?? '⭐'}</span>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{tx.description || tx.type}</p>
                      <p className="text-xs text-stone-400">{formatRelativeDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
