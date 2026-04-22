import { useState, useCallback, useEffect } from 'react'
import {
  Heart, Ticket, Package, TrendingUp, Users, Gift,
  Search, RefreshCw, X, Check, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, Clock, Eye, Download,
  Star, Filter, Zap,
} from 'lucide-react'
import { adminCharityApi } from '@/api'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Donation {
  id:                    number
  user?:                 { id: number; name: string; email: string; phone?: string }
  product?:              { id: number; name: string; price: number }
  type:                  'voucher' | 'product'
  amount:                number
  quantity?:             number
  payment_method?:       string
  status:                'pending' | 'confirmed' | 'distributed' | 'cancelled'
  scratch_card_unlocked: boolean
  loyalty_points_earned: number
  admin_note?:           string
  created_at:            string
  vouchers?:             { code: string; is_used: boolean; amount: number }[]
}

interface Voucher {
  id:         number
  code:       string
  amount:     number
  is_used:    boolean
  used_at?:   string
  expires_at: string
  donation?:  { user?: { name: string; email: string } }
}

interface DashStats {
  total_donated:        number
  total_donated_fcfa:   string
  donations_count:      number
  pending_count:        number
  distributed_count:    number
  vouchers_total:       number
  vouchers_used:        number
  vouchers_pending:     number
  products_gifted:      number
  scratch_cards_unlocked: number
  donors_count:         number
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F'

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:     { label: 'En attente',  bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  confirmed:   { label: 'Confirmé',    bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  distributed: { label: 'Distribué',   bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  cancelled:   { label: 'Annulé',      bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

function StatCard({ label, value, sub, Icon, color }: {
  label: string; value: string | number; sub?: string; Icon: React.ElementType; color: string
}) {
  return (
    <div className={`rounded-2xl p-4 border`}
      style={{ background: `${color}10`, borderColor: `${color}30` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: '#1a1209' }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: '#8b5e3c', opacity: 0.65 }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANT — DÉTAIL DON (modal)
// ─────────────────────────────────────────────────────────────
function DonationDetailModal({ donation, onClose, onStatusChange, onToast }: {
  donation: Donation
  onClose: () => void
  onStatusChange: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [newStatus, setNewStatus] = useState(donation.status)
  const [note,      setNote]      = useState(donation.admin_note ?? '')
  const [saving,    setSaving]    = useState(false)
  const [triggering, setTriggering] = useState(false)

  const handleSave = async () => {
    if (newStatus === donation.status && note === donation.admin_note) return
    setSaving(true)
    try {
      await adminCharityApi.updateStatus(donation.id, { status: newStatus, note })
      onToast('Statut mis à jour')
      onStatusChange()
      onClose()
    } catch (e: any) {
      onToast(e.message || 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTriggerScratch = async () => {
    setTriggering(true)
    try {
      await adminCharityApi.triggerScratchCard(donation.id)
      onToast('Carte à gratter débloquée')
      onStatusChange()
    } catch (e: any) {
      onToast(e.message || 'Erreur', 'error')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Heart size={16} className="text-rose-500" />
            Don #{donation.id}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">
            <X size={18} className="text-stone-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Donateur */}
          <div className="rounded-xl p-3 space-y-1" style={{ background: '#faf7f2' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Donateur</p>
            <p className="text-sm font-semibold text-stone-900">{donation.user?.name ?? '—'}</p>
            <p className="text-xs text-stone-500">{donation.user?.email}</p>
            {donation.user?.phone && <p className="text-xs text-stone-500">{donation.user.phone}</p>}
          </div>

          {/* Détails du don */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: '#f0fdf4' }}>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Montant</p>
              <p className="text-lg font-black text-stone-900">{fmt(donation.amount)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#faf7f2' }}>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Type</p>
              <p className="text-sm font-bold text-stone-900">
                {donation.type === 'voucher' ? 'Bon alimentaire' : 'Produit'}
              </p>
              {donation.product && <p className="text-xs text-stone-500">{donation.product.name}</p>}
              {donation.quantity && <p className="text-xs text-stone-500">Qté : {donation.quantity}</p>}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {donation.loyalty_points_earned > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                <Star size={10} /> {donation.loyalty_points_earned} pts fidélité
              </span>
            )}
            {donation.scratch_card_unlocked && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                <Gift size={10} /> Carte à gratter
              </span>
            )}
          </div>

          {/* Bons associés */}
          {donation.vouchers && donation.vouchers.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Bons générés</p>
              <div className="space-y-1.5">
                {donation.vouchers.map(v => (
                  <div key={v.code} className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: '#faf7f2', border: '1px solid rgba(139,94,60,0.1)' }}>
                    <span className="text-sm font-mono font-bold text-stone-700">{v.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500">{fmt(v.amount)}</span>
                      {v.is_used
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Utilisé</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Disponible</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changement de statut */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Changer le statut</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => setNewStatus(key as any)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all text-left"
                  style={newStatus === key
                    ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border }
                    : { background: 'white', color: '#8b5e3c', borderColor: 'rgba(139,94,60,0.15)' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note admin */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Note interne</p>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note visible uniquement par l'équipe admin…"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
          </div>

          {/* Déclencher carte à gratter manuellement */}
          {!donation.scratch_card_unlocked && (
            <button onClick={handleTriggerScratch} disabled={triggering}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
              style={{ background: '#faf5ff', color: '#7e22ce', borderColor: '#e9d5ff' }}>
              {triggering ? <RefreshCw size={13} className="animate-spin" /> : <Gift size={13} />}
              Déclencher la carte à gratter manuellement
            </button>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-stone-100">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminCharityManager({ onToast }: {
  onToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [subTab,    setSubTab]    = useState<'dashboard' | 'donations' | 'vouchers'>('dashboard')
  const [stats,     setStats]     = useState<DashStats | null>(null)
  const [donations, setDonations] = useState<{ data: Donation[]; total: number; last_page: number; current_page: number } | null>(null)
  const [vouchers,  setVouchers]  = useState<{ data: Voucher[]; total: number; last_page: number; current_page: number } | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [detailDon, setDetailDon] = useState<Donation | null>(null)

  // Filters — donations
  const [dSearch,   setDSearch]   = useState('')
  const [dStatus,   setDStatus]   = useState('')
  const [dType,     setDType]     = useState('')
  const [dPage,     setDPage]     = useState(1)

  // Filters — vouchers
  const [vSearch,   setVSearch]   = useState('')
  const [vUsed,     setVUsed]     = useState('')
  const [vPage,     setVPage]     = useState(1)

  // ── Fetch ─────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminCharityApi.dashboard()
      if (res.success) {
        setStats(res.stats)
      } else {
        onToast('Erreur lors du chargement des statistiques', 'error')
      }
    } catch (e: any) {
      onToast(e.message || 'Erreur', 'error')
    } finally {
      setLoading(false)
    }
  }, [onToast])

  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page: dPage }
      if (dSearch) params.q = dSearch
      if (dStatus) params.status = dStatus
      if (dType) params.type = dType
      
      const res = await adminCharityApi.donations(params)
      // La réponse peut être dans res.data ou directement res
      const donationsData = res.data ?? res
      setDonations(donationsData)
    } catch (e: any) {
      onToast(e.message || 'Erreur lors du chargement des dons', 'error')
    } finally {
      setLoading(false)
    }
  }, [dPage, dSearch, dStatus, dType, onToast])

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page: vPage }
      if (vSearch) params.q = vSearch
      if (vUsed) params.is_used = vUsed
      
      const res = await adminCharityApi.vouchers(params)
      const vouchersData = res.data ?? res
      setVouchers(vouchersData)
    } catch (e: any) {
      onToast(e.message || 'Erreur lors du chargement des bons', 'error')
    } finally {
      setLoading(false)
    }
  }, [vPage, vSearch, vUsed, onToast])

  // Chargement initial et rechargement quand les filtres changent
  useEffect(() => {
    if (subTab === 'dashboard') {
      fetchDashboard()
    } else if (subTab === 'donations') {
      fetchDonations()
    } else if (subTab === 'vouchers') {
      fetchVouchers()
    }
  }, [subTab, fetchDashboard, fetchDonations, fetchVouchers])

  const handleExport = async () => {
    try {
      await adminCharityApi.exportDonations({ status: dStatus, type: dType })
      onToast('Export téléchargé')
    } catch (e: any) {
      onToast(e.message || 'Erreur export', 'error')
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Charity Panier</h2>
            <p className="text-stone-500 text-sm">Gestion des dons alimentaires</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={subTab === 'dashboard' ? fetchDashboard : subTab === 'donations' ? fetchDonations : fetchVouchers}
            disabled={loading}
            className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {subTab === 'donations' && (
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50">
              <Download size={14} /> Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#f5efe6' }}>
        {[
          { key: 'dashboard', label: 'Tableau de bord', Icon: TrendingUp },
          { key: 'donations',  label: 'Dons',           Icon: Heart      },
          { key: 'vouchers',   label: 'Bons',            Icon: Ticket     },
        ].map(({ key, label, Icon }) => (
          <button key={key}
            onClick={() => setSubTab(key as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
            style={subTab === key
              ? { background: 'white', color: '#1a1209', boxShadow: '0 2px 8px rgba(139,94,60,0.12)' }
              : { color: 'rgba(139,94,60,0.6)' }}>
            <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {subTab === 'dashboard' && (
        <div className="space-y-5">
          {loading && !stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl h-24 bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Montant total"      value={stats.total_donated_fcfa || fmt(stats.total_donated)} Icon={TrendingUp} color="#059669" sub="dons confirmés" />
                <StatCard label="Donateurs"           value={stats.donors_count}            Icon={Users}      color="#2563eb" />
                <StatCard label="Dons confirmés"      value={stats.donations_count}         Icon={CheckCircle}color="#16a34a" />
                <StatCard label="En attente"          value={stats.pending_count}           Icon={Clock}      color="#d97706" />
                <StatCard label="Bons utilisés"       value={`${stats.vouchers_used}/${stats.vouchers_total}`} Icon={Ticket} color="#7c3aed" />
                <StatCard label="Cartes à gratter"    value={stats.scratch_cards_unlocked} Icon={Gift}       color="#db2777" sub="débloquées" />
              </div>

              {/* Bouton accès rapide */}
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setSubTab('donations')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:shadow-sm"
                  style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}>
                  <Clock size={14} /> {stats.pending_count} don(s) en attente
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => setSubTab('vouchers')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:shadow-sm"
                  style={{ background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
                  <Ticket size={14} /> {stats.vouchers_pending} bon(s) disponible(s)
                  <ChevronRight size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-stone-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      )}

      {/* ── DONS ── */}
      {subTab === 'donations' && (
        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input className="w-48 border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Nom ou email…"
                value={dSearch}
                onChange={e => setDSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDonations()} />
            </div>

            <select value={dStatus} onChange={e => { setDStatus(e.target.value); setDPage(1); }}
              className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-amber-300">
              <option value="">Tous statuts</option>
              {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                <option key={k} value={k}>{cfg.label}</option>
              ))}
            </select>

            <select value={dType} onChange={e => { setDType(e.target.value); setDPage(1); }}
              className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-amber-300">
              <option value="">Tous types</option>
              <option value="voucher">Bon alimentaire</option>
              <option value="product">Don de produit</option>
            </select>

            {(dSearch || dStatus || dType) && (
              <button onClick={() => { setDSearch(''); setDStatus(''); setDType(''); setDPage(1); fetchDonations(); }}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 px-2 py-2 rounded-lg hover:bg-red-50">
                <X size={12} /> Réinitialiser
              </button>
            )}

            <button onClick={fetchDonations} disabled={loading} className="ml-auto p-2.5 rounded-xl hover:bg-stone-100 text-stone-500">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[760px]">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['Donateur', 'Type', 'Montant', 'Points', 'Scratch', 'Statut', 'Date', ''].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>{Array(8).fill(0).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-8 bg-stone-100 rounded-xl animate-pulse" />
                        </td>
                      ))}</tr>
                    ))
                  ) : !donations?.data?.length ? (
                    <tr><td colSpan={8} className="py-16 text-center text-stone-400 text-sm">
                      Aucun don trouvé
                    </td></tr>
                  ) : (
                    donations.data.map(don => (
                      <tr key={don.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-sm font-semibold text-stone-900">{don.user?.name ?? '—'}</p>
                          <p className="text-xs text-stone-400">{don.user?.email}</p>
                         </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            {don.type === 'voucher'
                              ? <><Ticket size={11} className="text-purple-500" /> Bon</>
                              : <><Package size={11} className="text-teal-500" /> Produit</>
                            }
                          </span>
                          {don.product && <p className="text-[10px] text-stone-400 truncate max-w-[100px]">{don.product.name}</p>}
                         </td>
                        <td className="py-3 px-4 font-bold text-sm text-stone-900 whitespace-nowrap">
                          {fmt(don.amount)}
                          {don.quantity && <span className="text-xs text-stone-400 ml-1">×{don.quantity}</span>}
                         </td>
                        <td className="py-3 px-4">
                          {don.loyalty_points_earned > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#92400e' }}>
                              <Star size={10} /> {don.loyalty_points_earned}
                            </span>
                          )}
                         </td>
                        <td className="py-3 px-4">
                          {don.scratch_card_unlocked
                            ? <span className="text-xs font-bold" style={{ color: '#7e22ce' }}><Gift size={11} className="inline mr-0.5" />Oui</span>
                            : <span className="text-xs text-stone-300">—</span>
                          }
                         </td>
                        <td className="py-3 px-4"><StatusBadge status={don.status} /></td>
                        <td className="py-3 px-4 text-xs text-stone-400 whitespace-nowrap">
                          {new Date(don.created_at).toLocaleDateString('fr-FR')}
                         </td>
                        <td className="py-3 px-4">
                          <button onClick={() => setDetailDon(don)}
                            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
                            <Eye size={14} />
                          </button>
                         </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {donations && donations.last_page > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={donations.current_page === 1} onClick={() => setDPage(p => p - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40">
                <ChevronLeft size={14} /> Précédent
              </button>
              <span className="text-sm font-medium text-stone-600">
                Page {donations.current_page} / {donations.last_page}
              </span>
              <button disabled={donations.current_page === donations.last_page} onClick={() => setDPage(p => p + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40">
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── BONS ── */}
      {subTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input className="w-48 border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Code du bon…"
                value={vSearch}
                onChange={e => setVSearch(e.target.value)} />
            </div>

            <select value={vUsed} onChange={e => { setVUsed(e.target.value); setVPage(1); }}
              className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-amber-300">
              <option value="">Tous</option>
              <option value="false">Disponibles</option>
              <option value="true">Utilisés</option>
            </select>

            <button onClick={fetchVouchers} disabled={loading} className="ml-auto p-2.5 rounded-xl hover:bg-stone-100 text-stone-500">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['Code', 'Montant', 'Donateur', 'Statut', 'Expiration', 'Utilisé le'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>{Array(6).fill(0).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-8 bg-stone-100 rounded-xl animate-pulse" />
                         </td>
                      ))}</tr>
                    ))
                  ) : !vouchers?.data?.length ? (
                    <tr><td colSpan={6} className="py-16 text-center text-stone-400 text-sm">
                      Aucun bon trouvé
                     </td></tr>
                  ) : (
                    vouchers.data.map(v => (
                      <tr key={v.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono font-bold text-stone-800">{v.code}</span>
                         </td>
                        <td className="py-3 px-4 text-sm font-bold text-stone-900">{fmt(v.amount)}</td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-stone-700">{v.donation?.user?.name ?? '—'}</p>
                          <p className="text-xs text-stone-400">{v.donation?.user?.email}</p>
                         </td>
                        <td className="py-3 px-4">
                          {v.is_used
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <Check size={9} /> Utilisé
                              </span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <Clock size={9} /> Disponible
                              </span>
                          }
                         </td>
                        <td className="py-3 px-4 text-xs text-stone-500">
                          {v.expires_at ? new Date(v.expires_at).toLocaleDateString('fr-FR') : '—'}
                         </td>
                        <td className="py-3 px-4 text-xs text-stone-400">
                          {v.used_at ? new Date(v.used_at).toLocaleDateString('fr-FR') : '—'}
                         </td>
                       </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {vouchers && vouchers.last_page > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={vouchers.current_page === 1} onClick={() => setVPage(p => p - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40">
                <ChevronLeft size={14} /> Précédent
              </button>
              <span className="text-sm font-medium text-stone-600">
                Page {vouchers.current_page} / {vouchers.last_page}
              </span>
              <button disabled={vouchers.current_page === vouchers.last_page} onClick={() => setVPage(p => p + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40">
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal détail don */}
      {detailDon && (
        <DonationDetailModal
          donation={detailDon}
          onClose={() => setDetailDon(null)}
          onStatusChange={fetchDonations}
          onToast={onToast}
        />
      )}
    </div>
  )
}