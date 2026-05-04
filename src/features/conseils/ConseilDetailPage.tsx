// features/conseils/ConseilDetailPage.tsx
import { useState, useEffect, useRef, FC } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Leaf, Lightbulb, ChefHat, Play, Clock, Eye, Heart,
  ArrowLeft, Timer, Users, BarChart3, Tag, Share2, Check,
} from 'lucide-react'
import { conseilApi, type Conseil, type ConseilCategory, type ConseilDifficulty } from '@/api'

// ── Palette e-Sup'M
const BRAND = {
  orange: '#F5A623',
  red: '#E02020',
  dark: '#1C0F00',
  warm: '#FFF8F0',
  card: '#FFFDF9',
  text: '#3D1F00',
  muted: '#9E7554',
  border: 'rgba(245,166,35,0.18)',
}

// ── Config catégories
interface CategoryConfig {
  label: string
  icon: FC<{ className?: string }>
  color: string
  bg: string
  accent: string
}

const CATEGORY_CONFIG: Record<ConseilCategory, CategoryConfig> = {
  nutrition: {
    label: 'Nutrition',
    icon: Leaf,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    accent: '#059669',
  },
  astuce: {
    label: 'Astuce',
    icon: Lightbulb,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    accent: '#D97706',
  },
  recette: {
    label: 'Recette',
    icon: ChefHat,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    accent: '#EA580C',
  },
}

const DIFFICULTY_COLOR: Record<ConseilDifficulty, string> = {
  facile:    'bg-green-100 text-green-700',
  moyen:     'bg-amber-100 text-amber-700',
  difficile: 'bg-red-100 text-red-700',
}

// ── Embed vidéo
const VideoEmbed: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
    return match ? match[1] : null
  }

  if (conseil.video_provider === 'youtube') {
    const youtubeId = conseil.youtube_id ?? getYouTubeId(conseil.video_url ?? '')
    if (youtubeId) {
      return (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8" style={{ boxShadow: '0 8px 32px rgba(28,15,0,0.12)' }}>
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
        <div className="aspect-video rounded-2xl overflow-hidden mb-8" style={{ boxShadow: '0 8px 32px rgba(28,15,0,0.12)' }}>
          <iframe src={`https://player.vimeo.com/video/${vimeoId}`} title={conseil.title} className="w-full h-full" allowFullScreen />
        </div>
      )
    }
  }

  if (conseil.video_provider === 'local' && conseil.video_url) {
    return (
      <div className="mb-8">
        <video controls className="w-full rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(28,15,0,0.12)' }} src={conseil.video_url}>
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      </div>
    )
  }

  return null
}

// ── Carte recette
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
    <div
      className="rounded-2xl p-6 mb-8"
      style={{
        background: '#FFF3E0',
        border: `1.5px solid rgba(245,166,35,0.3)`,
      }}
    >
      <h3
        className="font-black text-lg mb-4 flex items-center gap-2"
        style={{ color: BRAND.text }}
      >
        <ChefHat className="w-5 h-5" style={{ color: BRAND.orange }} /> Infos de la recette
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {conseil.recipe_prep_time && (
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(245,166,35,0.1)' }}>
            <Timer className="w-5 h-5 mx-auto mb-1" style={{ color: BRAND.orange }} />
            <div className="font-bold text-sm" style={{ color: BRAND.dark }}>{conseil.recipe_prep_time} min</div>
            <div className="text-xs" style={{ color: BRAND.muted }}>Préparation</div>
          </div>
        )}
        {conseil.recipe_cook_time && (
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(245,166,35,0.1)' }}>
            <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: BRAND.orange }} />
            <div className="font-bold text-sm" style={{ color: BRAND.dark }}>{conseil.recipe_cook_time} min</div>
            <div className="text-xs" style={{ color: BRAND.muted }}>Cuisson</div>
          </div>
        )}
        {conseil.recipe_servings && (
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(245,166,35,0.1)' }}>
            <Users className="w-5 h-5 mx-auto mb-1" style={{ color: BRAND.orange }} />
            <div className="font-bold text-sm" style={{ color: BRAND.dark }}>{conseil.recipe_servings}</div>
            <div className="text-xs" style={{ color: BRAND.muted }}>Personnes</div>
          </div>
        )}
        {conseil.recipe_difficulty && (
          <div className="bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(245,166,35,0.1)' }}>
            <BarChart3 className="w-5 h-5 mx-auto mb-1" style={{ color: BRAND.orange }} />
            <div className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLOR[conseil.recipe_difficulty]}`}>
              {conseil.recipe_difficulty}
            </div>
            <div className="text-xs mt-0.5" style={{ color: BRAND.muted }}>Niveau</div>
          </div>
        )}
      </div>

      {conseil.recipe_ingredients && conseil.recipe_ingredients.length > 0 && (
        <>
          <h4 className="font-bold mb-3" style={{ color: BRAND.text }}>Ingrédients</h4>
          <ul className="space-y-2">
            {conseil.recipe_ingredients.map((ing, i) => (
              <li
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition-all ${
                  checked.has(i)
                    ? 'opacity-55 line-through'
                    : 'bg-white hover:border-amber-300'
                }`}
                style={{
                  background: checked.has(i) ? '#F0FDF4' : 'white',
                  border: `1.5px solid ${checked.has(i) ? '#86EFAC' : 'rgba(245,166,35,0.15)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: checked.has(i) ? '#22C55E' : 'transparent',
                    borderColor: checked.has(i) ? '#22C55E' : '#D1D5DB',
                  }}
                >
                  {checked.has(i) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-semibold text-sm" style={{ color: BRAND.dark }}>
                  {ing.qty}{' '}
                  {ing.unit && <span style={{ color: BRAND.muted }}>{ing.unit}</span>}
                </span>
                <span className="text-sm" style={{ color: BRAND.text }}>{ing.name}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3" style={{ color: BRAND.muted }}>
            Cliquez sur un ingrédient pour le cocher
          </p>
        </>
      )}
    </div>
  )
}

// ── Carte article lié
const RelatedCard: FC<{ conseil: Conseil }> = ({ conseil }) => {
  const CatIcon = CATEGORY_CONFIG[conseil.category]?.icon ?? Leaf
  const accent  = CATEGORY_CONFIG[conseil.category]?.accent ?? BRAND.orange

  return (
    <Link
      to={`/conseils/${conseil.slug}`}
      className="group flex gap-3 p-3 rounded-xl transition-colors hover:bg-amber-50"
    >
      <div
        className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0"
        style={{ background: '#F5EDD8' }}
      >
        {conseil.thumbnail_url ? (
          <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon className="w-6 h-6 opacity-30" style={{ color: accent }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug line-clamp-2 transition-colors group-hover:text-red-600"
          style={{ color: BRAND.dark }}
        >
          {conseil.title}
        </p>
        {conseil.reading_time && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: BRAND.muted }}>
            <Clock className="w-3 h-3" /> {conseil.reading_time}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Page détail principale
export default function ConseilDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [conseil, setConseil] = useState<Conseil | null>(null)
  const [related, setRelated] = useState<Conseil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [liked, setLiked]     = useState(false)
  const [likes, setLikes]     = useState(0)
  const [copied, setCopied]   = useState(false)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!slug || hasLoaded.current) return
    hasLoaded.current = true

    setLoading(true)
    setError(null)

    conseilApi.get(slug)
      .then(response => {
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

  // ── Skeleton
  if (loading) {
    return (
      <div className="container-app px-4 sm:px-6 py-10 max-w-4xl mx-auto animate-pulse">
        <div className="h-4 rounded-full w-1/3 mb-6" style={{ background: '#F5EDD8' }} />
        <div className="h-9 rounded-full w-3/4 mb-4" style={{ background: '#F5EDD8' }} />
        <div className="aspect-video rounded-2xl mb-6" style={{ background: '#F5EDD8' }} />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded-full" style={{ width: `${80 + (i % 3) * 7}%`, background: '#F5EDD8' }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Erreur
  if (error || !conseil) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ color: BRAND.muted }}>
        <p className="text-lg font-semibold">{error || 'Conseil introuvable'}</p>
        <Link
          to="/conseils"
          className="font-bold hover:underline flex items-center gap-1"
          style={{ color: BRAND.red }}
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux conseils
        </Link>
      </div>
    )
  }

  const catConfig = CATEGORY_CONFIG[conseil.category]
  const CatIcon   = catConfig?.icon ?? Leaf

  return (
    <div className="min-h-screen" style={{ background: BRAND.warm }}>

      {/* Bandeau couleur catégorie */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.orange} 100%)` }} />

      <div className="container-app px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Contenu principal ── */}
            <main className="flex-1 min-w-0">

              {/* Fil d'Ariane */}
              <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: BRAND.muted }}>
                <Link to="/" className="hover:underline transition-colors" style={{ color: BRAND.muted }}>Accueil</Link>
                <span>/</span>
                <Link to="/conseils" className="hover:underline transition-colors" style={{ color: BRAND.muted }}>Nos Conseils</Link>
                <span>/</span>
                <span style={{ color: BRAND.dark }}>{catConfig?.label}</span>
              </nav>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                {/* Badge catégorie + temps */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${catConfig?.bg} ${catConfig?.color}`}
                  >
                    <CatIcon className="w-4 h-4" />
                    {catConfig?.label}
                  </span>
                  {conseil.reading_time && (
                    <span className="text-sm flex items-center gap-1" style={{ color: BRAND.muted }}>
                      <Clock className="w-4 h-4" /> {conseil.reading_time}
                    </span>
                  )}
                </div>

                {/* Titre */}
                <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4" style={{ color: BRAND.dark }}>
                  {conseil.title}
                </h1>

                {/* Résumé */}
                {conseil.excerpt && (
                  <p
                    className="text-base leading-relaxed mb-6 pl-4"
                    style={{
                      color: BRAND.text,
                      borderLeft: `4px solid ${BRAND.orange}`,
                    }}
                  >
                    {conseil.excerpt}
                  </p>
                )}

                {/* Méta + actions */}
                <div
                  className="flex items-center justify-between py-3 mb-6 flex-wrap gap-3"
                  style={{ borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: BRAND.muted }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {conseil.views.toLocaleString('fr-CI')} vues
                    </span>
                    {conseil.author?.name && (
                      <span className="font-medium" style={{ color: BRAND.text }}>Par {conseil.author.name}</span>
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
                    {/* Like */}
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: liked ? '#FEE2E2' : '#F5F5F5',
                        color: liked ? BRAND.red : BRAND.muted,
                        cursor: liked ? 'default' : 'pointer',
                      }}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                      {likes.toLocaleString('fr-CI')}
                    </button>

                    {/* Partager */}
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: copied ? '#FFF3E0' : '#F5F5F5',
                        color: copied ? BRAND.orange : BRAND.muted,
                      }}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      {copied ? 'Copié !' : 'Partager'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Image principale */}
              {conseil.thumbnail_url && conseil.content_type !== 'video' && (
                <div className="mb-8 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(28,15,0,0.1)' }}>
                  <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full object-cover max-h-96" />
                </div>
              )}

              {/* Vidéo */}
              {(conseil.content_type === 'video' || conseil.content_type === 'mixed') && (
                <VideoEmbed conseil={conseil} />
              )}

              {/* Recette */}
              <RecipeCard conseil={conseil} />

              {/* Corps texte */}
              {conseil.body && (
                <div
                  className="prose prose-base max-w-none
                    prose-headings:font-black
                    prose-p:leading-relaxed
                    prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-xl
                    prose-code:px-1.5 prose-code:rounded"
                  style={{ '--tw-prose-headings': BRAND.dark, '--tw-prose-links': BRAND.red } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: conseil.body }}
                />
              )}

              {/* Tags */}
              {conseil.tags_array && conseil.tags_array.length > 0 && (
                <div
                  className="flex flex-wrap gap-2 mt-8 pt-6"
                  style={{ borderTop: `1px solid ${BRAND.border}` }}
                >
                  <Tag className="w-4 h-4 mt-0.5" style={{ color: BRAND.muted }} />
                  {conseil.tags_array.map((tag, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1 rounded-full cursor-pointer transition-colors"
                      style={{
                        background: '#F5EDD8',
                        color: BRAND.text,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#FFE0B2'
                        ;(e.currentTarget as HTMLElement).style.color = BRAND.red
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = '#F5EDD8'
                        ;(e.currentTarget as HTMLElement).style.color = BRAND.text
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </main>

            {/* ── Sidebar ── */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">

                {/* Articles liés */}
                {related.length > 0 && (
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: BRAND.card,
                      border: `1.5px solid ${BRAND.border}`,
                      boxShadow: '0 2px 12px rgba(28,15,0,0.06)',
                    }}
                  >
                    <h3 className="font-black mb-4 flex items-center gap-2" style={{ color: BRAND.dark }}>
                      <CatIcon className={`w-5 h-5 ${catConfig?.color}`} />
                      À lire aussi
                    </h3>
                    <div className="space-y-1">
                      {related.map(r => <RelatedCard key={r.id} conseil={r} />)}
                    </div>
                  </div>
                )}

                {/* CTA abonnement */}
                <div
                  className="rounded-2xl p-5 text-white"
                  style={{ background: `linear-gradient(135deg, ${BRAND.red} 0%, ${BRAND.orange} 100%)` }}
                >
                  <Leaf className="w-8 h-8 mb-3 text-white/70" />
                  <h3 className="font-black text-lg mb-2">Restez informé</h3>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    Recevez nos meilleurs conseils nutrition et recettes chaque semaine.
                  </p>
                  <Link
                    to="/subscriptions"
                    className="block text-center font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                    style={{ background: 'white', color: BRAND.red }}
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