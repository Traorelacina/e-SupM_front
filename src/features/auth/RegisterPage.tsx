import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Gift } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { RegisterData } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères').regex(/[A-Z]/, 'Une majuscule requise').regex(/[0-9]/, 'Un chiffre requis'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

export default function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterData>({
    resolver: zodResolver(schema),
  })

  const pwd = watch('password', '')
  const strength = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 shadow-card-hover">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center mb-4 shadow-brand">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-stone-900 font-display">Créer mon compte</h1>
            <p className="mt-1 text-stone-500 text-sm">Rejoignez e-Sup'M et gagnez 100 points offerts 🎁</p>
          </div>

          <form onSubmit={handleSubmit(registerUser)} className="space-y-4">
            <Input {...register('name')} label="Nom complet" placeholder="Jean Kouassi" error={errors.name?.message} leftElement={<User className="h-4 w-4" />} />
            <Input {...register('email')} label="Email" type="email" placeholder="vous@exemple.ci" error={errors.email?.message} leftElement={<Mail className="h-4 w-4" />} />
            <Input {...register('phone')} label="Téléphone" type="tel" placeholder="+225 07 00 00 00 00" error={errors.phone?.message} leftElement={<Phone className="h-4 w-4" />} />

            <div>
              <Input
                {...register('password')}
                label="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 8 caractères"
                error={errors.password?.message}
                leftElement={<Lock className="h-4 w-4" />}
                rightElement={
                  <button type="button" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              {pwd.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength - 1] : 'bg-stone-200'}`} />
                  ))}
                </div>
              )}
            </div>

            <Input {...register('password_confirmation')} label="Confirmer le mot de passe" type="password" placeholder="Répétez votre mot de passe" error={errors.password_confirmation?.message} leftElement={<Lock className="h-4 w-4" />} />

            <Button type="submit" variant="orange" fullWidth size="lg" loading={isRegistering} rightIcon={<ArrowRight className="h-5 w-5" />}>
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-4">
            En créant un compte, vous acceptez nos{' '}
            <Link to="/cgv" className="text-brand-orange hover:underline">CGV</Link> et notre{' '}
            <Link to="/confidentialite" className="text-brand-orange hover:underline">politique de confidentialité</Link>.
          </p>

          <p className="text-center mt-5 text-sm text-stone-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-brand-orange font-bold hover:underline">Se connecter</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
