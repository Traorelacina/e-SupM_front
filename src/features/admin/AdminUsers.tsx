import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Users, ShieldCheck, Ban, UserCheck, RefreshCw,
  Mail, Phone, XCircle, Crown, Star, Award, ChevronLeft,
  ChevronRight, Eye, Inbox, ShieldAlert, Pencil, Check,
  CalendarDays, Globe, ArrowUpRight, Package,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { adminApi } from '@/api'
import { useToast } from '@/hooks/useToast'
import { formatDate, getInitials, LOYALTY_LEVELS } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  status: string
  loyalty_level: string
  loyalty_points: number
  total_points_earned?: number
  language?: string
  date_of_birth?: string
  gender?: string
  ban_reason?: string
  banned_at?: string
  created_at: string
  orders_count?: number
  reviews_count?: number
  badges?: { id: number; name: string; icon?: string }[]
  default_address?: { id: number; full_label?: string; address?: string; city?: string }
}

interface PaginatedUsers {
  data: User[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  admin:       { label: 'Admin',       bg: 'bg-violet-50',  text: 'text-violet-700', icon: ShieldCheck },
  client:      { label: 'Client',      bg: 'bg-sky-50',     text: 'text-sky-700',    icon: Users },
  livreur:     { label: 'Livreur',     bg: 'bg-amber-50',   text: 'text-amber-700',  icon: Package },
  preparateur: { label: 'Préparateur', bg: 'bg-teal-50',    text: 'text-teal-700',   icon: UserCheck },
  partner:     { label: 'Partenaire',  bg: 'bg-orange-50',  text: 'text-orange-700', icon: Star },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:  { label: 'Actif',    bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  banned:  { label: 'Banni',    bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  inactive:{ label: 'Inactif',  bg: 'bg-stone-50',   text: 'text-stone-500',   dot: 'bg-stone-400' },
}

const ROLES = ['admin', 'client', 'livreur', 'preparateur', 'partner']

const FILTER_TABS = [
  { key: '', label: 'Tous' },
  { key: 'client', label: 'Clients' },
  { key: 'admin', label: 'Admins' },
  { key: 'livreur', label: 'Livreurs' },
  { key: 'preparateur', label: 'Préparateurs' },
  { key: 'partner', label: 'Partenaires' },
]

const STATUS_TABS = [
  { key: '', label: 'Tous statuts' },
  { key: 'active', label: 'Actifs' },
  { key: 'banned', label: 'Bannis' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.client
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function LoyaltyBadge({ level }: { level: string }) {
  const cfg = (LOYALTY_LEVELS as any)[level] ?? (LOYALTY_LEVELS as any).bronze
  return (
    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizes[size]} rounded-2xl object-cover shrink-0`}
      />
    )
  }
  return (
    <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black shrink-0`}>
      {getInitials(user.name)}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: number | string; icon: React.ElementType
  color: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'stone'; trend?: string
}) {
  const palette = {
    green:  { accent: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
    amber:  { accent: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100'   },
    red:    { accent: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-100'     },
    blue:   { accent: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-100'     },
    violet: { accent: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-100'  },
    stone:  { accent: 'text-stone-500',   bg: 'bg-stone-50',    border: 'border-stone-100'   },
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
            <ArrowUpRight size={10} /> {trend}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── User Drawer ──────────────────────────────────────────────────────────────

function UserDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [banReason, setBanReason] = useState('')
  const [showBanInput, setShowBanInput] = useState(false)
  const [editingRole, setEditingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.users.get(id).then((r: any) => r.data ?? r) as Promise<User>,
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
  }

  const banMutation = useMutation({
    mutationFn: () => adminApi.users.ban(id, banReason),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Utilisateur banni' }); setShowBanInput(false); setBanReason('') },
    onError: (e: any) => toast({ type: 'error', message: e?.response?.data?.message ?? 'Erreur' }),
  })

  const unbanMutation = useMutation({
    mutationFn: () => adminApi.users.unban(id),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Utilisateur débanni' }) },
    onError: (e: any) => toast({ type: 'error', message: e?.response?.data?.message ?? 'Erreur' }),
  })

  const roleMutation = useMutation({
    mutationFn: (role: string) => adminApi.users.updateRole(id, role),
    onSuccess: () => { invalidate(); toast({ type: 'success', message: 'Rôle mis à jour' }); setEditingRole(false) },
    onError: (e: any) => toast({ type: 'error', message: e?.response?.data?.message ?? 'Erreur' }),
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
          <h3 className="font-black text-stone-900 text-sm">Fiche utilisateur</h3>
          {user && <p className="text-[10px] text-stone-400 mt-0.5">#{user.id} · inscrit le {formatDate(user.created_at)}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
        >
          <XCircle size={14} className="text-stone-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-14 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : user ? (
          <>
            {/* Profil */}
            <div className="px-6 py-5 border-b border-stone-100">
              <div className="flex items-start gap-4">
                <Avatar user={user} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-stone-900 text-base truncate">{user.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="space-y-1 mt-2">
                    {user.email && (
                      <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-orange-500 transition-colors">
                        <Mail size={10} /> {user.email}
                      </a>
                    )}
                    {user.phone && (
                      <a href={`tel:${user.phone}`} className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-orange-500 transition-colors">
                        <Phone size={10} /> {user.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Ban reason */}
              {user.status === 'banned' && user.ban_reason && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <ShieldAlert size={12} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Raison du ban</p>
                    <p className="text-xs text-red-700 mt-0.5">{user.ban_reason}</p>
                    {user.banned_at && <p className="text-[10px] text-red-400 mt-0.5">le {formatDate(user.banned_at)}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Fidélité */}
            <div className="px-6 py-5 border-b border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Fidélité</p>
              <div className="flex items-center gap-3 mb-3">
                <LoyaltyBadge level={user.loyalty_level} />
                <span className="text-sm font-black text-stone-900 tabular-nums">
                  {user.loyalty_points?.toLocaleString('fr-CI')} pts
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Points cumulés</p>
                  <p className="text-xs font-black text-stone-900 mt-0.5 tabular-nums">
                    {(user.total_points_earned ?? 0).toLocaleString('fr-CI')}
                  </p>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Commandes</p>
                  <p className="text-xs font-black text-stone-900 mt-0.5">{user.orders_count ?? '—'}</p>
                </div>
              </div>
              {(user.badges?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Badges</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.badges!.map(b => (
                      <span key={b.id} className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                        {b.icon ?? '🏅'} {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Infos complémentaires */}
            <div className="px-6 py-5 border-b border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Informations</p>
              <div className="space-y-2">
                {user.date_of_birth && (
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <CalendarDays size={12} className="text-stone-400" />
                    Né(e) le {formatDate(user.date_of_birth)}
                  </div>
                )}
                {user.language && (
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <Globe size={12} className="text-stone-400" />
                    Langue : <span className="font-semibold uppercase">{user.language}</span>
                  </div>
                )}
                {user.default_address && (
                  <div className="flex items-start gap-2 text-xs text-stone-600">
                    <Package size={12} className="text-stone-400 mt-0.5 shrink-0" />
                    <span>{user.default_address.full_label ?? `${user.default_address.address}, ${user.default_address.city}`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gestion du rôle */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Rôle</p>
                <button
                  onClick={() => { setEditingRole(!editingRole); setSelectedRole(user.role) }}
                  className="text-[10px] font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <Pencil size={10} /> Modifier
                </button>
              </div>
              {editingRole ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLES.map(r => {
                      const cfg = ROLE_CONFIG[r]
                      const Icon = cfg.icon
                      return (
                        <button
                          key={r}
                          onClick={() => setSelectedRole(r)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selectedRole === r
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <Icon size={12} /> {cfg.label}
                          {selectedRole === r && <Check size={10} className="ml-auto text-orange-500" />}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="orange"
                      size="sm"
                      className="flex-1"
                      loading={roleMutation.isPending}
                      onClick={() => roleMutation.mutate(selectedRole)}
                      disabled={selectedRole === user.role}
                    >
                      Confirmer
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingRole(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <RoleBadge role={user.role} />
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Actions */}
      {user && (
        <div className="px-6 py-4 border-t border-stone-100 space-y-2 bg-stone-50">
          {user.status === 'banned' ? (
            <Button
              variant="secondary"
              className="w-full"
              size="sm"
              leftIcon={<UserCheck size={14} />}
              loading={unbanMutation.isPending}
              onClick={() => unbanMutation.mutate()}
            >
              Débannir cet utilisateur
            </Button>
          ) : showBanInput ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Raison du ban…"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-red-600 hover:bg-red-50 border border-red-200"
                  leftIcon={<Ban size={14} />}
                  loading={banMutation.isPending}
                  disabled={!banReason.trim()}
                  onClick={() => banMutation.mutate()}
                >
                  Confirmer le ban
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowBanInput(false); setBanReason('') }}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-red-500 hover:bg-red-50"
              leftIcon={<Ban size={14} />}
              onClick={() => setShowBanInput(true)}
            >
              Bannir cet utilisateur
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ user, selected, onSelect }: {
  user: User; selected: boolean; onSelect: (id: number) => void
}) {
  return (
    <tr
      className={`border-b border-stone-100 cursor-pointer transition-colors group ${
        selected ? 'bg-orange-50' : 'hover:bg-stone-50'
      }`}
      onClick={() => onSelect(user.id)}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
            <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      <td className="px-3 py-3.5 hidden sm:table-cell">
        {user.phone
          ? <p className="text-xs text-stone-600">{user.phone}</p>
          : <span className="text-xs text-stone-300">—</span>
        }
      </td>

      <td className="px-3 py-3.5 hidden md:table-cell">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-3 py-3.5 hidden lg:table-cell">
        <LoyaltyBadge level={user.loyalty_level} />
      </td>

      <td className="px-3 py-3.5 hidden lg:table-cell">
        <p className="text-sm font-bold text-stone-900 tabular-nums">
          {user.loyalty_points?.toLocaleString('fr-CI')}
        </p>
      </td>

      <td className="px-3 py-3.5 hidden xl:table-cell">
        <p className="text-xs text-stone-500">{formatDate(user.created_at)}</p>
      </td>

      <td className="px-3 py-3.5">
        <StatusBadge status={user.status} />
      </td>

      <td className="px-3 py-3.5">
        <button
          className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 hover:bg-orange-100 flex items-center justify-center text-stone-500 hover:text-orange-600"
          onClick={e => { e.stopPropagation(); onSelect(user.id) }}
        >
          <Eye size={13} />
        </button>
      </td>
    </tr>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: paginated, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      adminApi.users.list({
        page,
        per_page: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }).then((r: any) => r as PaginatedUsers),
  })

  const users: User[] = paginated?.data ?? []
  const totalPages  = paginated?.last_page ?? 1
  const currentPage = paginated?.current_page ?? 1
  const totalCount  = paginated?.total ?? 0

  // Stats calculées sur les données chargées
  const stats = {
    total:    totalCount,
    active:   users.filter(u => u.status === 'active').length,
    banned:   users.filter(u => u.status === 'banned').length,
    admins:   users.filter(u => u.role === 'admin').length,
  }

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    toast({ type: 'info', message: 'Données actualisées' })
  }

  return (
    <div className="space-y-6">

      {/* Titre */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Utilisateurs</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {totalCount > 0 ? `${totalCount} utilisateur${totalCount > 1 ? 's' : ''} au total` : 'Chargement…'}
          </p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh}>
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total"        value={stats.total}  icon={Users}      color="stone"  />
        <StatCard label="Actifs (page)"  value={stats.active} icon={UserCheck}  color="green"  />
        <StatCard label="Bannis (page)"  value={stats.banned} icon={Ban}        color="red"    />
        <StatCard label="Admins (page)"  value={stats.admins} icon={ShieldCheck} color="violet" />
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3">
        {/* Rôles */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setRoleFilter(tab.key); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recherche + statut */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Nom, email ou téléphone…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-shadow"
            />
          </div>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                {['Utilisateur', 'Téléphone', 'Rôle', 'Niveau', 'Points', 'Inscrit le', 'Statut', ''].map(h => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider
                      ${h === 'Utilisateur' ? 'px-5' : ''}
                      ${h === 'Téléphone' ? 'hidden sm:table-cell' : ''}
                      ${h === 'Rôle' ? 'hidden md:table-cell' : ''}
                      ${h === 'Niveau' || h === 'Points' ? 'hidden lg:table-cell' : ''}
                      ${h === 'Inscrit le' ? 'hidden xl:table-cell' : ''}
                      ${h === '' ? 'w-10' : ''}
                    `}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td colSpan={8} className="px-5 py-3">
                      <div className="h-9 bg-stone-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox size={32} className="text-stone-200" />
                      <p className="text-sm font-semibold text-stone-400">Aucun utilisateur trouvé</p>
                      {search && (
                        <button onClick={() => setSearch('')} className="text-xs text-orange-500 hover:underline">
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    selected={selectedId === user.id}
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

      {/* Drawer */}
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
            <UserDrawer id={selectedId} onClose={() => setSelectedId(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}