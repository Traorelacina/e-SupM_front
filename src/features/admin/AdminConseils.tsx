// features/admin/AdminConseils.tsx
import { useState, useEffect, useRef, FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, Lightbulb, ChefHat, Plus, Pencil, Trash2, Eye,
  EyeOff, Star, Search, X, Upload, Video, Image,
  FileText, Layers, Clock, Users, BarChart3, Check,
  AlertTriangle, Loader2, Link as LinkIcon,
  Plus as PlusIcon, Minus,
} from 'lucide-react'
import {
  adminConseilApi,
  type Conseil,
  type ConseilCategory,
  type ConseilContentType,
  type ConseilDifficulty,
  type ConseilIngredient,
} from '@/api'

// ── Types ──────────────────────────────────────────────────────────────

interface ConseilFormData {
  title: string             // Titre de l'article (obligatoire, varchar 255)
  slug: string              // Slug URL unique (auto-généré si vide)
  excerpt: string           // Résumé court affiché en aperçu (text, nullable)
  category: ConseilCategory // enum: 'nutrition' | 'astuce' | 'recette'
  content_type: ConseilContentType // enum: 'text' | 'video' | 'image' | 'mixed'
  body: string              // Contenu HTML principal (longtext, nullable)
  video_url: string         // URL YouTube / Vimeo (varchar 255, nullable)
  video_provider: string    // 'youtube' | 'vimeo' | 'local' (varchar 255, nullable)
  video_duration: string    // Ex: "5:32" (varchar 255, nullable)
  thumbnail: string         // Chemin local ou URL absolue (varchar 255, nullable)
  gallery: string[]         // Tableau d'URLs → stocké en JSON dans la BDD (nullable)
  tags: string              // Tags séparés par des virgules (varchar 255, nullable)
  reading_time: string      // Ex: "3 min" — calculé auto depuis body si vide (varchar 255)
  is_published: boolean     // tinyint(1), visible sur le site public
  is_featured: boolean      // tinyint(1), affiché en "À la une"
  published_at: string      // timestamp nullable, vide = maintenant
  recipe_ingredients: ConseilIngredient[] // JSON en BDD — envoyé seulement si category === 'recette'
  recipe_prep_time: string | number       // int nullable (minutes)
  recipe_cook_time: string | number       // int nullable (minutes)
  recipe_servings: string | number        // int nullable (nombre de personnes)
  recipe_difficulty: ConseilDifficulty    // enum: 'facile' | 'moyen' | 'difficile' (nullable)
}

interface Meta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

interface Stats {
  total: number
  published: number
  drafts: number
  featured: number
}

// ── Config ────────────────────────────────────────────────────────────

const CATEGORIES: { value: ConseilCategory; label: string; icon: FC<{ className?: string }>; color: string }[] = [
  { value: 'nutrition', label: 'Nutrition', icon: Leaf,      color: 'text-emerald-600 bg-emerald-50' },
  { value: 'astuce',    label: 'Astuce',    icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'recette',   label: 'Recette',   icon: ChefHat,   color: 'text-orange-600 bg-orange-50' },
]

const CONTENT_TYPES: { value: ConseilContentType; label: string; icon: FC<{ className?: string }>; desc: string }[] = [
  { value: 'text',  label: 'Texte',  icon: FileText, desc: 'Article / guide rédigé' },
  { value: 'video', label: 'Vidéo',  icon: Video,    desc: 'YouTube, Vimeo ou upload' },
  { value: 'image', label: 'Image',  icon: Image,    desc: 'Galerie de photos' },
  { value: 'mixed', label: 'Mixte',  icon: Layers,   desc: 'Texte + vidéo + images' },
]

const EMPTY_FORM: ConseilFormData = {
  title: '', slug: '', excerpt: '',
  category: 'nutrition',   // Catégorie par défaut
  content_type: 'text',    // Type par défaut
  body: '', video_url: '', video_provider: '', video_duration: '',
  thumbnail: '',
  gallery: [],             // Tableau vide → envoyé en JSON "[]"
  tags: '', reading_time: '',
  is_published: false,
  is_featured: false,
  published_at: '',
  // Champs recette — envoyés à Laravel seulement si category === 'recette'
  recipe_ingredients: [{ name: '', qty: '', unit: '' }],
  recipe_prep_time: '', recipe_cook_time: '', recipe_servings: '',
  recipe_difficulty: 'facile',
}

// ── Helpers ─────────────────────────────────────────────────────────

const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const conseilToForm = (c: Conseil): ConseilFormData => ({
  title:              c.title,
  slug:               c.slug,
  excerpt:            c.excerpt ?? '',
  category:           c.category,
  content_type:       c.content_type,
  body:               c.body ?? '',
  video_url:          c.video_url ?? '',
  video_provider:     c.video_provider ?? '',
  video_duration:     c.video_duration ?? '',
  thumbnail:          c.thumbnail ?? '',
  gallery:            Array.isArray(c.gallery) ? c.gallery : [],
  tags:               c.tags ?? '',
  reading_time:       c.reading_time ?? '',
  is_published:       c.is_published,
  is_featured:        c.is_featured,
  published_at:       c.published_at ?? '',
  recipe_ingredients: (c.recipe_ingredients && c.recipe_ingredients.length)
    ? c.recipe_ingredients
    : [{ name: '', qty: '', unit: '' }],
  recipe_prep_time:   c.recipe_prep_time ?? '',
  recipe_cook_time:   c.recipe_cook_time ?? '',
  recipe_servings:    c.recipe_servings ?? '',
  recipe_difficulty:  c.recipe_difficulty ?? 'facile',
})

/**
 * Traduit les clés d'erreurs Laravel en messages français lisibles.
 *
 * Laravel retourne des clés comme :
 *   "recipe_ingredients.0.name" → "Ingrédient n°1 — le champ « nom » est requis"
 *   "gallery"                   → "Le champ « Galerie d'images » est obligatoire"
 */
const traduireErreurs = (errors: Record<string, string[]>): Record<string, string[]> => {
  const traductions: Record<string, string> = {
    title:             'Titre',
    slug:              'Slug URL',
    excerpt:           'Extrait',
    category:          'Catégorie',
    content_type:      'Type de contenu',
    body:              "Corps de l'article",
    video_url:         'URL de la vidéo',
    video_provider:    'Fournisseur vidéo',
    video_duration:    'Durée de la vidéo',
    thumbnail:         'Image de couverture',
    gallery:           "Galerie d'images",
    tags:              'Tags',
    reading_time:      'Temps de lecture',
    is_published:      'Statut de publication',
    is_featured:       'Mise en avant',
    published_at:      'Date de publication',
    recipe_ingredients:'Ingrédients',
    recipe_prep_time:  'Temps de préparation',
    recipe_cook_time:  'Temps de cuisson',
    recipe_servings:   'Nombre de personnes',
    recipe_difficulty: 'Niveau de difficulté',
  }

  const result: Record<string, string[]> = {}
  for (const [key, messages] of Object.entries(errors)) {
    // Ingrédient imbriqué : recipe_ingredients.0.name
    const match = key.match(/^recipe_ingredients\.(\d+)\.(\w+)$/)
    if (match) {
      const idx      = parseInt(match[1]) + 1
      const subField = match[2] === 'name' ? 'nom'
                     : match[2] === 'qty'  ? 'quantité'
                     : 'unité'
      result[key] = [`Ingrédient n°${idx} — le champ « ${subField} » est requis`]
    } else {
      const label = traductions[key] ?? key
      result[key] = messages.map(m =>
        m
          .replace(/The .+ field is required/i, `Le champ « ${label} » est obligatoire`)
          .replace(/must be an array/i,         `doit être un tableau`)
          .replace(/must be a string/i,         `doit être une chaîne de caractères`)
          .replace(/has already been taken/i,   `est déjà utilisé`)
          .replace(/must not be greater than/i, `ne doit pas dépasser`)
          .replace(/^The .+ field/i,            `Le champ « ${label} »`)
      )
    }
  }
  return result
}

/**
 * Construit le payload JSON à envoyer à Laravel via axios (Content-Type: application/json).
 *
 * ⚠️  POURQUOI JSON et non FormData ?
 *   Les colonnes `gallery` et `recipe_ingredients` sont de type JSON dans MySQL.
 *   Laravel valide ces champs avec `array` dans ConseilRequest.
 *   Avec FormData, un tableau vide envoyé en `gallery[]` ou en `JSON.stringify([])`
 *   est reçu comme une string → Laravel lève "must be an array".
 *   Avec un payload JSON natif, axios sérialise correctement les tableaux JS.
 *
 * ⚠️  Upload de fichiers :
 *   Le thumbnail est uploadé SÉPARÉMENT via /upload-media (endpoint dédié),
 *   et on stocke uniquement le chemin retourné dans `thumbnail`.
 *   Ainsi ce payload reste 100% JSON, sans partie multipart.
 *
 * ⚠️  Champs recette :
 *   Si category !== 'recette', tous les champs recipe_* sont envoyés à null
 *   pour ne pas déclencher la validation conditionnelle de Laravel.
 */
const buildPayload = (form: ConseilFormData): Record<string, unknown> => {
  // Auto-slug depuis le titre si le champ est vide
  const finalSlug = form.slug.trim() !== '' ? form.slug : generateSlug(form.title)

  // Galerie : toujours un tableau JS (peut être vide → JSON "[]")
  const gallery = Array.isArray(form.gallery)
    ? form.gallery.filter(u => u.trim() !== '') // Retirer les URLs vides
    : []

  // Ingrédients : null si pas une recette
  let recipe_ingredients: ConseilIngredient[] | null = null
  if (form.category === 'recette') {
    // Filtrer les lignes où NOM est vide (ligne vide non saisie)
    const filtered = form.recipe_ingredients.filter(ing => ing.name.trim() !== '')
    recipe_ingredients = filtered.length > 0 ? filtered : []
  }

  const payload: Record<string, unknown> = {
    // Champs textuels
    title:          form.title,
    slug:           finalSlug,
    excerpt:        form.excerpt  || null,
    category:       form.category,
    content_type:   form.content_type,
    body:           form.body     || null,
    video_url:      form.video_url     || null,
    video_provider: form.video_provider || null,
    video_duration: form.video_duration || null,
    thumbnail:      form.thumbnail || null,
    gallery,                                       // ← tableau JS → JSON array pour Laravel
    tags:           form.tags         || null,
    reading_time:   form.reading_time || null,

    // Booléens (Laravel les reçoit correctement en JSON true/false)
    is_published: form.is_published,
    is_featured:  form.is_featured,
    published_at: form.published_at || null,

    // Champs recette — null si la catégorie n'est pas 'recette'
    recipe_ingredients,                            // ← null ou tableau JS → JSON pour Laravel
    recipe_prep_time:  form.category === 'recette' ? (form.recipe_prep_time  || null) : null,
    recipe_cook_time:  form.category === 'recette' ? (form.recipe_cook_time  || null) : null,
    recipe_servings:   form.category === 'recette' ? (form.recipe_servings   || null) : null,
    recipe_difficulty: form.category === 'recette' ? (form.recipe_difficulty || null) : null,
  }

  // Log console pour débogage
  console.group('📤 [AdminConseils] Payload envoyé à Laravel')
  console.log('Catégorie           :', payload.category)
  console.log('Type de contenu     :', payload.content_type)
  console.log('gallery             :', payload.gallery)
  console.log('recipe_ingredients  :', payload.recipe_ingredients)
  console.log('Payload complet     :', JSON.parse(JSON.stringify(payload)))
  console.groupEnd()

  return payload
}

// ── Composants internes ───────────────────────────────────────────────

const StatCard: FC<{ label: string; value: number | undefined; color: string }> = ({ label, value, color }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <div className="text-2xl font-black">{value ?? '—'}</div>
    <div className="text-sm font-semibold opacity-70 mt-0.5">{label}</div>
  </div>
)

const ConseilRow: FC<{
  conseil: Conseil
  onEdit: (c: Conseil) => void
  onDelete: (id: number) => Promise<void>
  onTogglePublish: (c: Conseil) => Promise<void>
  onToggleFeatured: (c: Conseil) => Promise<void>
}> = ({ conseil, onEdit, onDelete, onTogglePublish, onToggleFeatured }) => {
  const cat     = CATEGORIES.find(c => c.value === conseil.category)
  const CatIcon = cat?.icon ?? Leaf
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer « ${conseil.title} » ?`)) return
    setDeleting(true)
    await onDelete(conseil.id)
    setDeleting(false)
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
            {conseil.thumbnail_url ? (
              <img src={conseil.thumbnail_url} alt={conseil.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CatIcon className="w-5 h-5 text-stone-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-stone-900 text-sm truncate max-w-xs">{conseil.title}</div>
            <div className="text-xs text-stone-400">{conseil.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cat?.color}`}>
          <CatIcon className="w-3 h-3" /> {cat?.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-stone-500 capitalize">{conseil.content_type}</td>
      <td className="px-4 py-3 text-xs text-stone-400">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {conseil.views}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block w-2 h-2 rounded-full ${conseil.is_published ? 'bg-green-500' : 'bg-stone-300'}`} />
        <span className="ml-1.5 text-xs text-stone-600">{conseil.is_published ? 'Publié' : 'Brouillon'}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onTogglePublish(conseil)} title={conseil.is_published ? 'Dépublier' : 'Publier'}
            className="p-1.5 rounded-lg hover:bg-green-50 text-stone-400 hover:text-green-700">
            {conseil.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={() => onToggleFeatured(conseil)} title={conseil.is_featured ? 'Retirer mise en avant' : 'Mettre en avant'}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-500">
            <Star className={`w-4 h-4 ${conseil.is_featured ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <button onClick={() => onEdit(conseil)} className="p-1.5 rounded-lg hover:bg-blue-50 text-stone-400 hover:text-blue-600">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

// ── Modal de création/édition ─────────────────────────────────────────

const ConseilModal: FC<{ conseil: Conseil | null; onClose: () => void; onSaved: () => void }> = ({
  conseil, onClose, onSaved,
}) => {
  const [form, setForm]           = useState<ConseilFormData>(() => conseil ? conseilToForm(conseil) : { ...EMPTY_FORM })
  const [saving, setSaving]       = useState(false)
  const [errors, setErrors]       = useState<Record<string, string[]>>({})
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const thumbRef                  = useRef<HTMLInputElement>(null)

  const setField = <K extends keyof ConseilFormData>(field: K, value: ConseilFormData[K]) =>
    setForm(p => ({ ...p, [field]: value }))

  /**
   * Upload de la miniature via l'endpoint dédié /upload-media.
   * On stocke uniquement le chemin retourné (pas de base64 dans le payload principal).
   */
  const uploadThumb = async (file: File) => {
    setUploading(true)
    try {
      console.log('📸 [AdminConseils] Upload miniature :', file.name, `(${(file.size / 1024).toFixed(1)} Ko)`)
      const r = await adminConseilApi.uploadMedia(file, 'thumbnail')
      setField('thumbnail', r.path)
      console.log('✅ [AdminConseils] Miniature uploadée → chemin :', r.path)
    } catch (e) {
      console.error('❌ [AdminConseils] Échec upload miniature :', e)
      alert("Échec de l'upload de l'image. Vérifiez la taille (max 8 Mo) et le format (jpg, png, webp).")
    } finally {
      setUploading(false)
    }
  }

  // ── Gestion des ingrédients ────────────────────────────────────────
  const addIngredient    = () =>
    setField('recipe_ingredients', [...form.recipe_ingredients, { name: '', qty: '', unit: '' }])

  const removeIngredient = (i: number) =>
    setField('recipe_ingredients', form.recipe_ingredients.filter((_, j) => j !== i))

  const updateIngredient = (i: number, field: keyof ConseilIngredient, value: string) => {
    const next = [...form.recipe_ingredients]
    next[i]    = { ...next[i], [field]: value }
    setField('recipe_ingredients', next)
  }

  // ── Sauvegarde ────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true)
    setErrors({})

    // Validation côté client (rapide, avant le réseau)
    const clientErrors: Record<string, string[]> = {}
    if (!form.title.trim()) {
      clientErrors.title = ['Le titre est obligatoire']
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setSaving(false)
      console.warn('⚠️ [AdminConseils] Erreurs client :', clientErrors)
      return
    }

    try {
      const payload = buildPayload(form)

      if (conseil?.id) {
        console.log(`🔄 [AdminConseils] Mise à jour — conseil ID ${conseil.id}`)
        await adminConseilApi.update(conseil.id, payload)
        console.log('✅ [AdminConseils] Mise à jour réussie')
      } else {
        console.log('🆕 [AdminConseils] Création d\'un nouveau conseil')
        await adminConseilApi.create(payload)
        console.log('✅ [AdminConseils] Création réussie')
      }
      onSaved()
    } catch (err: any) {
      console.error('❌ [AdminConseils] Erreur API :', err)

      if (err.response?.status === 422) {
        // Erreurs de validation Laravel
        const rawErrors = err.response?.data?.errors as Record<string, string[]> | undefined
        const rawMessage = err.response?.data?.message as string | undefined

        if (rawErrors) {
          console.warn('⚠️ [AdminConseils] Erreurs de validation (brut) :', rawErrors)
          setErrors(traduireErreurs(rawErrors))
        } else if (rawMessage) {
          console.warn('⚠️ [AdminConseils] Message Laravel :', rawMessage)
          setErrors({ _global: [`Erreur de validation : ${rawMessage}`] })
        } else {
          setErrors({ _global: ['Formulaire invalide. Vérifiez les champs et réessayez.'] })
        }
      } else {
        console.error('❌ [AdminConseils] Erreur inattendue :', err.message)
        alert(`Erreur inattendue : ${err.message || 'Consultez la console pour les détails.'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { key: 'general', label: 'Général' },
    { key: 'content', label: 'Contenu' },
    { key: 'media',   label: 'Médias' },
    ...(form.category === 'recette' ? [{ key: 'recette', label: 'Recette' }] : []),
    { key: 'publish', label: 'Publication' },
  ]

  const errorCount = Object.keys(errors).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="font-black text-stone-900 text-lg">
            {conseil ? 'Modifier le conseil' : 'Nouveau conseil'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-200"><X className="w-5 h-5" /></button>
        </div>

        {/* Bandeau d'erreurs — en français, clair et explicite */}
        {errorCount > 0 && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorCount === 1
                ? '1 erreur à corriger avant de sauvegarder :'
                : `${errorCount} erreur(s) à corriger avant de sauvegarder :`}
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {Object.entries(errors).flatMap(([field, messages]) =>
                messages.map((msg, i) => <li key={`${field}-${i}`}>{msg}</li>)
              )}
            </ul>
          </div>
        )}

        {/* Onglets */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2 gap-1 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-green-600 text-green-700 bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── Onglet Général ── */}
          {activeTab === 'general' && (
            <>
              {/* Titre — varchar(255), obligatoire */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) — obligatoire</span>
                </label>
                <input type="text" value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="Ex: 5 astuces pour mieux manger"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-400 ${errors.title ? 'border-red-400 bg-red-50' : 'border-stone-200'}`} />
                {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title[0]}</p>}
              </div>

              {/* Slug — varchar(255), unique, auto-généré */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Slug URL
                  <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) unique — auto-généré depuis le titre si vide</span>
                </label>
                <input type="text" value={form.slug}
                  onChange={e => setField('slug', e.target.value)}
                  placeholder="ex: 5-astuces-pour-mieux-manger"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-400 ${errors.slug ? 'border-red-400 bg-red-50' : 'border-stone-200'}`} />
                {errors.slug && <p className="text-red-500 text-xs mt-1">⚠ {errors.slug[0]}</p>}
              </div>

              {/* Extrait — text, nullable */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Extrait
                  <span className="ml-2 text-xs font-normal text-stone-400">text nullable — résumé affiché dans les listes</span>
                </label>
                <textarea rows={3} value={form.excerpt}
                  onChange={e => setField('excerpt', e.target.value)}
                  placeholder="Résumé de l'article…"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm resize-none" />
              </div>

              {/* Catégorie — enum obligatoire */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-stone-400">enum: nutrition | astuce | recette</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <button key={cat.value} type="button" onClick={() => setField('category', cat.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold ${
                          form.category === cat.value
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}>
                        <Icon className="w-4 h-4" /> {cat.label}
                      </button>
                    )
                  })}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">⚠ {errors.category[0]}</p>}
              </div>

              {/* Type de contenu — enum obligatoire */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Type de contenu <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-stone-400">enum: text | video | image | mixed</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_TYPES.map(ct => {
                    const Icon = ct.icon
                    return (
                      <button key={ct.value} type="button" onClick={() => setField('content_type', ct.value)}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left ${
                          form.content_type === ct.value ? 'border-green-600 bg-green-50' : 'border-stone-200 hover:border-stone-300'
                        }`}>
                        <Icon className={`w-4 h-4 mt-0.5 ${form.content_type === ct.value ? 'text-green-600' : 'text-stone-400'}`} />
                        <div>
                          <div className={`text-sm font-semibold ${form.content_type === ct.value ? 'text-green-700' : 'text-stone-700'}`}>{ct.label}</div>
                          <div className="text-xs text-stone-400">{ct.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.content_type && <p className="text-red-500 text-xs mt-1">⚠ {errors.content_type[0]}</p>}
              </div>

              {/* Tags — varchar(255), nullable */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Tags
                  <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) nullable — séparés par des virgules</span>
                </label>
                <input type="text" value={form.tags}
                  onChange={e => setField('tags', e.target.value)}
                  placeholder="santé, nutrition, recette rapide"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </>
          )}

          {/* ── Onglet Contenu ── */}
          {activeTab === 'content' && (
            <>
              {(form.content_type === 'text' || form.content_type === 'mixed') && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Corps de l'article (HTML)
                    <span className="ml-2 text-xs font-normal text-stone-400">longtext nullable</span>
                  </label>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <div className="bg-stone-50 border-b px-3 py-2 flex gap-2 flex-wrap text-xs">
                      {['<strong>', '<em>', '<ul><li>', '<ol><li>', '<h2>', '<h3>', '<blockquote>'].map(tag => (
                        <button key={tag} type="button"
                          onClick={() => {
                            const ta = document.getElementById('body-ta') as HTMLTextAreaElement | null
                            if (!ta) return
                            const start = ta.selectionStart, end = ta.selectionEnd
                            const sel   = form.body.slice(start, end)
                            const ins   = `${tag}${sel}</${tag.slice(1)}`
                            setField('body', form.body.slice(0, start) + ins + form.body.slice(end))
                          }}
                          className="bg-white border px-2 py-0.5 rounded font-mono hover:border-green-400">
                          {tag.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                    <textarea id="body-ta" rows={14} value={form.body}
                      onChange={e => setField('body', e.target.value)}
                      placeholder="<p>Commencez à rédiger ici…</p>"
                      className="w-full px-4 py-3 text-sm font-mono focus:outline-none resize-y" />
                  </div>
                  {errors.body && <p className="text-red-500 text-xs mt-1">⚠ {errors.body[0]}</p>}
                </div>
              )}

              {(form.content_type === 'video' || form.content_type === 'mixed') && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold">
                    Vidéo
                    <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) nullable</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="url" value={form.video_url}
                      onChange={e => setField('video_url', e.target.value)}
                      placeholder="https://youtube.com/watch?v=… ou https://vimeo.com/…"
                      className="w-full pl-9 border border-stone-200 rounded-xl px-4 py-2.5 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Fournisseur (auto-détecté si vide)</label>
                      <select value={form.video_provider} onChange={e => setField('video_provider', e.target.value)}
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">Auto-detect</option>
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="local">Upload local</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Durée (ex: 5:32)</label>
                      <input type="text" value={form.video_duration}
                        onChange={e => setField('video_duration', e.target.value)}
                        placeholder="5:32"
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  {errors.video_url && <p className="text-red-500 text-xs">⚠ {errors.video_url[0]}</p>}
                </div>
              )}

              {form.content_type === 'image' && (
                <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-500">
                  💡 Pour le type <strong>Image</strong>, ajoutez vos photos dans l'onglet <strong>Médias → Galerie</strong>.
                </div>
              )}
            </>
          )}

          {/* ── Onglet Médias ── */}
          {activeTab === 'media' && (
            <>
              {/* Thumbnail — varchar(255), uploadé via /upload-media */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Image de couverture
                  <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) nullable — uploadée via /upload-media</span>
                </label>
                {form.thumbnail ? (
                  <div className="relative inline-block">
                    <img
                      src={form.thumbnail.startsWith('http') ? form.thumbnail : `/storage/${form.thumbnail}`}
                      alt="Miniature" className="w-48 h-32 object-cover rounded-xl border" />
                    <button onClick={() => setField('thumbnail', '')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => thumbRef.current?.click()}
                    className="w-48 h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                    {uploading
                      ? <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                      : <><Upload className="w-6 h-6 mb-1 text-stone-400" /><span className="text-xs text-stone-400">Cliquer pour uploader</span></>}
                  </div>
                )}
                <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadThumb(e.target.files[0])} />
                <div className="mt-2">
                  <label className="text-xs text-stone-400 block mb-1">Ou coller une URL externe</label>
                  <input type="url"
                    value={form.thumbnail.startsWith('http') ? form.thumbnail : ''}
                    onChange={e => setField('thumbnail', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm" />
                </div>
                {errors.thumbnail && <p className="text-red-500 text-xs mt-1">⚠ {errors.thumbnail[0]}</p>}
              </div>

              {/* Galerie — JSON en BDD (tableau d'URLs) */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Galerie d'images
                  <span className="ml-2 text-xs font-normal text-stone-400">JSON nullable — tableau d'URLs envoyé en application/json</span>
                </label>
                <p className="text-xs text-stone-400 mb-2">Une URL par ligne. Les lignes vides sont ignorées à l'envoi.</p>
                {form.gallery.map((url, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="url" value={url}
                      onChange={e => {
                        const next = [...form.gallery]
                        next[i] = e.target.value
                        setField('gallery', next)
                      }}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                    <button type="button"
                      onClick={() => setField('gallery', form.gallery.filter((_, j) => j !== i))}
                      className="p-2 text-stone-300 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setField('gallery', [...form.gallery, ''])}
                  className="flex items-center gap-1 text-xs text-green-700 font-semibold mt-1">
                  <PlusIcon className="w-3 h-3" /> Ajouter une image
                </button>
                {errors.gallery && <p className="text-red-500 text-xs mt-1">⚠ {errors.gallery[0]}</p>}
              </div>

              {/* Temps de lecture — varchar(255), auto-calculé */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Temps de lecture
                  <span className="ml-2 text-xs font-normal text-stone-400">varchar(255) — calculé automatiquement depuis le corps si vide</span>
                </label>
                <input type="text" value={form.reading_time}
                  onChange={e => setField('reading_time', e.target.value)}
                  placeholder="3 min"
                  className="w-full max-w-xs border border-stone-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </>
          )}

          {/* ── Onglet Recette — affiché seulement si category === 'recette' ── */}
          {activeTab === 'recette' && form.category === 'recette' && (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                🍳 Ces champs sont stockés en <strong>JSON</strong> dans la base et ne sont envoyés que pour les recettes.
                Si la catégorie change, ils sont ignorés.
              </div>

              {/* Temps & Personnes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-stone-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" /> Prép. (min)
                    <span className="text-stone-300 ml-1">int</span>
                  </label>
                  <input type="number" min="0" value={form.recipe_prep_time}
                    onChange={e => setField('recipe_prep_time', e.target.value)}
                    placeholder="15"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" /> Cuisson (min)
                    <span className="text-stone-300 ml-1">int</span>
                  </label>
                  <input type="number" min="0" value={form.recipe_cook_time}
                    onChange={e => setField('recipe_cook_time', e.target.value)}
                    placeholder="30"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3" /> Personnes
                    <span className="text-stone-300 ml-1">int</span>
                  </label>
                  <input type="number" min="1" value={form.recipe_servings}
                    onChange={e => setField('recipe_servings', e.target.value)}
                    placeholder="4"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 flex items-center gap-1 mb-1">
                    <BarChart3 className="w-3 h-3" /> Niveau
                    <span className="text-stone-300 ml-1">enum</span>
                  </label>
                  <select value={form.recipe_difficulty}
                    onChange={e => setField('recipe_difficulty', e.target.value as ConseilDifficulty)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm">
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
              </div>

              {/* Ingrédients — JSON: [{name, qty, unit}] */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold">
                    Ingrédients
                    <span className="ml-2 text-xs font-normal text-stone-400">JSON: [{'{'}name, qty, unit{'}'}] — les lignes sans nom sont ignorées</span>
                  </label>
                  <button type="button" onClick={addIngredient}
                    className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                    <PlusIcon className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {form.recipe_ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={ing.name}
                        onChange={e => updateIngredient(i, 'name', e.target.value)}
                        placeholder="Ingrédient (ex: farine)"
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm ${
                          errors[`recipe_ingredients.${i}.name`] ? 'border-red-400 bg-red-50' : 'border-stone-200'
                        }`} />
                      <input type="text" value={ing.qty}
                        onChange={e => updateIngredient(i, 'qty', e.target.value)}
                        placeholder="Qté"
                        className="w-20 border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                      <input type="text" value={ing.unit}
                        onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        placeholder="g / ml"
                        className="w-20 border border-stone-200 rounded-lg px-3 py-2 text-sm" />
                      <button type="button" onClick={() => removeIngredient(i)}
                        className="p-1.5 text-stone-300 hover:text-red-500">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Erreurs spécifiques aux ingrédients */}
                {Object.entries(errors)
                  .filter(([k]) => k.startsWith('recipe_ingredients'))
                  .map(([k, msgs]) => (
                    <p key={k} className="text-red-500 text-xs mt-1">⚠ {msgs[0]}</p>
                  ))}
              </div>
            </>
          )}

          {/* ── Onglet Publication ── */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              {[
                { field: 'is_published', label: 'Publier',         desc: 'Rendre visible sur le site public',    activeColor: 'bg-green-500' },
                { field: 'is_featured',  label: 'Mettre en avant', desc: 'Afficher dans la section "À la une"',  activeColor: 'bg-amber-400' },
              ].map(({ field, label, desc, activeColor }) => (
                <label key={field} className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 cursor-pointer hover:border-green-400">
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${form[field as keyof ConseilFormData] ? activeColor : 'bg-stone-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[field as keyof ConseilFormData] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <input type="checkbox"
                    checked={!!form[field as keyof ConseilFormData]}
                    onChange={e => setField(field as keyof ConseilFormData, e.target.checked as any)}
                    className="hidden" />
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs text-stone-400">{desc}</div>
                  </div>
                </label>
              ))}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Date de publication
                  <span className="ml-2 text-xs font-normal text-stone-400">timestamp nullable — vide = maintenant</span>
                </label>
                <input type="datetime-local"
                  value={form.published_at?.slice(0, 16) || ''}
                  onChange={e => setField('published_at', e.target.value)}
                  className="w-full max-w-xs border border-stone-200 rounded-xl px-4 py-2.5 text-sm" />
                <p className="text-xs text-stone-400 mt-1">Laissez vide pour publier immédiatement.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t bg-stone-50">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-sm font-semibold">
            Annuler
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 disabled:opacity-50 shadow">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Enregistrement…' : conseil ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Page principale AdminConseils ─────────────────────────────────────

export default function AdminConseils() {
  const [conseils, setConseils]   = useState<Conseil[]>([])
  const [stats, setStats]         = useState<Stats>({ total: 0, published: 0, drafts: 0, featured: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState<string>('')
  const [published, setPublished] = useState<string>('')
  const [page, setPage]           = useState(1)
  const [meta, setMeta]           = useState<Meta | null>(null)
  const [modal, setModal]         = useState<Conseil | 'create' | null>(null)

  const load = async (p: number = 1) => {
    setLoading(true)
    console.log(`🔍 [AdminConseils] Chargement page ${p}`, { search, category, published })
    try {
      const r = await adminConseilApi.list({
        search:       search || undefined,
        category:     category ? (category as ConseilCategory) : undefined,
        is_published: published !== '' ? published === 'true' : undefined,
        page:         p,
        per_page:     20,
      })
      setConseils(r.data.data)
      setMeta({
        current_page: r.data.current_page,
        from:         r.data.from,
        last_page:    r.data.last_page,
        per_page:     r.data.per_page,
        to:           r.data.to,
        total:        r.data.total,
      })
      setStats(r.stats)
      console.log(`✅ [AdminConseils] ${r.data.data.length} conseils chargés (total: ${r.data.total})`)
    } catch (err) {
      console.error('❌ [AdminConseils] Erreur chargement liste :', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [search, category, published])

  const handleDelete         = async (id: number)  => { console.log(`🗑 [AdminConseils] Suppression ID ${id}`); await adminConseilApi.delete(id);          load(page) }
  const handleTogglePublish  = async (c: Conseil)   => { console.log(`👁 [AdminConseils] Toggle pub ID ${c.id}`); await adminConseilApi.togglePublish(c.id);  load(page) }
  const handleToggleFeatured = async (c: Conseil)   => { console.log(`⭐ [AdminConseils] Toggle une ID ${c.id}`); await adminConseilApi.toggleFeatured(c.id); load(page) }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Nos Conseils</h1>
            <p className="text-stone-400 text-sm">Gérez les articles, vidéos et recettes</p>
          </div>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 shadow">
            <Plus className="w-4 h-4" /> Nouveau conseil
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total"      value={stats.total}     color="bg-stone-100 text-stone-700" />
          <StatCard label="Publiés"    value={stats.published} color="bg-green-50 text-green-700" />
          <StatCard label="Brouillons" value={stats.drafts}    color="bg-amber-50 text-amber-700" />
          <StatCard label="À la une"   value={stats.featured}  color="bg-orange-50 text-orange-700" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un conseil…"
              className="w-full pl-9 border rounded-xl py-2.5 text-sm bg-white" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm bg-white">
            <option value="">Toutes catégories</option>
            <option value="nutrition">Nutrition</option>
            <option value="astuce">Astuce</option>
            <option value="recette">Recette</option>
          </select>
          <select value={published} onChange={e => setPublished(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm bg-white">
            <option value="">Tous statuts</option>
            <option value="true">Publiés</option>
            <option value="false">Brouillons</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-stone-50">
                {['Conseil', 'Catégorie', 'Type', 'Vues', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-4">
                      <div className="h-8 bg-stone-100 rounded animate-pulse" />
                    </td></tr>
                  ))
                : conseils.length === 0
                ? (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-stone-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun conseil trouvé</p>
                  </td></tr>
                )
                : (
                  <AnimatePresence>
                    {conseils.map(c => (
                      <ConseilRow key={c.id} conseil={c}
                        onEdit={setModal}
                        onDelete={handleDelete}
                        onTogglePublish={handleTogglePublish}
                        onToggleFeatured={handleToggleFeatured} />
                    ))}
                  </AnimatePresence>
                )
              }
            </tbody>
          </table>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-between px-4 py-3 border-t">
              <p className="text-xs text-stone-400">{meta.from}–{meta.to} sur {meta.total}</p>
              <div className="flex gap-1">
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => { setPage(p); load(p) }}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold ${p === page ? 'bg-green-700 text-white' : 'hover:bg-stone-100'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <ConseilModal
            conseil={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load(page) }} />
        )}
      </AnimatePresence>
    </div>
  )
}