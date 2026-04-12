import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { LoginCredentials } from '@/types'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 shadow-card-hover"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center mb-4 shadow-brand">
              <span className="text-2xl">🛒</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 font-display">Bon retour !</h1>
            <p className="mt-1 text-stone-500 text-sm">Connectez-vous à votre compte e-Sup'M</p>
          </div>

          <form onSubmit={handleSubmit(login)} className="space-y-4">
            <Input
              {...register('email')}
              label="Email"
              type="email"
              placeholder="vous@exemple.ci"
              error={errors.email?.message}
              leftElement={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password?.message}
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-stone-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-orange hover:underline font-semibold">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              variant="orange"
              fullWidth
              size="lg"
              loading={isLoggingIn}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Se connecter
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs text-stone-400 bg-white px-3">
              ou continuer avec
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Google', emoji: '🇬', color: 'hover:bg-red-50 hover:border-red-200' },
              { name: 'Facebook', emoji: '📘', color: 'hover:bg-blue-50 hover:border-blue-200' },
            ].map(({ name, emoji, color }) => (
              <button
                key={name}
                className={`flex items-center justify-center gap-2 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 transition-all ${color}`}
              >
                <span>{emoji}</span>
                {name}
              </button>
            ))}
          </div>

          {/* Sign up link */}
          <p className="text-center mt-6 text-sm text-stone-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brand-orange font-bold hover:underline">
              Créer un compte
            </Link>
          </p>
        </motion.div>

        {/* Welcome bonus */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500"
        >
          <Sparkles className="h-4 w-4 text-brand-orange" />
          100 points fidélité offerts à l'inscription !
        </motion.div>
      </div>
    </div>
  )
}
