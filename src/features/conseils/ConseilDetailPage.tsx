// features/conseils/ConseilDetailPage.tsx
import { useState, useEffect, useRef, FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Leaf, Lightbulb, ChefHat, Play, Clock, Eye, Heart,
  ArrowLeft, Timer, Users, BarChart3, Tag, Share2, Check,
} from 'lucide-react'
import { conseilApi, type Conseil, type ConseilCategory, type ConseilDifficulty } from '@/api'

// ── Configuration ────────────────────────────────────────────────────

interface CategoryConfig {
  label: string
  icon: FC<{ className?: string }>
  color: string
  bg: string
}

const CATEGORY_CONFIG: Record<ConseilCategory, CategoryConfig> = {
  nutrition: { label: 'Nutrition', icon: Leaf,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
  astuce:    { label: 'Astuce',    icon: Lightbulb, color: 'text-amber-600',   bg: 'bg-amber-50'   },
  recette:   { label: 'Recette',   icon: ChefHat,   color: 'text-orange-600',  bg: 'bg-orange-50'  },
}

const DIFFICULTY_COLOR: Record<ConseilDifficulty, string> = {
  facile:    'bg-green-100 text-green-700',
  moyen:     'bg-amber-100 text-amber-700',
  difficile: 'bg-red-100 text-red-700',
}

// ── Sous-composants ──────────────────────────────────────────────────

const VideoEmbed: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
    return match ? match[1] : null
  }

  if (conseil.video_provider === 'youtube') {
    const youtubeId = conseil.youtube_id ?? getYouTubeId(conseil.video_url ?? '')
    if (youtubeId) {
      return (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg mb-8">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={conseil.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
  }

  if (conseil.video_provider === 'vimeo' && conseil.video_url) {
    const vimeoId = conseil.video_url.match(/vimeo\.com\/(\d+)/)?.[1]
    if (vimeoId) {
      return (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg mb-8">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={conseil.title}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )
    }
  }

  if (conseil.video_provider === 'local' && conseil.video_url) {
    return (
      <div className="mb-8">
        <video controls className="w-full rounded-2xl shadow-lg" src={conseil.video_url}>
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      </div>
    )
  }

  return null
}

const RecipeCard: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setChecked(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  if (conseil.category !== 'recette') return null

  return (
    <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-100">
      <h3 className="font-black text-orange-800 text-lg mb-4 flex items-center gap-2">
        <ChefHat className="w-5 h-5" /> Infos de la recette
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {conseil.recipe_prep_time && (
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Timer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="font-bold text-stone-900 text-sm">{conseil.recipe_prep_time} min</div>
            <div className="text-xs text-stone-400">Préparation</div>
          </div>
        )}
        {conseil.recipe_cook_time && (
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="font-bold text-stone-900 text-sm">{conseil.recipe_cook_time} min</div>
            <div className="text-xs text-stone-400">Cuisson</div>
          </div>
        )}
        {conseil.recipe_servings && (
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Users className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="font-bold text-stone-900 text-sm">{conseil.recipe_servings}</div>
            <div className="text-xs text-stone-400">Personnes</div>
          </div>
        )}
        {conseil.recipe_difficulty && (
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLOR[conseil.recipe_difficulty]}`}>
              {conseil.recipe_difficulty}
            </div>
            <div className="text-xs text-stone-400 mt-0.5">Niveau</div>
          </div>
        )}
      </div>

      {conseil.recipe_ingredients && conseil.recipe_ingredients.length > 0 && (
        <>
          <h4 className="font-bold text-orange-700 mb-3">Ingrédients</h4>
          <ul className="space-y-2">
            {conseil.recipe_ingredients.map((ing, i) => (
              <li
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition-all ${
                  checked.has(i)
                    ? 'bg-green-50 border border-green-200 opacity-60 line-through'
                    : 'bg-white border border-stone-100 hover:border-orange-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  checked.has(i) ? 'bg-green-500 border-green-500' : 'border-stone-300'
                }`}>
                  {checked.has(i) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-semibold text-stone-700 text-sm">
                  {ing.qty} {ing.unit && <span className="text-stone-400">{ing.unit}</span>}
                </span>
                <span className="text-stone-600 text-sm">{ing.name}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 mt-3">💡 Cliquez sur un ingrédient pour le cocher</p>
        </>
      )}
    </div>
  )
}

const RelatedCard: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const CatIcon = CATEGORY_CONFIG[conseil.category]?.icon ?? Leaf
  return (
    <Link
      to={`/conseils/${conseil.slug}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors"
    >
      <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
        {conseil.thumbnail_url ? (
          <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon className="w-6 h-6 text-stone-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-800 text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
          {conseil.title}
        </p>
        {conseil.reading_time && (
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {conseil.reading_time}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Page détail (corrigée : une seule incrémentation de vue) ─────────

export default function ConseilDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [conseil, setConseil] = useState<Conseil | null>(null)
  const [related, setRelated] = useState<Conseil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [liked, setLiked]     = useState(false)
  const [likes, setLikes]     = useState(0)
  const [copied, setCopied]   = useState(false)

  // Référence pour empêcher le double appel en développement (React Strict Mode)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!slug || hasLoaded.current) return
    hasLoaded.current = true

    setLoading(true)
    setError(null)

    conseilApi.get(slug)
      .then((response) => {
        setConseil(response.data)
        setLikes(response.data.likes)
        setRelated(response.related ?? [])
      })
      .catch(err => {
        console.error('Erreur chargement conseil :', err)
        setError(err.message || 'Impossible de charger le conseil')
        setConseil(null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleLike = () => {
    if (liked || !conseil) return
    conseilApi.like(conseil.id)
      .then(r => { setLikes(r.likes); setLiked(true) })
      .catch(e => console.error('Like failed:', e))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="container-app px-4 sm:px-6 py-10 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4 mb-6" />
        <div className="h-10 bg-stone-200 rounded w-3/4 mb-4" />
        <div className="aspect-video bg-stone-200 rounded-2xl mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-stone-200 rounded" style={{ width: `${80 + (i % 3) * 7}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !conseil) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400 gap-4">
        <p className="text-lg font-semibold">{error || 'Conseil introuvable'}</p>
        <Link to="/conseils" className="text-green-700 font-bold hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Retour aux conseils
        </Link>
      </div>
    )
  }

  const catConfig = CATEGORY_CONFIG[conseil.category]
  const CatIcon   = catConfig?.icon ?? Leaf

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container-app px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Contenu principal */}
            <main className="flex-1 min-w-0">
              <nav className="flex items-center gap-2 text-sm text-stone-400 mb-6">
                <Link to="/" className="hover:text-green-700 transition-colors">Accueil</Link>
                <span>/</span>
                <Link to="/conseils" className="hover:text-green-700 transition-colors">Nos Conseils</Link>
                <span>/</span>
                <span className="text-stone-600">{catConfig?.label}</span>
              </nav>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${catConfig?.bg} ${catConfig?.color}`}>
                    <CatIcon className="w-4 h-4" />
                    {catConfig?.label}
                  </span>
                  {conseil.reading_time && (
                    <span className="text-sm text-stone-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {conseil.reading_time}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight mb-4">
                  {conseil.title}
                </h1>

                {conseil.excerpt && (
                  <p className="text-stone-500 text-base leading-relaxed mb-6 border-l-4 border-green-300 pl-4">
                    {conseil.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between py-3 border-y border-stone-200 mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-4 text-sm text-stone-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {conseil.views.toLocaleString('fr-CI')} vues
                    </span>
                    {conseil.author?.name && (
                      <span className="font-medium text-stone-600">Par {conseil.author.name}</span>
                    )}
                    {conseil.published_at && (
                      <span>
                        {new Date(conseil.published_at).toLocaleDateString('fr-CI', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        liked
                          ? 'bg-red-50 text-red-600 cursor-default'
                          : 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                      {likes.toLocaleString('fr-CI')}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-green-50 hover:text-green-700 text-sm font-semibold transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      {copied ? 'Copié !' : 'Partager'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {conseil.thumbnail_url && conseil.content_type !== 'video' && (
                <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
                  <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full object-cover max-h-96" />
                </div>
              )}

              {(conseil.content_type === 'video' || conseil.content_type === 'mixed') && (
                <VideoEmbed conseil={conseil} />
              )}

              <RecipeCard conseil={conseil} />

              {conseil.body && (
                <div
                  className="prose prose-green prose-base max-w-none
                    prose-headings:font-black prose-headings:text-stone-900
                    prose-p:text-stone-600 prose-p:leading-relaxed
                    prose-a:text-green-700 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-stone-800
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-ul:text-stone-600 prose-ol:text-stone-600
                    prose-blockquote:border-green-400 prose-blockquote:text-stone-500
                    prose-code:bg-stone-100 prose-code:px-1.5 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: conseil.body }}
                />
              )}

              {conseil.tags_array && conseil.tags_array.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-stone-200">
                  <Tag className="w-4 h-4 text-stone-400 mt-0.5" />
                  {conseil.tags_array.map((tag, i) => (
                    <span key={i} className="bg-stone-100 text-stone-600 text-sm px-3 py-1 rounded-full hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </main>

            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">

                {related.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                    <h3 className="font-black text-stone-900 mb-4 flex items-center gap-2">
                      <CatIcon className={`w-5 h-5 ${catConfig?.color}`} />
                      À lire aussi
                    </h3>
                    <div className="space-y-1">
                      {related.map(r => <RelatedCard key={r.id} conseil={r} />)}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl p-5 text-white">
                  <Leaf className="w-8 h-8 text-green-300 mb-3" />
                  <h3 className="font-black text-lg mb-2">Restez informé</h3>
                  <p className="text-green-200 text-sm mb-4 leading-relaxed">
                    Recevez nos meilleurs conseils nutrition et recettes chaque semaine.
                  </p>
                  <Link
                    to="/subscriptions"
                    className="block text-center bg-white text-green-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    Découvrir nos abonnements
                  </Link>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  )
}