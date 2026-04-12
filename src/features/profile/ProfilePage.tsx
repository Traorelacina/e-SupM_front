import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  User, Mail, Phone, Camera, Key, Star, Package, Gift,
  Gamepad2, TrendingUp, Edit, Check, X, Shield, LogOut,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { profileApi, loyaltyApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, LOYALTY_LEVELS, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ExtraComponents'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Requis'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => loyaltyApi.dashboard().then(r => r.data),
    enabled: !!user,
  })

  const { data: consumptionData } = useQuery({
    queryKey: ['my-stats', 'consumption'],
    queryFn: () => profileApi.consumptionReport().then(r => r.data),
    enabled: !!user,
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      updateUser(profileForm.getValues())
      setEditMode(false)
      toast.success('Profil mis à jour !')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => profileApi.changePassword(data),
    onSuccess: () => { setShowPasswordForm(false); passwordForm.reset(); toast.success('Mot de passe modifié !') },
    onError: () => toast.error('Mot de passe actuel incorrect'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: ({ data }) => { updateUser({ avatar: (data as { avatar?: string }).avatar }); toast.success('Photo mise à jour !') },
  })

  if (!user) return null
  const levelCfg = LOYALTY_LEVELS[user.loyalty_level]

  return (
    <div className="py-8">
      <div className="container-app max-w-4xl">
        <h1 className="section-title mb-6">Mon Compte</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-brand mx-auto overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : getInitials(user.name)}
                </div>
                <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-xl shadow-card border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                  <Camera className="h-3.5 w-3.5 text-stone-600" />
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f) }} />
                </label>
              </div>
              <h2 className="font-black text-stone-900 font-display text-lg">{user.name}</h2>
              <p className="text-stone-500 text-sm">{user.email}</p>
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-bold ${levelCfg.bg} ${levelCfg.color}`}>
                {levelCfg.icon} {levelCfg.label}
              </div>
              {loyaltyData?.progress.next_level && (
                <div className="mt-4 text-left">
                  <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                    <span>{user.loyalty_points.toLocaleString('fr-CI')} pts</span>
                    <span>vers {LOYALTY_LEVELS[loyaltyData.progress.next_level]?.icon} {LOYALTY_LEVELS[loyaltyData.progress.next_level]?.label}</span>
                  </div>
                  <ProgressBar value={loyaltyData.progress.progress} color="orange" size="sm" />
                  <p className="text-[10px] text-stone-400 mt-1">Encore {loyaltyData.progress.points_to_next.toLocaleString('fr-CI')} pts</p>
                </div>
              )}
            </div>

            <div className="card p-5 space-y-3">
              {[
                { label: 'Commandes', value: (consumptionData as { total_orders?: number })?.total_orders ?? 0, icon: Package, bg: 'bg-blue-100', color: 'text-blue-600' },
                { label: 'Total dépensé', value: formatCurrency((consumptionData as { total_spent?: number })?.total_spent ?? 0), icon: TrendingUp, bg: 'bg-green-100', color: 'text-green-600' },
                { label: 'Points fidélité', value: `${user.loyalty_points.toLocaleString('fr-CI')} pts`, icon: Star, bg: 'bg-amber-100', color: 'text-amber-600' },
              ].map(({ label, value, icon: Icon, bg, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
                  <div><p className="text-xs text-stone-500">{label}</p><p className="text-sm font-black text-stone-900">{String(value)}</p></div>
                </div>
              ))}
            </div>

            <div className="card divide-y divide-stone-50">
              {[
                { href: '/orders', icon: Package, label: 'Mes commandes' },
                { href: '/loyalty', icon: Star, label: 'Fidélité & Badges' },
                { href: '/subscriptions', icon: Gift, label: 'Abonnements' },
                { href: '/games', icon: Gamepad2, label: 'Jeux & Gains' },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} to={href} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors group">
                  <Icon className="h-4 w-4 text-stone-400 group-hover:text-brand-orange transition-colors" />
                  <span className="text-sm font-semibold text-stone-700">{label}</span>
                </Link>
              ))}
              <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-red-600">
                <LogOut className="h-4 w-4" /><span className="text-sm font-semibold">Se déconnecter</span>
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-stone-900 font-display flex items-center gap-2"><User className="h-5 w-5 text-brand-orange" /> Informations</h2>
                {!editMode && <Button variant="secondary" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />} onClick={() => setEditMode(true)}>Modifier</Button>}
              </div>
              {editMode ? (
                <form onSubmit={profileForm.handleSubmit(d => updateProfileMutation.mutate(d))} className="space-y-4">
                  <Input {...profileForm.register('name')} label="Nom complet" leftElement={<User className="h-4 w-4" />} error={profileForm.formState.errors.name?.message} />
                  <Input {...profileForm.register('phone')} label="Téléphone" leftElement={<Phone className="h-4 w-4" />} placeholder="+225 07 00 00 00 00" />
                  <div className="flex gap-3">
                    <Button variant="secondary" type="button" onClick={() => setEditMode(false)} leftIcon={<X className="h-4 w-4" />}>Annuler</Button>
                    <Button type="submit" variant="orange" loading={updateProfileMutation.isPending} leftIcon={<Check className="h-4 w-4" />}>Enregistrer</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User,  label: 'Nom',       value: user.name },
                    { icon: Mail,  label: 'Email',      value: user.email },
                    { icon: Phone, label: 'Téléphone',  value: user.phone ?? 'Non renseigné' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-4 p-3.5 bg-stone-50 rounded-xl">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"><Icon className="h-4 w-4 text-stone-500" /></div>
                      <div><p className="text-xs font-medium text-stone-400">{label}</p><p className="text-sm font-semibold text-stone-900">{value}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-stone-900 font-display flex items-center gap-2"><Shield className="h-5 w-5 text-brand-orange" /> Sécurité</h2>
                {!showPasswordForm && <Button variant="secondary" size="sm" leftIcon={<Key className="h-3.5 w-3.5" />} onClick={() => setShowPasswordForm(true)}>Changer le mot de passe</Button>}
              </div>
              {showPasswordForm ? (
                <form onSubmit={passwordForm.handleSubmit(d => changePasswordMutation.mutate(d))} className="space-y-4">
                  <Input {...passwordForm.register('current_password')} label="Mot de passe actuel" type="password" error={passwordForm.formState.errors.current_password?.message} />
                  <Input {...passwordForm.register('password')} label="Nouveau mot de passe" type="password" error={passwordForm.formState.errors.password?.message} hint="Minimum 8 caractères" />
                  <Input {...passwordForm.register('password_confirmation')} label="Confirmer" type="password" error={passwordForm.formState.errors.password_confirmation?.message} />
                  <div className="flex gap-3">
                    <Button variant="secondary" type="button" onClick={() => setShowPasswordForm(false)} leftIcon={<X className="h-4 w-4" />}>Annuler</Button>
                    <Button type="submit" variant="orange" loading={changePasswordMutation.isPending} leftIcon={<Check className="h-4 w-4" />}>Modifier</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center"><Shield className="h-4 w-4 text-green-600" /></div>
                      <div><p className="text-xs text-stone-400">Mot de passe</p><p className="text-sm font-semibold">••••••••••</p></div>
                    </div>
                    <Badge variant="green">Sécurisé</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center"><Mail className="h-4 w-4 text-blue-600" /></div>
                      <div><p className="text-xs text-stone-400">Email vérifié</p><p className="text-sm font-semibold truncate max-w-[180px]">{user.email}</p></div>
                    </div>
                    <Badge variant="green">Vérifié</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
