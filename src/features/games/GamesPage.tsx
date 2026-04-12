import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Gamepad2, Lock, Play, Clock, Trophy } from 'lucide-react'
import { gameApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/data/EmptyState'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const GAME_CONFIG: Record<string, { emoji: string; color: string; desc: string }> = {
  defi:         { emoji: '🏆', color: 'from-orange-400 to-red-500', desc: 'Relevez le défi et gagnez des cadeaux !' },
  carte_gratter:{ emoji: '🎰', color: 'from-yellow-400 to-orange-500', desc: 'Grattez et découvrez votre lot !' },
  roue:         { emoji: '🎡', color: 'from-purple-500 to-pink-500', desc: 'Faites tourner la roue pour gagner !' },
  quiz:         { emoji: '🧠', color: 'from-blue-500 to-cyan-500', desc: 'Répondez aux questions et gagnez des points !' },
  juste_prix:   { emoji: '💰', color: 'from-green-500 to-emerald-500', desc: 'Devinez le prix et gagnez un lot !' },
  battle:       { emoji: '⚔️', color: 'from-red-500 to-rose-600', desc: 'Votez pour votre produit favori !' },
  calendrier:   { emoji: '📅', color: 'from-teal-500 to-cyan-500', desc: 'Bientôt disponible…' },
}

export default function GamesPage() {
  const { data: games, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => gameApi.list().then(r => r.data),
  })

  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handlePlay = (game: { id: number; requires_purchase: boolean; status: string; type: string }) => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour jouer !'); navigate('/login'); return }
    if (game.requires_purchase) { toast('Achetez pour débloquer ce jeu 🛒', { icon: '🔒' }); return }
    toast.success('Jeu lancé ! Bonne chance 🎮')
  }

  return (
    <div className="py-8">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Gamepad2 className="h-4 w-4" /> e-Sup'M Game Alimentaire
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 font-display">
            Jouez et Gagnez ! 🎉
          </h1>
          <p className="mt-3 text-stone-500 max-w-xl mx-auto">
            Des jeux exclusifs pour nos clients. Gagnez des cadeaux, des points fidélité et des bons d'achat chaque semaine !
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}
          </div>
        ) : !games?.length ? (
          <EmptyState emoji="🎮" title="Aucun jeu disponible" description="Revenez bientôt pour découvrir nos jeux !" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, i) => {
              const cfg = GAME_CONFIG[game.type] ?? { emoji: '🎮', color: 'from-gray-400 to-gray-500', desc: '' }
              const isLocked = game.requires_purchase
              const isClosed = game.status === 'closed'
              const isUpcoming = game.status === 'upcoming'

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-gradient-to-br ${cfg.color} rounded-3xl p-6 text-white relative overflow-hidden ${(isClosed || isUpcoming) ? 'opacity-70' : ''}`}
                >
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-5xl">{cfg.emoji}</span>
                      <div className="text-right">
                        {game.status === 'active' && <Badge variant="green" className="bg-white/20 border-white/30 text-white">🟢 Actif</Badge>}
                        {isUpcoming && <Badge variant="blue" className="bg-white/20 border-white/30 text-white">🔜 Bientôt</Badge>}
                        {isClosed && <Badge variant="gray" className="bg-white/20 border-white/30 text-white">Terminé</Badge>}
                        {isLocked && <div className="mt-1 flex items-center gap-1 text-xs text-white/80"><Lock className="h-3 w-3" /> Achat requis</div>}
                      </div>
                    </div>

                    <h3 className="text-xl font-black font-display">{game.name}</h3>
                    <p className="text-sm text-white/90 mt-1">{cfg.desc}</p>

                    {game.loyalty_points_prize > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 text-sm font-bold">
                        <Trophy className="h-4 w-4" />
                        Jusqu'à {game.loyalty_points_prize} points à gagner
                      </div>
                    )}

                    <div className="mt-5">
                      {isClosed || isUpcoming ? (
                        <Button variant="secondary" fullWidth disabled className="bg-white/20 border-white/30 text-white">
                          {isUpcoming ? <><Clock className="h-4 w-4" /> Bientôt</> : 'Terminé'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          fullWidth
                          className="bg-white text-stone-900 hover:bg-stone-100"
                          onClick={() => handlePlay(game)}
                          leftIcon={<Play className="h-4 w-4" />}
                        >
                          {isLocked ? 'Débloquer' : 'Jouer maintenant'}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-stone-900 mb-3">ℹ️ Comment ça marche ?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { emoji: '🛒', title: 'Faites vos courses', desc: 'Achetez au moins 15 000 FCFA pour débloquer les jeux conditionnés.' },
              { emoji: '🎮', title: 'Jouez', desc: 'Participez aux jeux disponibles selon votre éligibilité.' },
              { emoji: '🎁', title: 'Gagnez', desc: 'Des cadeaux, points fidélité et bons d\'achat à la clé !' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{emoji}</span>
                <div>
                  <p className="font-bold text-stone-900">{title}</p>
                  <p className="text-stone-600 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
