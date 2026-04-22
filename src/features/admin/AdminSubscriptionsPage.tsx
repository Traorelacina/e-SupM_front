import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  PauseCircle,
  XCircle,
  Clock,
  Search,
  Play,
  Zap,
  Eye,
  AlertTriangle,
  Check,
  CalendarCheck,
  Phone,
  Mail,
  Package,
  RefreshCw,
  Ban,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  Layers,
  ArrowUpRight,
  CircleDot,
  MoreVertical,
  Inbox,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { adminSubscriptionApi, storageUrl } from '@/api'  // ← Import storageUrl depuis api
import { useToast } from '@/hooks/useToast'
import type { Subscription } from '@/api'

// ─── Fonction utilitaire pour récupérer l'URL de l'image ─────────────────────

function getProductImageUrl(product: any): string | null {
  if (!product) return null
  
  // Priorité 1: primary_image avec URL directe
  if (product.primary_image?.url) {
    return product.primary_image.url
  }
  
  // Priorité 2: primary_image avec path
  if (product.primary_image?.path) {
    return storageUrl(product.primary_image.path)
  }
  
  // Priorité 3: images array
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0]
    if (firstImage.url) return firstImage.url
    if (firstImage.path) return storageUrl(firstImage.path)
  }
  
  // Priorité 4: image directe sur le produit
  if (product.image) {
    return storageUrl(product.image)
  }
  
  // Priorité 5: image_url
  if (product.image_url) {
    return product.image_url
  }
  
  return null
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LaravelPaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: 'Actif',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  suspended: {
    label: 'Suspendu',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    ring: 'ring-amber-200',
  },
  cancelled: {
    label: 'Annulé',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-400',
    ring: 'ring-red-200',
  },
  pending: {
    label: 'En attente',
    bg: 'bg-stone-50',
    text: 'text-stone-600',
    border: 'border-stone-200',
    dot: 'bg-stone-400',
    ring: 'ring-stone-200',
  },
} as const

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Hebdo',
  biweekly: 'Bi-mens.',
  monthly: 'Mensuel',
}

const DELIVERY_LABELS: Record<string, string> = {
  home: 'Domicile',
  click_collect: 'Click & Collect',
  locker: 'Casier',
}

const FILTER_TABS = [
  { key: '', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'suspended', label: 'Suspendus' },
  { key: 'cancelled', label: 'Annulés' },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color: 'green' | 'amber' | 'red' | 'blue' | 'stone'
}

function StatCard({ label, value, icon: Icon, trend, color }: StatCardProps) {
  const palette = {
    green: { accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    amber: { accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    red:   { accent: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100'    },
    blue:  { accent: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-100'    },
    stone: { accent: 'text-stone-500',  bg: 'bg-stone-50',  border: 'border-stone-100'  },
  }[color]

  return (
    <div className={`relative rounded-2xl border ${palette.border} bg-white p-5 overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] ${palette.bg} opacity-60`} />
      <div className="relative">
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${palette.bg} ${palette.accent} mb-3`}>
          <Icon size={17} />
        </div>
        <p className="text-2xl font-black text-stone-900 tabular-nums">{value}</p>
        <p className="text-xs text-stone-500 mt-0.5 font-medium">{label}</p>
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] font-semibold ${palette.accent}`}>
            <ArrowUpRight size={10} />
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Upcoming Card ────────────────────────────────────────────────────────────

function UpcomingCard({ sub }: { sub: Subscription }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-black text-xs shrink-0">
        {getInitials(sub.user?.name ?? 'U')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-stone-900 truncate">{sub.user?.name}</p>
        <p className="text-[10px] text-stone-500 mt-0.5">
          {sub.items?.length ?? 0} article{(sub.items?.length ?? 0) > 1 ? 's' : ''} · {FREQ_LABELS[sub.frequency] ?? sub.frequency}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-amber-700">{sub.next_delivery_at ? formatDate(sub.next_delivery_at) : '—'}</p>
        <p className="text-[10px] text-amber-500 mt-0.5">livraison imminente</p>
      </div>
    </div>
  )
}

// ─── Subscription Drawer ──────────────────────────────────────────────────────

function SubscriptionDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: sub, isLoading } = useQuery({
    queryKey: ['admin-subscription', id],
    queryFn: () => adminSubscriptionApi.show(id).then(r => r.data ?? r),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
    queryClient.invalidateQueries({ queryKey: ['admin-subscription', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-upcoming'] })
  }

  const suspendMutation = useMutation({
    mutationFn: () => adminSubscriptionApi.suspend(id),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Abonnement suspendu' }) },
    onError: (err: any) => toast({ type: 'error', message: err?.response?.data?.message ?? 'Erreur' }),
  })

  const resumeMutation = useMutation({
    mutationFn: () => adminSubscriptionApi.resume(id),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Abonnement réactivé' }) },
    onError: (err: any) => toast({ type: 'error', message: err?.response?.data?.message ?? 'Erreur' }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => adminSubscriptionApi.cancel(id),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Abonnement annulé' }); onClose() },
    onError: (err: any) => toast({ type: 'error', message: err?.response?.data?.message ?? 'Erreur' }),
  })

  const processMutation = useMutation({
    mutationFn: () => adminSubscriptionApi.processManually(id),
    onSuccess: (res: any) => { invalidate(); toast({ type: 'success', message: res?.message ?? 'Commande générée' }) },
    onError: (err: any) => toast({ type: 'error', message: err?.response?.data?.message ?? 'Erreur' }),
  })

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col z-50 border-l border-stone-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
        <div>
          <h3 className="font-black text-stone-900 text-sm">Détail de l'abonnement</h3>
          {sub && <p className="text-[10px] text-stone-400 mt-0.5">#{sub.id} · créé le {formatDate(sub.created_at)}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
        >
          <XCircle size={14} className="text-stone-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-14 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sub ? (
          <>
            {/* Utilisateur */}
            <div className="px-6 py-5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {getInitials(sub.user?.name ?? 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 truncate">{sub.user?.name ?? '—'}</p>
                  <div className="space-y-0.5 mt-1">
                    {sub.user?.email && (
                      <a href={`mailto:${sub.user.email}`} className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-orange-500 transition-colors">
                        <Mail size={10} />
                        {sub.user.email}
                      </a>
                    )}
                    {sub.user?.phone && (
                      <a href={`tel:${sub.user.phone}`} className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-orange-500 transition-colors">
                        <Phone size={10} />
                        {sub.user.phone}
                      </a>
                    )}
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>
            </div>

            {/* Infos abonnement */}
            <div className="px-6 py-5 border-b border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Abonnement</p>
              <p className="font-bold text-stone-900 mb-3">{sub.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', value: sub.type === 'standard' ? `Standard${sub.preset_type ? ` · ${sub.preset_type}` : ''}` : 'Personnalisé' },
                  { label: 'Fréquence', value: FREQ_LABELS[sub.frequency] ?? sub.frequency },
                  { label: 'Livraison', value: DELIVERY_LABELS[sub.delivery_type] ?? sub.delivery_type },
                  { label: 'Paiement', value: sub.payment_method === 'auto' ? 'Automatique' : 'Manuel' },
                  { label: 'Remise', value: `${sub.discount_percent ?? 0}%` },
                  { label: 'Prochaine livr.', value: sub.next_delivery_at ? formatDate(sub.next_delivery_at) : '—' },
                ].map(row => (
                  <div key={row.label} className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{row.label}</p>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">{row.value}</p>
                  </div>
                ))}
              </div>

              {sub.total != null && (
                <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <span className="text-sm text-stone-600 font-medium">Total / cycle</span>
                  <span className="font-black text-orange-600 text-xl">{formatCurrency(sub.total)}</span>
                </div>
              )}
            </div>

            {/* Articles avec images */}
            {(sub.items?.length ?? 0) > 0 && (
              <div className="px-6 py-5 border-b border-stone-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
                  Articles ({sub.items!.length})
                </p>
                <div className="space-y-3">
                  {sub.items!.map(item => {
                    const imageUrl = getProductImageUrl(item.product)
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={item.product?.name || 'Produit'} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <Package size={16} className="text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {item.product?.name ?? `Produit #${item.product_id}`}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-stone-800 tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Commandes récentes */}
            {(sub.orders?.length ?? 0) > 0 && (
              <div className="px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Commandes récentes</p>
                <div className="space-y-2">
                  {sub.orders!.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-stone-900">#{order.reference ?? order.id}</p>
                        <p className="text-[11px] text-stone-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-900">{formatCurrency(order.total)}</p>
                        <p className="text-[11px] text-stone-500 capitalize mt-0.5">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Actions */}
      {sub && (
        <div className="px-6 py-4 border-t border-stone-100 space-y-2 bg-stone-50">
          <Button
            variant="orange"
            className="w-full"
            loading={processMutation.isPending}
            onClick={() => processMutation.mutate()}
            leftIcon={<Zap size={14} />}
            disabled={sub.status !== 'active'}
            size="sm"
          >
            Générer une commande maintenant
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {sub.status === 'active' && (
              <Button
                variant="secondary"
                loading={suspendMutation.isPending}
                onClick={() => suspendMutation.mutate()}
                leftIcon={<PauseCircle size={14} />}
                size="sm"
              >
                Suspendre
              </Button>
            )}
            {sub.status === 'suspended' && (
              <Button
                variant="secondary"
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
                leftIcon={<Play size={14} />}
                size="sm"
              >
                Réactiver
              </Button>
            )}
            {sub.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50"
                leftIcon={<Ban size={14} />}
                loading={cancelMutation.isPending}
                onClick={() => {
                  if (confirm('Annuler cet abonnement ?')) cancelMutation.mutate()
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Subscription Row ─────────────────────────────────────────────────────────

function SubscriptionRow({
  sub,
  selected,
  onSelect,
}: {
  sub: Subscription
  selected: boolean
  onSelect: (id: number) => void
}) {
  return (
    <tr
      className={`border-b border-stone-100 cursor-pointer transition-colors group ${
        selected ? 'bg-orange-50' : 'hover:bg-stone-50'
      }`}
      onClick={() => onSelect(sub.id)}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(sub.user?.name ?? 'U')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{sub.user?.name ?? '—'}</p>
            <p className="text-[11px] text-stone-400 truncate">{sub.user?.email}</p>
          </div>
        </div>
      </td>

      <td className="px-3 py-3.5 hidden md:table-cell">
        <p className="text-sm text-stone-800 font-semibold truncate max-w-[160px]">{sub.name}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {FREQ_LABELS[sub.frequency] ?? sub.frequency}
          {sub.delivery_type && ` · ${DELIVERY_LABELS[sub.delivery_type] ?? sub.delivery_type}`}
        </p>
      </td>

      <td className="px-3 py-3.5 hidden lg:table-cell">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          sub.type === 'standard'
            ? 'bg-violet-50 text-violet-700'
            : 'bg-sky-50 text-sky-700'
        }`}>
          {sub.type === 'standard' ? 'Standard' : 'Personnalisé'}
        </span>
      </td>

      <td className="px-3 py-3.5 hidden sm:table-cell">
        <p className="text-sm font-black text-stone-900 tabular-nums">
          {sub.total != null ? formatCurrency(sub.total) : '—'}
        </p>
        {(sub.discount_percent ?? 0) > 0 && (
          <p className="text-[10px] text-emerald-600 font-medium">-{sub.discount_percent}% remise</p>
        )}
      </td>

      <td className="px-3 py-3.5 hidden xl:table-cell">
        {sub.next_delivery_at ? (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <CalendarCheck size={12} className="text-stone-400 shrink-0" />
            {formatDate(sub.next_delivery_at)}
          </div>
        ) : (
          <span className="text-xs text-stone-300">—</span>
        )}
      </td>

      <td className="px-3 py-3.5">
        <StatusBadge status={sub.status} />
      </td>

      <td className="px-3 py-3.5">
        <button
          className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 hover:bg-orange-100 flex items-center justify-center text-stone-500 hover:text-orange-600"
          onClick={e => { e.stopPropagation(); onSelect(sub.id) }}
        >
          <Eye size={13} />
        </button>
      </td>
    </tr>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data: paginated, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, page],
    queryFn: () =>
      adminSubscriptionApi
        .index({ status: statusFilter || undefined, page })
        .then(r => r as unknown as LaravelPaginatedResponse<Subscription>),
  })

  const { data: upcoming, refetch: refetchUpcoming } = useQuery({
    queryKey: ['admin-subscriptions-upcoming'],
    queryFn: () =>
      adminSubscriptionApi.upcoming().then(r => {
        return (Array.isArray(r) ? r : (r as any).data ?? []) as Subscription[]
      }),
  })

  const subscriptions: Subscription[] = paginated?.data ?? []
  const totalPages  = paginated?.last_page ?? 1
  const currentPage = paginated?.current_page ?? 1
  const totalCount  = paginated?.total ?? 0

  const filtered = search.trim()
    ? subscriptions.filter(s =>
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase())
      )
    : subscriptions

  const statsOnPage = {
    active:    subscriptions.filter(s => s.status === 'active').length,
    suspended: subscriptions.filter(s => s.status === 'suspended').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  }

  const handleRefresh = () => {
    refetch()
    refetchUpcoming()
    toast({ type: 'info', message: 'Données actualisées' })
  }

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Abonnements</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {totalCount > 0 ? `${totalCount} abonnement${totalCount > 1 ? 's' : ''} au total` : 'Chargement…'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={handleRefresh}
        >
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Total abonnements"
          value={totalCount}
          icon={Users}
          color="stone"
        />
        <StatCard
          label="Actifs (page)"
          value={statsOnPage.active}
          icon={Activity}
          color="green"
        />
        <StatCard
          label="Suspendus (page)"
          value={statsOnPage.suspended}
          icon={PauseCircle}
          color="amber"
        />
        <StatCard
          label="Livraisons imminentes"
          value={upcoming?.length ?? 0}
          icon={Clock}
          color="blue"
          trend="≤ 3 jours"
        />
      </div>

      {(upcoming?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-sm font-bold text-stone-800">
              Livraisons imminentes
              <span className="ml-1.5 text-xs font-normal text-stone-400">(dans les 3 prochains jours)</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {upcoming!.map(sub => (
              <UpcomingCard key={sub.id} sub={sub} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Nom, email ou abonnement…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-shadow"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider">Client</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden md:table-cell">Abonnement</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:table-cell">Montant</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden xl:table-cell">Prochaine livr.</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider">Statut</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td colSpan={7} className="px-5 py-3">
                      <div className="h-9 bg-stone-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox size={32} className="text-stone-200" />
                      <p className="text-sm font-semibold text-stone-400">Aucun abonnement trouvé</p>
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <SubscriptionRow
                    key={sub.id}
                    sub={sub}
                    selected={selectedId === sub.id}
                    onSelect={setSelectedId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-stone-50">
            <p className="text-xs text-stone-400">
              Page <span className="font-semibold text-stone-700">{currentPage}</span> sur{' '}
              <span className="font-semibold text-stone-700">{totalPages}</span>
              {totalCount > 0 && <span className="ml-1">— {totalCount} résultats</span>}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-white hover:border hover:border-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-white hover:border hover:border-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[1px]"
              onClick={() => setSelectedId(null)}
            />
            <SubscriptionDrawer id={selectedId} onClose={() => setSelectedId(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}