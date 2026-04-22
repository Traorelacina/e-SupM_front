import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CreditCard, Package, CheckCircle, ArrowRight, ArrowLeft,
  Home, Store, Truck, Shield, Tag, Star, ChevronRight, Plus,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addressApi, orderApi } from '@/api'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

// ============================================================
// STYLES
// ============================================================
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  .ck-font-display { font-family: 'Playfair Display', Georgia, serif; }
  .ck-font-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .ck-card {
    background: white;
    border: 1px solid rgba(139,94,60,0.12);
    border-radius: 20px;
    padding: 24px;
  }

  .ck-option {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 2px solid rgba(139,94,60,0.15);
    cursor: pointer;
    transition: all 0.18s;
  }
  .ck-option:hover { border-color: rgba(232,130,12,0.4); background: #fffbf5; }
  .ck-option.selected { border-color: #e8820c; background: #fffbf5; }

  .ck-radio {
    width: 18px; height: 18px;
    accent-color: #e8820c;
    margin-top: 1px; cursor: pointer; shrink-0: 0;
  }

  .ck-textarea {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px; color: #1a1209;
    background: #faf7f2;
    border: 1.5px solid rgba(139,94,60,0.18);
    border-radius: 12px;
    padding: 12px 14px;
    width: 100%; outline: none; resize: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .ck-textarea:focus { border-color: #e8820c; background: white; }
  .ck-textarea::placeholder { color: rgba(139,94,60,0.4); }

  .ck-section-line { display:inline-block; position:relative; }
  .ck-section-line::after {
    content:''; position:absolute; bottom:-3px; left:0;
    width:30%; height:2.5px; background:#e8820c; border-radius:2px;
  }

  .ck-summary-row {
    display: flex; justify-content: space-between; align-items: center;
  }

  .ck-step-connector {
    height: 2px; flex: 1;
    margin: 0 8px;
    border-radius: 2px;
    transition: background 0.3s;
  }

  .ck-scrollbar::-webkit-scrollbar { width: 3px; }
  .ck-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,94,60,0.2); border-radius: 2px; }
`

// ============================================================
// STEP INDICATOR
// ============================================================
const STEPS = [
  { id: 'delivery', label: 'Livraison',     Icon: Truck },
  { id: 'payment',  label: 'Paiement',      Icon: CreditCard },
  { id: 'confirm',  label: 'Confirmation',  Icon: CheckCircle },
]
type Step = 'delivery' | 'payment' | 'confirm'

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current)
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((s, i) => {
        const done   = i < idx
        const active = i === idx
        const Icon   = s.Icon
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={active ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={done
                  ? { background: '#16a34a', color: 'white' }
                  : active
                  ? { background: '#e8820c', color: 'white', boxShadow: '0 0 0 4px rgba(232,130,12,0.18)' }
                  : { background: '#f5efe6', color: '#8b5e3c' }
                }
              >
                {done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </motion.div>
              <span className="ck-font-body text-[10px] font-bold hidden sm:block"
                style={{ color: active ? '#1a1209' : '#8b5e3c', opacity: active ? 1 : 0.55 }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="ck-step-connector"
                style={{ background: i < idx ? '#16a34a' : 'rgba(139,94,60,0.18)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// CART SIDEBAR
// ============================================================
function CartSidebar({ cart, summary, loyaltyDiscount, finalTotal }: {
  cart: any; summary: any; loyaltyDiscount: number; finalTotal: number
}) {
  return (
    <div className="ck-card">
      <h3 className="ck-font-display font-black text-base mb-4" style={{ color: '#1a1209' }}>
        Votre commande
      </h3>

      {/* Items */}
      <div className="space-y-2 max-h-52 overflow-y-auto ck-scrollbar mb-4">
        {cart?.items?.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 py-2"
            style={{ borderBottom: '1px solid rgba(139,94,60,0.07)' }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              style={{ background: '#f5efe6', border: '1px solid rgba(139,94,60,0.1)' }}>
              {item.product?.primary_image_url
                ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" />
                : <div className="h-full flex items-center justify-center">
                    <Package className="h-4 w-4" style={{ color: '#8b5e3c', opacity: 0.3 }} />
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="ck-font-body text-xs font-semibold truncate" style={{ color: '#1a1209' }}>
                {item.product?.name}
              </p>
              <p className="ck-font-body text-[10px]" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                ×{item.quantity} · {formatCurrency(item.price)}/u
              </p>
            </div>
            <p className="ck-font-body text-xs font-bold shrink-0" style={{ color: '#1a1209' }}>
              {formatCurrency(item.line_total)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-3" style={{ borderTop: '1px solid rgba(139,94,60,0.1)' }}>
        <div className="ck-summary-row">
          <span className="ck-font-body text-sm" style={{ color: '#8b5e3c' }}>Sous-total</span>
          <span className="ck-font-body text-sm font-semibold" style={{ color: '#1a1209' }}>
            {formatCurrency(summary?.subtotal ?? 0)}
          </span>
        </div>
        <div className="ck-summary-row">
          <span className="ck-font-body text-sm" style={{ color: '#8b5e3c' }}>Livraison</span>
          <span className="ck-font-body text-sm font-semibold"
            style={{ color: (summary?.delivery_fee ?? 0) === 0 ? '#16a34a' : '#1a1209' }}>
            {(summary?.delivery_fee ?? 0) === 0 ? 'Gratuite' : formatCurrency(summary!.delivery_fee)}
          </span>
        </div>
        {loyaltyDiscount > 0 && (
          <div className="ck-summary-row">
            <span className="ck-font-body text-sm" style={{ color: '#16a34a' }}>Points fidélité</span>
            <span className="ck-font-body text-sm font-bold" style={{ color: '#16a34a' }}>
              -{formatCurrency(loyaltyDiscount)}
            </span>
          </div>
        )}
        <div className="ck-summary-row pt-2" style={{ borderTop: '1px solid rgba(139,94,60,0.1)' }}>
          <span className="ck-font-display font-black text-base" style={{ color: '#1a1209' }}>Total</span>
          <span className="ck-font-display font-black text-xl" style={{ color: '#dc2626' }}>
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <Shield className="h-3 w-3" style={{ color: '#16a34a' }} />
        <span className="ck-font-body text-[10px] font-semibold" style={{ color: '#8b5e3c', opacity: 0.6 }}>
          Paiement 100% sécurisé
        </span>
      </div>
    </div>
  )
}

// ============================================================
// FORM SCHEMAS
// ============================================================
const newAddressSchema = z.object({
  recipient_name: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().min(8, 'Numéro invalide'),
  address_line1: z.string().min(5, 'Adresse trop courte'),
  city: z.string().min(2, 'Ville requise'),
  district: z.string().optional(),
})
type NewAddressForm = z.infer<typeof newAddressSchema>

// ============================================================
// MAIN PAGE
// ============================================================
export default function CheckoutPage() {
  const { cart, summary } = useCart()
  const { user }          = useAuthStore()
  const navigate          = useNavigate()
  const queryClient       = useQueryClient()

  const [step, setStep]                       = useState<Step>('delivery')
  const [deliveryType, setDeliveryType]       = useState('home')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showNewAddress, setShowNewAddress]   = useState(false)
  const [paymentMethod, setPaymentMethod]     = useState('cinetpay')
  const [useLoyalty, setUseLoyalty]           = useState(false)
  const [loyaltyPoints, setLoyaltyPoints]     = useState(0)
  const [notes, setNotes]                     = useState('')
  const [createdOrderId, setCreatedOrderId]   = useState<number | null>(null)

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.list().then(r => r.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewAddressForm>({
    resolver: zodResolver(newAddressSchema),
  })

  const createAddressMutation = useMutation({
    mutationFn: (data: NewAddressForm) => addressApi.create(data),
    onSuccess: ({ data: newAddr }: any) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setSelectedAddressId(newAddr.id)
      setShowNewAddress(false)
      reset()
      toast.success('Adresse enregistrée')
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: () => orderApi.create({
      address_id: selectedAddressId ?? undefined,
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      use_loyalty_points: useLoyalty ? loyaltyPoints : undefined,
      notes: notes || undefined,
    }),
    onSuccess: ({ data }: any) => {
      setCreatedOrderId(data.order.id)
      setStep('confirm')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la commande')
    },
  })

  const initPaymentMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.initPayment(orderId, paymentMethod, user?.phone),
    onSuccess: ({ data }: any) => {
      if (data.payment_url) window.location.href = data.payment_url
    },
  })

  const loyaltyDiscount = useLoyalty ? loyaltyPoints / 100 : 0
  const finalTotal = Math.max(0, (summary?.total ?? 0) - loyaltyDiscount)

  if (!cart?.items?.length && step !== 'confirm') {
    return (
      <div className="ck-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
        <div className="container-app py-20 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: '#f5efe6' }}>
            <Package className="h-9 w-9" style={{ color: '#8b5e3c', opacity: 0.35 }} />
          </div>
          <p className="ck-font-body text-sm mb-6" style={{ color: '#8b5e3c', opacity: 0.7 }}>
            Votre panier est vide.
          </p>
          <button onClick={() => navigate('/catalogue')}
            className="ck-font-body font-bold text-sm px-6 py-3 rounded-xl"
            style={{ background: '#e8820c', color: 'white' }}>
            Voir le catalogue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ck-font-body" style={{ background: '#faf7f2', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="container-app py-6 sm:py-10 max-w-5xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6"
          style={{ color: '#8b5e3c', opacity: 0.7 }}>
          <Home className="h-3 w-3" />
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-semibold" style={{ color: '#1a1209', opacity: 1 }}>Commande</span>
        </div>

        {/* Title */}
        <h1 className="ck-font-display ck-section-line font-black mb-8"
          style={{ fontSize: 'clamp(22px, 4vw, 30px)', color: '#1a1209' }}>
          Finaliser ma commande
        </h1>

        {/* Step indicator */}
        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* ─────────────────────────────── DELIVERY ─── */}
              {step === 'delivery' && (
                <motion.div key="delivery"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-5">

                  {/* Delivery mode */}
                  <div className="ck-card">
                    <h2 className="ck-font-display font-black text-lg mb-5 flex items-center gap-2"
                      style={{ color: '#1a1209' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(232,130,12,0.1)' }}>
                        <Truck className="h-4 w-4" style={{ color: '#e8820c' }} />
                      </div>
                      Mode de livraison
                    </h2>
                    <div className="space-y-3">
                      {[
                        { v: 'home',          Icon: Home,  label: 'Livraison à domicile', desc: '24–48h · 2 000 FCFA (gratuit dès 50 000 FCFA)' },
                        { v: 'click_collect', Icon: Store, label: 'Click & Collect',       desc: 'Retrait gratuit — Magasin Koumassi' },
                      ].map(({ v, Icon, label, desc }) => (
                        <label key={v}
                          className={`ck-option ${deliveryType === v ? 'selected' : ''}`}
                          onClick={() => setDeliveryType(v)}>
                          <input type="radio" className="ck-radio" checked={deliveryType === v} onChange={() => setDeliveryType(v)} />
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: deliveryType === v ? 'rgba(232,130,12,0.15)' : '#faf7f2' }}>
                            <Icon className="h-4 w-4" style={{ color: deliveryType === v ? '#e8820c' : '#8b5e3c' }} />
                          </div>
                          <div>
                            <p className="ck-font-body text-sm font-bold" style={{ color: '#1a1209' }}>{label}</p>
                            <p className="ck-font-body text-xs mt-0.5" style={{ color: '#8b5e3c', opacity: 0.65 }}>{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  {deliveryType === 'home' && (
                    <div className="ck-card">
                      <h2 className="ck-font-display font-black text-lg mb-5 flex items-center gap-2"
                        style={{ color: '#1a1209' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(232,130,12,0.1)' }}>
                          <MapPin className="h-4 w-4" style={{ color: '#e8820c' }} />
                        </div>
                        Adresse de livraison
                      </h2>
                      <div className="space-y-3">
                        {addresses?.map((addr: any) => (
                          <label key={addr.id}
                            className={`ck-option ${selectedAddressId === addr.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAddressId(addr.id)}>
                            <input type="radio" name="address" className="ck-radio"
                              checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                            <div className="min-w-0">
                              <p className="ck-font-body font-bold text-sm" style={{ color: '#1a1209' }}>{addr.recipient_name}</p>
                              <p className="ck-font-body text-xs mt-0.5" style={{ color: '#8b5e3c', opacity: 0.75 }}>{addr.address_line1}</p>
                              <p className="ck-font-body text-xs" style={{ color: '#8b5e3c', opacity: 0.75 }}>
                                {addr.district && `${addr.district}, `}{addr.city}
                              </p>
                              <p className="ck-font-body text-xs" style={{ color: '#8b5e3c', opacity: 0.55 }}>{addr.phone}</p>
                              {addr.is_default && (
                                <span className="ck-font-body inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(232,130,12,0.12)', color: '#c2410c' }}>
                                  Par défaut
                                </span>
                              )}
                            </div>
                          </label>
                        ))}

                        <button
                          onClick={() => setShowNewAddress(!showNewAddress)}
                          className="ck-font-body w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-2xl border-2 border-dashed transition-all hover:border-opacity-60"
                          style={{ borderColor: 'rgba(139,94,60,0.25)', color: '#8b5e3c' }}>
                          <Plus className="h-4 w-4" />
                          {showNewAddress ? 'Annuler' : 'Nouvelle adresse'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showNewAddress && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit(d => createAddressMutation.mutate(d))}
                            className="mt-4 space-y-3 overflow-hidden"
                            style={{ borderTop: '1px solid rgba(139,94,60,0.1)', paddingTop: 16 }}>
                            <div className="grid grid-cols-2 gap-3">
                              <Input {...register('recipient_name')} label="Nom complet" placeholder="Jean Kouassi" error={errors.recipient_name?.message} />
                              <Input {...register('phone')} label="Téléphone" placeholder="+225 07 00 00 00" error={errors.phone?.message} />
                            </div>
                            <Input {...register('address_line1')} label="Adresse" placeholder="Rue des Combattants" error={errors.address_line1?.message} />
                            <div className="grid grid-cols-2 gap-3">
                              <Input {...register('district')} label="Quartier" placeholder="Koumassi" />
                              <Input {...register('city')} label="Ville" placeholder="Abidjan" error={errors.city?.message} />
                            </div>
                            <Button type="submit" variant="orange" size="sm" loading={createAddressMutation.isPending}>
                              Enregistrer l'adresse
                            </Button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/cart')}>
                      Retour
                    </Button>
                    <Button variant="orange" size="lg" className="flex-1"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      disabled={deliveryType === 'home' && !selectedAddressId}
                      onClick={() => setStep('payment')}>
                      Continuer au paiement
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────── PAYMENT ─── */}
              {step === 'payment' && (
                <motion.div key="payment"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-5">

                  <div className="ck-card">
                    <h2 className="ck-font-display font-black text-lg mb-5 flex items-center gap-2"
                      style={{ color: '#1a1209' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(232,130,12,0.1)' }}>
                        <CreditCard className="h-4 w-4" style={{ color: '#e8820c' }} />
                      </div>
                      Mode de paiement
                    </h2>
                    <div className="space-y-3">
                      {[
                        { v: 'cinetpay', label: 'CinetPay',  desc: 'Orange Money · MTN · Wave · Moov · Carte bancaire' },
                        { v: 'paydunya', label: 'PayDunya',   desc: 'Mobile Money multi-opérateurs Afrique de l\'Ouest' },
                      ].map(({ v, label, desc }) => (
                        <label key={v}
                          className={`ck-option ${paymentMethod === v ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(v)}>
                          <input type="radio" className="ck-radio" checked={paymentMethod === v} onChange={() => setPaymentMethod(v)} />
                          <div>
                            <p className="ck-font-body text-sm font-bold" style={{ color: '#1a1209' }}>{label}</p>
                            <p className="ck-font-body text-xs mt-0.5" style={{ color: '#8b5e3c', opacity: 0.65 }}>{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Loyalty */}
                  {user && user.loyalty_points >= 100 && (
                    <div className="ck-card">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="loyalty-check" checked={useLoyalty}
                          onChange={e => { setUseLoyalty(e.target.checked); if (!e.target.checked) setLoyaltyPoints(0) }}
                          className="w-4 h-4" style={{ accentColor: '#e8820c' }} />
                        <label htmlFor="loyalty-check"
                          className="ck-font-body text-sm font-semibold cursor-pointer flex items-center gap-1.5"
                          style={{ color: '#1a1209' }}>
                          <Star className="h-4 w-4 fill-current" style={{ color: '#e8820c' }} />
                          Utiliser {user.loyalty_points.toLocaleString('fr-CI')} points
                          <span className="ck-font-body text-xs font-normal" style={{ color: '#8b5e3c', opacity: 0.65 }}>
                            ({formatCurrency(user.loyalty_points / 100)} de réduction)
                          </span>
                        </label>
                      </div>
                      {useLoyalty && (
                        <div className="mt-3">
                          <Input type="number" label="Points à utiliser"
                            value={loyaltyPoints} min={100}
                            max={Math.min(user.loyalty_points, (summary?.total ?? 0) * 100)}
                            onChange={(e: any) => setLoyaltyPoints(Number(e.target.value))}
                            hint="100 points = 1 FCFA de réduction" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="ck-card">
                    <h3 className="ck-font-body font-bold text-sm mb-3" style={{ color: '#1a1209' }}>
                      Note pour le livreur (optionnel)
                    </h3>
                    <textarea
                      className="ck-textarea"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Sonner 2 fois, laisser au gardien..."
                      rows={3}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#2563eb' }} />
                    <p className="ck-font-body text-xs" style={{ color: '#1d4ed8' }}>
                      Vous serez redirigé vers la page sécurisée de votre opérateur pour finaliser le paiement.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep('delivery')}>
                      Retour
                    </Button>
                    <Button variant="orange" size="lg" className="flex-1"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => setStep('confirm')}>
                      Vérifier la commande
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────── CONFIRM ─── */}
              {step === 'confirm' && !createdOrderId && (
                <motion.div key="confirm-review"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-5">

                  <div className="ck-card">
                    <h2 className="ck-font-display font-black text-lg mb-5" style={{ color: '#1a1209' }}>
                      Récapitulatif final
                    </h2>

                    {/* Items list */}
                    <div className="space-y-2 mb-5 max-h-64 overflow-y-auto ck-scrollbar">
                      {cart?.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 py-2.5"
                          style={{ borderBottom: '1px solid rgba(139,94,60,0.07)' }}>
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                            style={{ background: '#f5efe6', border: '1px solid rgba(139,94,60,0.1)' }}>
                            {item.product?.primary_image_url
                              ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" />
                              : <div className="h-full flex items-center justify-center">
                                  <Package className="h-5 w-5" style={{ color: '#8b5e3c', opacity: 0.25 }} />
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="ck-font-body text-sm font-semibold truncate" style={{ color: '#1a1209' }}>
                              {item.product?.name}
                            </p>
                            <p className="ck-font-body text-xs" style={{ color: '#8b5e3c', opacity: 0.6 }}>
                              ×{item.quantity} · {formatCurrency(item.price)}/u
                            </p>
                          </div>
                          <p className="ck-font-body font-bold text-sm shrink-0" style={{ color: '#1a1209' }}>
                            {formatCurrency(item.line_total)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Summary totals */}
                    <div className="rounded-2xl p-4 space-y-2.5"
                      style={{ background: '#faf7f2', border: '1px solid rgba(139,94,60,0.1)' }}>
                      <div className="ck-summary-row">
                        <span className="ck-font-body text-sm" style={{ color: '#8b5e3c' }}>Sous-total</span>
                        <span className="ck-font-body text-sm font-semibold" style={{ color: '#1a1209' }}>
                          {formatCurrency(summary?.subtotal ?? 0)}
                        </span>
                      </div>
                      {(summary?.coupon_discount ?? 0) > 0 && (
                        <div className="ck-summary-row">
                          <span className="ck-font-body text-sm" style={{ color: '#16a34a' }}>
                            Code promo ({summary!.coupon_code})
                          </span>
                          <span className="ck-font-body text-sm font-bold" style={{ color: '#16a34a' }}>
                            -{formatCurrency(summary!.coupon_discount)}
                          </span>
                        </div>
                      )}
                      {loyaltyDiscount > 0 && (
                        <div className="ck-summary-row">
                          <span className="ck-font-body text-sm" style={{ color: '#16a34a' }}>
                            Points fidélité ({loyaltyPoints} pts)
                          </span>
                          <span className="ck-font-body text-sm font-bold" style={{ color: '#16a34a' }}>
                            -{formatCurrency(loyaltyDiscount)}
                          </span>
                        </div>
                      )}
                      <div className="ck-summary-row">
                        <span className="ck-font-body text-sm" style={{ color: '#8b5e3c' }}>Livraison</span>
                        <span className="ck-font-body text-sm font-semibold"
                          style={{ color: (summary?.delivery_fee ?? 0) === 0 ? '#16a34a' : '#1a1209' }}>
                          {(summary?.delivery_fee ?? 0) === 0 ? 'Gratuite' : formatCurrency(summary!.delivery_fee)}
                        </span>
                      </div>
                      <div className="ck-summary-row pt-2"
                        style={{ borderTop: '1px solid rgba(139,94,60,0.12)' }}>
                        <span className="ck-font-display font-black text-base" style={{ color: '#1a1209' }}>TOTAL</span>
                        <span className="ck-font-display font-black text-xl" style={{ color: '#dc2626' }}>
                          {formatCurrency(finalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep('payment')}>
                      Modifier
                    </Button>
                    <Button variant="orange" size="lg" className="flex-1"
                      loading={createOrderMutation.isPending}
                      rightIcon={<Shield className="h-4 w-4" />}
                      onClick={() => createOrderMutation.mutate()}>
                      Confirmer et payer · {formatCurrency(finalTotal)}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────── SUCCESS ─── */}
              {step === 'confirm' && createdOrderId && (
                <motion.div key="success"
                  initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="ck-card text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.15, bounce: 0.5 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                    <CheckCircle className="h-10 w-10" style={{ color: '#16a34a' }} />
                  </motion.div>
                  <h2 className="ck-font-display font-black text-2xl mb-3" style={{ color: '#1a1209' }}>
                    Commande créée
                  </h2>
                  <p className="ck-font-body text-sm max-w-sm mx-auto mb-8" style={{ color: '#8b5e3c', opacity: 0.75 }}>
                    Cliquez sur "Payer maintenant" pour finaliser via {paymentMethod === 'cinetpay' ? 'CinetPay' : 'PayDunya'}.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="orange" size="lg"
                      loading={initPaymentMutation.isPending}
                      leftIcon={<CreditCard className="h-4 w-4" />}
                      onClick={() => initPaymentMutation.mutate(createdOrderId)}>
                      Payer maintenant
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/orders/${createdOrderId}`)}>
                      Voir ma commande
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          {step !== 'confirm' && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <CartSidebar
                cart={cart}
                summary={summary}
                loyaltyDiscount={loyaltyDiscount}
                finalTotal={finalTotal}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}