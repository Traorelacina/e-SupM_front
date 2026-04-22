import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, X, ChevronDown, ChevronRight, RefreshCw,
  Pause, Play, Zap, Package, Calendar, CreditCard, Truck,
  Users, TrendingUp, AlertTriangle, Check, Clock, Eye,
  ChevronLeft, Layers, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { adminSelectiveSubscriptionApi } from '@/api'
import { useToast, ToastContainer } from '@/hooks/useToast'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface AdminSub {
  id: number
  name: string
  status: 'active' | 'suspended' | 'cancelled' | 'pending'
  frequency: string
  delivery_type: string
  payment_method: string
  discount_percent: number
  subtotal: number
  total: number
  next_delivery_at: string | null
  suspended_until: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  notes: string | null
  items_total: number
  active_items: number
  created_at: string
  updated_at: string
  user: { id: number; name: string; email: string; phone: string | null } | null
  address: { id: number; full_label: string } | null
  items?: Array<{
    id: number
    quantity: number
    price: number
    is_active: boolean
    line_total: number
    product: {
      id: number
      name: string
      price: number
      in_stock: boolean
      primary_image_url: string | null
      category: { id: number; name: string } | null
    } | null
  }>
  recent_orders?: Array<{
    id: number
    total: number
    status: string
    created_at: string
  }>
}

interface Stats {
  total: number
  active: number
  suspended: number
  cancelled: number
  by_frequency?: Record<string, number>
  by_payment?: Record<string, number>
  revenue_monthly?: number
  upcoming_3days?: number
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Actif',      bg: '#dcfce7', fg: '#15803d', dot: '#22c55e' },
  suspended: { label: 'Suspendu',   bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  cancelled: { label: 'Annulé',     bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  pending:   { label: 'En attente', bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Hebdomadaire', biweekly: 'Bi-mensuel', monthly: 'Mensuel',
}
const DELIVERY_LABELS: Record<string, string> = {
  home: 'Domicile', click_collect: 'Click & Collect', locker: 'Casier',
}
const PAYMENT_LABELS: Record<string, string> = {
  auto: 'Auto', manual: 'Manuel',
}

const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  .adm-display { font-family: 'Syne', sans-serif; }
  .adm-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .adm-table-row { transition: background 0.15s; }
  .adm-table-row:hover { background: #fafafa; }

  .adm-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: none; font-family: 'DM Sans', system-ui;
  }

  .adm-filter-chip {
    padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
    border: 1.5px solid #e5e7eb; background: white; cursor: pointer;
    transition: all 0.15s; font-family: 'DM Sans', system-ui;
  }
  .adm-filter-chip.active { border-color: #1a1209; background: #1a1209; color: white; }
  .adm-filter-chip:hover:not(.active) { border-color: #9ca3af; }

  .adm-stat-card {
    background: white; border-radius: 14px; border: 1.5px solid #f0ede8;
    padding: 16px 20px; transition: box-shadow 0.2s;
  }
  .adm-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }

  .adm-detail-panel {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(480px, 100vw); z-index: 50;
    background: white; box-shadow: -8px 0 32px rgba(0,0,0,0.12);
    overflow-y: auto;
    display: flex; flex-direction: column;
  }

  .adm-overlay {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(26,18,9,0.4); backdrop-filter: blur(2px);
  }
`

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="adm-stat-card">
      <p className="adm-body text-[10px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: '#8b5e3c', opacity: 0.7 }}>{label}</p>
      <p className="adm-display text-2xl font-bold" style={{ color: accent ?? '#1a1209' }}>{value}</p>
      {sub && <p className="adm-body text-xs mt-0.5" style={{ color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
  return (
    <span className="adm-body inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// DETAIL PANEL
// ─────────────────────────────────────────────────────────────
function DetailPanel({
  subId, onClose, onSuspend, onResume, onProcess,
}: {
  subId: number
  onClose: () => void
  onSuspend: (id: number) => void
  onResume: (id: number) => void
  onProcess: (id: number) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-selective-sub', subId],
    queryFn: () => adminSelectiveSubscriptionApi.show(subId).then((r: any) => r.data ?? r),
    staleTime: 0,
  })

  const sub: AdminSub | undefined = data?.data ?? data

  return (
    <>
      <div className="adm-overlay" onClick={onClose} />
      <motion.div
        className="adm-detail-panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: '#f0ede8' }}>
          <div>
            <h3 className="adm-display font-bold text-sm" style={{ color: '#1a1209' }}>
              {sub?.name ?? 'Chargement...'}
            </h3>
            {sub && <StatusBadge status={sub.status} />}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#f5efe6', color: '#8b5e3c' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : sub ? (
          <div className="flex-1 p-5 space-y-5">

            {/* Utilisateur */}
            <section className="rounded-xl p-4" style={{ background: '#faf7f2', border: '1.5px solid #f0ede8' }}>
              <p className="adm-body text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8b5e3c', opacity: 0.7 }}>
                Utilisateur
              </p>
              <p className="adm-display font-bold text-sm" style={{ color: '#1a1209' }}>{sub.user?.name ?? '-'}</p>
              <p className="adm-body text-xs mt-0.5" style={{ color: '#8b5e3c' }}>{sub.user?.email ?? '-'}</p>
              {sub.user?.phone && <p className="adm-body text-xs mt-0.5" style={{ color: '#8b5e3c' }}>{sub.user.phone}</p>}
            </section>

            {/* Infos abonnement */}
            <section className="rounded-xl p-4" style={{ background: '#faf7f2', border: '1.5px solid #f0ede8' }}>
              <p className="adm-body text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#8b5e3c', opacity: 0.7 }}>
                Parametres
              </p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {[
                  ['Frequence', FREQ_LABELS[sub.frequency] ?? sub.frequency],
                  ['Livraison', DELIVERY_LABELS[sub.delivery_type] ?? sub.delivery_type],
                  ['Paiement', PAYMENT_LABELS[sub.payment_method] ?? sub.payment_method],
                  ['Remise', `${sub.discount_percent}%`],
                  ['Sous-total', formatCurrency(sub.subtotal)],
                  ['Total cycle', formatCurrency(sub.total)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>{k}</p>
                    <p className="adm-body text-xs font-semibold" style={{ color: '#1a1209' }}>{v}</p>
                  </div>
                ))}
              </div>
              {sub.next_delivery_at && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f0ede8' }}>
                  <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>Prochaine livraison</p>
                  <p className="adm-body text-xs font-bold" style={{ color: '#16a34a' }}>
                    {formatDate(sub.next_delivery_at)}
                  </p>
                </div>
              )}
            </section>

            {/* Articles */}
            <section>
              <p className="adm-body text-[10px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: '#8b5e3c', opacity: 0.7 }}>
                Articles ({sub.active_items}/{sub.items_total} actifs)
              </p>
              <div className="space-y-2">
                {(sub.items ?? []).map(item => (
                  <div key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{
                      background: item.is_active ? 'white' : '#f9f9f9',
                      border: `1.5px solid ${item.is_active ? '#f0ede8' : '#e5e7eb'}`,
                      opacity: item.is_active ? 1 : 0.55,
                    }}>
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
                      style={{ background: '#faf7f2' }}>
                      {item.product?.primary_image_url
                        ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" />
                        : <Package className="h-4 w-4 m-2.5" style={{ color: '#c49a51', opacity: 0.5 }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="adm-body text-xs font-semibold truncate" style={{ color: '#1a1209' }}>
                        {item.product?.name ?? 'Produit supprime'}
                      </p>
                      {item.product?.category && (
                        <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>{item.product.category.name}</p>
                      )}
                    </div>
                    <span className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>x{item.quantity}</span>
                    <span className="adm-display text-xs font-bold" style={{ color: item.is_active ? '#16a34a' : '#9ca3af' }}>
                      {item.is_active ? formatCurrency(item.line_total) : '—'}
                    </span>
                    <span className="adm-body text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: item.is_active ? '#dcfce7' : '#f3f4f6', color: item.is_active ? '#15803d' : '#9ca3af' }}>
                      {item.is_active ? 'ON' : 'OFF'}
                    </span>
                    {item.product && !item.product.in_stock && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Commandes recentes */}
            {sub.recent_orders && sub.recent_orders.length > 0 && (
              <section>
                <p className="adm-body text-[10px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: '#8b5e3c', opacity: 0.7 }}>
                  Commandes recentes
                </p>
                <div className="space-y-1.5">
                  {sub.recent_orders.map(order => (
                    <div key={order.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: '#faf7f2', border: '1.5px solid #f0ede8' }}>
                      <div>
                        <p className="adm-body text-xs font-semibold" style={{ color: '#1a1209' }}>
                          Commande #{order.id}
                        </p>
                        <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="adm-display text-sm font-bold" style={{ color: '#e8820c' }}>
                          {formatCurrency(order.total)}
                        </p>
                        <span className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}

        {/* Actions */}
        {sub && (
          <div className="flex flex-wrap gap-2 p-5 border-t sticky bottom-0 bg-white"
            style={{ borderColor: '#f0ede8' }}>
            {sub.status === 'active' && (
              <>
                <button className="adm-action-btn flex-1 justify-center"
                  onClick={() => onProcess(sub.id)}
                  style={{ background: '#1a1209', color: 'white' }}>
                  <Zap className="h-3 w-3" /> Traiter manuellement
                </button>
                <button className="adm-action-btn"
                  onClick={() => onSuspend(sub.id)}
                  style={{ background: '#fef3c7', color: '#92400e' }}>
                  <Pause className="h-3 w-3" /> Suspendre
                </button>
              </>
            )}
            {sub.status === 'suspended' && (
              <button className="adm-action-btn flex-1 justify-center"
                onClick={() => onResume(sub.id)}
                style={{ background: '#dcfce7', color: '#15803d' }}>
                <Play className="h-3 w-3" /> Réactiver
              </button>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminSelectiveSubscriptionsPage() {
  const [filters, setFilters] = useState({ status: '', frequency: '', payment_method: '', search: '' })
  const [page, setPage]         = useState(1)
  const [detailId, setDetailId] = useState<number | null>(null)
  const { toast, toasts, removeToast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-selective-subs', filters, page],
    queryFn: () => adminSelectiveSubscriptionApi.list({ ...filters, page, per_page: 20 }).then((r: any) => r),
    staleTime: 1000 * 60,
  })

  const { data: statsData } = useQuery({
    queryKey: ['admin-selective-subs-stats'],
    queryFn: () => adminSelectiveSubscriptionApi.stats().then((r: any) => r.data ?? r),
    staleTime: 1000 * 60 * 5,
  })

  const subs: AdminSub[]    = data?.data ?? []
  const meta                = data?.meta ?? {}
  const stats: Stats | null = statsData?.data ?? statsData ?? null

  const suspendMutation = useMutation({
    mutationFn: (id: number) => adminSelectiveSubscriptionApi.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-selective-subs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-selective-sub', detailId] })
      toast({ type: 'success', message: 'Abonnement suspendu.' })
    },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la suspension.' }),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: number) => adminSelectiveSubscriptionApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-selective-subs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-selective-sub', detailId] })
      toast({ type: 'success', message: 'Abonnement réactivé.' })
    },
    onError: () => toast({ type: 'error', message: 'Erreur lors de la réactivation.' }),
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => adminSelectiveSubscriptionApi.processManually(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-selective-subs'] })
      toast({ type: 'success', message: `Commande #${data?.order?.id ?? ''} générée.` })
    },
    onError: (err: any) => toast({ type: 'error', message: err?.message ?? 'Erreur lors du traitement.' }),
  })

  const setFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: f[key as keyof typeof f] === value ? '' : value }))
    setPage(1)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_STYLES }} />
      <div className="min-h-screen adm-body" style={{ background: '#f8f8f6' }}>

        {/* Page header */}
        <div className="px-6 py-6 border-b bg-white" style={{ borderColor: '#f0ede8' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="adm-display text-xl font-bold" style={{ color: '#1a1209' }}>
                Abonnements sélectifs
              </h1>
              <p className="adm-body text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                Gestion des paniers composés par les utilisateurs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="adm-body text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#faf7f2', color: '#8b5e3c', border: '1.5px solid #f0ede8' }}>
                {meta.total ?? 0} abonnement{(meta.total ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Actifs" value={stats.active} accent="#16a34a" />
              <StatCard label="Suspendus" value={stats.suspended} accent="#d97706" />
              <StatCard
                label="Revenu mensuel"
                value={formatCurrency(stats.revenue_monthly ?? 0)}
                sub="abonnements actifs"
                accent="#e8820c"
              />
              {stats.upcoming_3days !== undefined && stats.upcoming_3days > 0 && (
                <div className="col-span-2 sm:col-span-4 adm-stat-card flex items-center gap-3"
                  style={{ background: '#fef3c7', border: '1.5px solid #fde68a' }}>
                  <Clock className="h-5 w-5 shrink-0" style={{ color: '#d97706' }} />
                  <div>
                    <p className="adm-body text-xs font-semibold" style={{ color: '#92400e' }}>
                      {stats.upcoming_3days} livraison{stats.upcoming_3days > 1 ? 's' : ''} dans les 3 prochains jours
                    </p>
                    <p className="adm-body text-[10px]" style={{ color: '#b45309' }}>
                      Pensez à vérifier les stocks et à traiter les paiements manuels.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtres + Recherche */}
          <div className="bg-white rounded-2xl p-4 space-y-3"
            style={{ border: '1.5px solid #f0ede8' }}>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ borderColor: '#e5e7eb' }}>
              <Search className="h-4 w-4 shrink-0" style={{ color: '#9ca3af' }} />
              <input
                value={filters.search}
                onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
                placeholder="Rechercher par nom ou email..."
                className="adm-body flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#1a1209' }} />
              {filters.search && (
                <button onClick={() => setFilters(f => ({ ...f, search: '' }))}>
                  <X className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
              {/* Status */}
              {(['active', 'suspended', 'cancelled'] as const).map(s => (
                <button key={s}
                  onClick={() => setFilter('status', s)}
                  className={`adm-filter-chip ${filters.status === s ? 'active' : ''}`}
                  style={filters.status === s ? {} : { color: STATUS_CFG[s].fg }}>
                  {STATUS_CFG[s].label}
                </button>
              ))}
              <div className="w-px h-5 self-center" style={{ background: '#e5e7eb' }} />
              {/* Frequency */}
              {Object.entries(FREQ_LABELS).map(([k, v]) => (
                <button key={k}
                  onClick={() => setFilter('frequency', k)}
                  className={`adm-filter-chip ${filters.frequency === k ? 'active' : ''}`}>
                  {v}
                </button>
              ))}
              <div className="w-px h-5 self-center" style={{ background: '#e5e7eb' }} />
              {/* Payment */}
              {(['auto', 'manual'] as const).map(p => (
                <button key={p}
                  onClick={() => setFilter('payment_method', p)}
                  className={`adm-filter-chip ${filters.payment_method === p ? 'active' : ''}`}>
                  {PAYMENT_LABELS[p]}
                </button>
              ))}
              {/* Clear */}
              {(filters.status || filters.frequency || filters.payment_method || filters.search) && (
                <button
                  onClick={() => { setFilters({ status: '', frequency: '', payment_method: '', search: '' }); setPage(1) }}
                  className="adm-filter-chip"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                  <X className="inline h-3 w-3 mr-0.5" /> Effacer
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #f0ede8' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              </div>
            ) : subs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Package className="h-10 w-10" style={{ color: '#d4c9b8' }} />
                <p className="adm-body text-sm" style={{ color: '#9ca3af' }}>Aucun abonnement sélectif trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#faf7f2', borderBottom: '1px solid #f0ede8' }}>
                      {['Utilisateur', 'Abonnement', 'Articles', 'Frequence', 'Livraison', 'Total', 'Statut', 'Proch. livraison', 'Actions'].map(col => (
                        <th key={col} className="adm-body text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-3"
                          style={{ color: '#8b5e3c', opacity: 0.7 }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((sub, i) => (
                      <motion.tr key={sub.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="adm-table-row border-b"
                        style={{ borderColor: '#f9f6f0' }}>

                        {/* Utilisateur */}
                        <td className="px-4 py-3">
                          <p className="adm-body text-xs font-semibold" style={{ color: '#1a1209' }}>
                            {sub.user?.name ?? '-'}
                          </p>
                          <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>
                            {sub.user?.email ?? '-'}
                          </p>
                        </td>

                        {/* Nom abonnement */}
                        <td className="px-4 py-3">
                          <p className="adm-body text-xs font-semibold" style={{ color: '#1a1209' }}>
                            {sub.name}
                          </p>
                          <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>
                            #{sub.id}
                          </p>
                        </td>

                        {/* Articles */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="adm-body text-xs font-semibold" style={{ color: '#16a34a' }}>
                              {sub.active_items}
                            </span>
                            <span className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>
                              /{sub.items_total}
                            </span>
                          </div>
                        </td>

                        {/* Frequence */}
                        <td className="px-4 py-3">
                          <span className="adm-body text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: '#f0f9ff', color: '#0369a1' }}>
                            {FREQ_LABELS[sub.frequency] ?? sub.frequency}
                          </span>
                        </td>

                        {/* Livraison */}
                        <td className="px-4 py-3">
                          <span className="adm-body text-[10px]" style={{ color: '#6b7280' }}>
                            {DELIVERY_LABELS[sub.delivery_type] ?? sub.delivery_type}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3">
                          <p className="adm-display text-sm font-bold" style={{ color: '#e8820c' }}>
                            {formatCurrency(sub.total)}
                          </p>
                          <p className="adm-body text-[10px]" style={{ color: '#9ca3af' }}>
                            {PAYMENT_LABELS[sub.payment_method]}
                          </p>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3">
                          <StatusBadge status={sub.status} />
                        </td>

                        {/* Prochaine livraison */}
                        <td className="px-4 py-3">
                          {sub.next_delivery_at ? (
                            <p className="adm-body text-xs font-semibold" style={{ color: '#16a34a' }}>
                              {formatDate(sub.next_delivery_at)}
                            </p>
                          ) : (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button className="adm-action-btn"
                              onClick={() => setDetailId(sub.id)}
                              style={{ background: '#faf7f2', color: '#8b5e3c', border: '1px solid #f0ede8' }}>
                              <Eye className="h-3 w-3" /> Voir
                            </button>
                            {sub.status === 'active' && (
                              <button className="adm-action-btn"
                                onClick={() => processMutation.mutate(sub.id)}
                                disabled={processMutation.isPending}
                                style={{ background: '#1a1209', color: 'white' }}>
                                <Zap className="h-3 w-3" />
                              </button>
                            )}
                            {sub.status === 'active' && (
                              <button className="adm-action-btn"
                                onClick={() => suspendMutation.mutate(sub.id)}
                                style={{ background: '#fef3c7', color: '#92400e' }}>
                                <Pause className="h-3 w-3" />
                              </button>
                            )}
                            {sub.status === 'suspended' && (
                              <button className="adm-action-btn"
                                onClick={() => resumeMutation.mutate(sub.id)}
                                style={{ background: '#dcfce7', color: '#15803d' }}>
                                <Play className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: '#f0ede8' }}>
                <p className="adm-body text-xs" style={{ color: '#9ca3af' }}>
                  Page {meta.current_page} / {meta.last_page} — {meta.total} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="adm-action-btn disabled:opacity-40"
                    style={{ background: '#faf7f2', color: '#8b5e3c', border: '1px solid #f0ede8' }}>
                    <ChevronLeft className="h-3 w-3" /> Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="adm-action-btn disabled:opacity-40"
                    style={{ background: '#1a1209', color: 'white' }}>
                    Suivant <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {detailId !== null && (
          <DetailPanel
            subId={detailId}
            onClose={() => setDetailId(null)}
            onSuspend={id => { suspendMutation.mutate(id) }}
            onResume={id => { resumeMutation.mutate(id) }}
            onProcess={id => { processMutation.mutate(id) }}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}