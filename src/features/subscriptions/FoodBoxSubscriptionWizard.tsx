/**
 * FoodBoxSubscriptionWizard.tsx
 *
 * Wizard de souscription à une box alimentaire sélectionnée par l'utilisateur.
 * Flux : [Aperçu de la box] → [Mode de livraison] → [Confirmation]
 */

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Truck,
  Store,
  Lock,
  ShoppingBag,
  Tag,
  Calendar,
  Star,
  Users,
  Percent,
  CheckCircle,
  Loader2,
  Shield,
  Clock,
  RotateCcw,
  Gift,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { subscriptionApi, storageUrl, publicFoodBoxApi } from '@/api'
import type { FoodBox, FoodBoxItem } from '@/api'

// ─── Constantes ──────────────────────────────────────────────────────────────

const DELIVERY_OPTIONS = [
  {
    value: 'home',
    label: 'Livraison à domicile',
    description: 'Vos produits livrés directement chez vous',
    icon: Truck,
    badge: 'Gratuit',
  },
  {
    value: 'click_collect',
    label: 'Click & Collect',
    description: 'Récupérez votre box en magasin',
    icon: Store,
    badge: 'Gratuit',
  },
  {
    value: 'locker',
    label: 'Casier sécurisé',
    description: 'Récupération 24h/24',
    icon: Lock,
    badge: 'Gratuit',
  },
]

const FREQ_LABELS: Record<string, { label: string; description: string }> = {
  weekly: { label: 'Hebdomadaire', description: '1 livraison / semaine' },
  biweekly: { label: 'Bi-mensuelle', description: '1 livraison / 2 semaines' },
  monthly: { label: 'Mensuelle', description: '1 livraison / mois' },
}

const DISCOUNT = 5

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['aperçu', 'livraison', 'confirmation'] as const
type Step = (typeof STEPS)[number]

function StepDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-1 rounded-full transition-all duration-300 ${
            i <= idx ? 'bg-amber-500' : 'bg-stone-200'
          } ${i === idx ? 'flex-[2]' : 'flex-1'}`}
        />
      ))}
    </div>
  )
}

// ─── Box mini-card ────────────────────────────────────────────────────────

function BoxHeader({ box }: { box: FoodBox }) {
  const imageUrl = box.image_url ?? (box.image ? storageUrl(box.image) : null)
  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={box.name}
          className="w-10 h-10 rounded-lg object-cover border border-amber-200 flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={18} className="text-amber-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-900 text-sm truncate">{box.name}</p>
        <p className="text-xs text-amber-600 font-semibold">
          {formatCurrency(box.price)}
          <span className="text-stone-400 font-normal"> / cycle</span>
        </p>
      </div>
      {box.is_featured && (
        <div className="px-2 py-0.5 bg-amber-400 rounded-full flex items-center gap-0.5">
          <Star size={9} className="text-white fill-white" />
          <span className="text-[9px] font-bold text-white">Vedette</span>
        </div>
      )}
    </div>
  )
}

// ─── Loading state ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
      <p className="text-stone-500 text-xs">Chargement...</p>
    </div>
  )
}

// ─── Benefit Card compact ────────────────────────────────────────────────────

function BenefitCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-100">
      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Icon size={11} className="text-amber-600" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-stone-800">{title}</p>
        <p className="text-[9px] text-stone-400">{description}</p>
      </div>
    </div>
  )
}

// ─── Étape 1 : Aperçu de la box ───────────────────────────────────────────────

function StepApercu({
  box,
  boxDetails,
  isLoading,
  onNext,
}: {
  box: FoodBox
  boxDetails: FoodBox | null
  isLoading: boolean
  onNext: () => void
}) {
  const imageUrl = box.image_url ?? (box.image ? storageUrl(box.image) : null)
  const freq = FREQ_LABELS[box.frequency] ?? { label: box.frequency, description: '' }
  const items = boxDetails?.items ?? box.items ?? []
  const itemCount = items.length
  const discount = box.compare_price && box.compare_price > box.price
    ? Math.round((1 - box.price / box.compare_price) * 100)
    : null
  const availableSpots = box.max_subscribers 
    ? Math.max(0, box.max_subscribers - (box.subscribers_count ?? 0))
    : null

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <motion.div
      key="apercu"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 22 }}
    >
      {/* Image */}
      {imageUrl && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-amber-100 to-orange-100">
          <img src={imageUrl} alt={box.name} className="w-full h-full object-cover" />
          {discount && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 rounded-md">
              <span className="text-[10px] font-bold text-white">-{discount}%</span>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {box.badge_label && (
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: box.badge_color || '#f59e0b' }}
          >
            {box.badge_label}
          </span>
        )}
        {availableSpots !== null && availableSpots <= 5 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
            Plus que {availableSpots}
          </span>
        )}
      </div>

      {/* Infos clés */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 bg-stone-50 rounded-lg text-center">
          <Tag size={12} className="text-amber-500 mx-auto mb-0.5" />
          <p className="text-xs font-bold text-stone-800">{formatCurrency(box.price)}</p>
          <p className="text-[9px] text-stone-400">/ cycle</p>
        </div>
        <div className="p-2 bg-stone-50 rounded-lg text-center">
          <Calendar size={12} className="text-amber-500 mx-auto mb-0.5" />
          <p className="text-xs font-bold text-stone-800">{freq.label}</p>
        </div>
        <div className="p-2 bg-stone-50 rounded-lg text-center">
          <Package size={12} className="text-amber-500 mx-auto mb-0.5" />
          <p className="text-xs font-bold text-stone-800">{itemCount}</p>
          <p className="text-[9px] text-stone-400">produits</p>
        </div>
      </div>

      {/* Produits inclus - compact */}
      {items.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase text-stone-400 mb-1.5">Contenu</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {items.slice(0, 4).map((item: FoodBoxItem) => {
              const product = item.product
              return (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 bg-stone-100 rounded flex items-center justify-center flex-shrink-0">
                    <Package size={10} className="text-stone-400" />
                  </div>
                  <span className="text-stone-600 truncate flex-1 text-[11px]">
                    {product?.name ?? `Produit #${item.product_id}`}
                  </span>
                  <span className="text-amber-600 font-medium text-[10px]">×{item.quantity}</span>
                </div>
              )
            })}
            {items.length > 4 && (
              <p className="text-[10px] text-stone-400 text-center pt-1">
                + {items.length - 4} autre{items.length - 4 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Avantages - compact */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        <BenefitCard icon={Percent} title="5% de remise" description="sur chaque livraison" />
        <BenefitCard icon={Clock} title="Flexible" description="modifiable à tout moment" />
      </div>

      <Button
        variant="orange"
        rightIcon={<ChevronRight size={14} />}
        onClick={onNext}
        className="w-full"
        size="sm"
      >
        Choisir la livraison
      </Button>
    </motion.div>
  )
}

// ─── Étape 2 : Mode de livraison ──────────────────────────────────────────────

function StepLivraison({
  deliveryType,
  onSelect,
  onNext,
  onPrev,
}: {
  deliveryType: string
  onSelect: (v: string) => void
  onNext: () => void
  onPrev: () => void
}) {
  return (
    <motion.div
      key="livraison"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 22 }}
    >
      <div className="space-y-2 mb-5">
        {DELIVERY_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = deliveryType === option.value
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
              onClick={() => onSelect(option.value)}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-amber-200' : 'bg-stone-100'
              }`}>
                <Icon size={14} className={isSelected ? 'text-amber-700' : 'text-stone-400'} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>
                  {option.label}
                </p>
                <p className="text-[10px] text-stone-400">{option.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-amber-500' : 'border-stone-300'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
            </label>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" leftIcon={<ChevronLeft size={14} />} onClick={onPrev} className="flex-1" size="sm">
          Retour
        </Button>
        <Button variant="orange" rightIcon={<ChevronRight size={14} />} onClick={onNext} disabled={!deliveryType} className="flex-1" size="sm">
          Vérifier
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Étape 3 : Confirmation ───────────────────────────────────────────────────

function StepConfirmation({
  box,
  boxDetails,
  deliveryType,
  onPrev,
  onSubmit,
  isSubmitting,
}: {
  box: FoodBox
  boxDetails: FoodBox | null
  deliveryType: string
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.value === deliveryType)
  const freq = FREQ_LABELS[box.frequency] ?? { label: box.frequency, description: '' }
  const items = boxDetails?.items ?? box.items ?? []
  const subtotal = box.price
  const discountAmount = subtotal * (DISCOUNT / 100)
  const total = subtotal - discountAmount

  return (
    <motion.div
      key="confirmation"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 22 }}
    >
      {/* Récapitulatif */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
          <span className="text-xs text-stone-500">Box</span>
          <span className="text-xs font-semibold text-stone-800">{box.name}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
          <span className="text-xs text-stone-500">Fréquence</span>
          <span className="text-xs font-semibold text-stone-800">{freq.label}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
          <span className="text-xs text-stone-500">Livraison</span>
          <span className="text-xs font-semibold text-stone-800">{deliveryOption?.label}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
          <span className="text-xs text-stone-500">Produits</span>
          <span className="text-xs font-semibold text-stone-800">{items.length} article{items.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tarif */}
      <div className="p-3 bg-amber-50 rounded-lg space-y-1.5 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-stone-600">Sous-total</span>
          <span className="font-semibold text-stone-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-600">Remise ({DISCOUNT}%)</span>
          <span className="font-semibold text-emerald-600">-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1.5 border-t border-amber-200">
          <span className="font-bold text-stone-800">Total / cycle</span>
          <span className="font-black text-amber-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Avantages */}
      <div className="space-y-1 mb-4">
        {[
          'Livraison automatique',
          'Modification sans frais',
          'Points fidélité doublés',
        ].map((text) => (
          <div key={text} className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <CheckCircle size={10} className="text-emerald-500" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" leftIcon={<ChevronLeft size={14} />} onClick={onPrev} disabled={isSubmitting} className="flex-1" size="sm">
          Retour
        </Button>
        <Button variant="orange" leftIcon={<Shield size={14} />} onClick={onSubmit} loading={isSubmitting} className="flex-1" size="sm">
          Confirmer
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface FoodBoxSubscriptionWizardProps {
  box: FoodBox
  onClose: () => void
  onSuccess: () => void
}

export default function FoodBoxSubscriptionWizard({
  box,
  onClose,
  onSuccess,
}: FoodBoxSubscriptionWizardProps) {
  const [step, setStep] = useState<Step>('aperçu')
  const [deliveryType, setDeliveryType] = useState('home')

  const {
    data: boxDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['food-box-details', box.id],
    queryFn: () => publicFoodBoxApi.get(box.id.toString()).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const details = boxDetails ?? box
      const items = details.items?.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })) ?? []

      const payload: any = {
        name: box.name,
        frequency: box.frequency,
        delivery_type: deliveryType,
        payment_method: 'auto',
      }

      if (items.length > 0) {
        payload.items = items
        payload.type = 'custom'
      } else {
        payload.type = 'standard'
      }

      return subscriptionApi.create(payload)
    },
    onSuccess: () => {
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      console.error('Erreur création abonnement:', error)
    },
  })

  const STEP_TITLES: Record<Step, string> = {
    aperçu: 'Découverte',
    livraison: 'Livraison',
    confirmation: 'Validation',
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-base mb-1">Erreur</h3>
          <p className="text-stone-500 text-xs mb-4">Impossible de charger la box.</p>
          <Button variant="orange" onClick={onClose} size="sm" className="w-full">
            Fermer
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createMutation.isPending) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md flex flex-col max-h-[90vh]">
        
        {/* Header compact */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-stone-100 flex-shrink-0">
          <div>
            <h1 className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-amber-500" />
              Souscription
            </h1>
            <p className="text-[10px] text-stone-400">
              Étape {STEPS.indexOf(step) + 1}/3 • {STEP_TITLES[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <XCircle size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Body compact */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <StepDots current={step} />

          {step !== 'aperçu' && <BoxHeader box={box} />}

          <AnimatePresence mode="wait">
            {step === 'aperçu' && (
              <StepApercu
                box={box}
                boxDetails={boxDetails ?? null}
                isLoading={isLoading}
                onNext={() => setStep('livraison')}
              />
            )}
            {step === 'livraison' && (
              <StepLivraison
                deliveryType={deliveryType}
                onSelect={setDeliveryType}
                onNext={() => setStep('confirmation')}
                onPrev={() => setStep('aperçu')}
              />
            )}
            {step === 'confirmation' && (
              <StepConfirmation
                box={box}
                boxDetails={boxDetails ?? null}
                deliveryType={deliveryType}
                onPrev={() => setStep('livraison')}
                onSubmit={() => createMutation.mutate()}
                isSubmitting={createMutation.isPending}
              />
            )}
          </AnimatePresence>

          {createMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-[10px] text-red-600 font-medium text-center">
                {createMutation.error instanceof Error ? createMutation.error.message : "Erreur lors de la création"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}