import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CreditCard, Package, CheckCircle, ArrowRight, ArrowLeft,
  Home, Store, Truck, Shield, Tag, Star,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addressApi, orderApi } from '@/api'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { AlertBanner } from '@/components/ui/ExtraComponents'
import toast from 'react-hot-toast'

type Step = 'delivery' | 'payment' | 'confirm'

const newAddressSchema = z.object({
  recipient_name: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().min(8, 'Numéro invalide'),
  address_line1: z.string().min(5, 'Adresse trop courte'),
  city: z.string().min(2, 'Ville requise'),
  district: z.string().optional(),
})
type NewAddressForm = z.infer<typeof newAddressSchema>

export default function CheckoutPage() {
  const { cart, summary } = useCart()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('delivery')
  const [deliveryType, setDeliveryType] = useState('home')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cinetpay')
  const [useLoyalty, setUseLoyalty] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [notes, setNotes] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.list().then(r => r.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewAddressForm>({
    resolver: zodResolver(newAddressSchema),
  })

  const createAddressMutation = useMutation({
    mutationFn: (data: NewAddressForm) => addressApi.create(data),
    onSuccess: ({ data: newAddr }) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setSelectedAddressId(newAddr.id)
      setShowNewAddress(false)
      reset()
      toast.success('Adresse enregistrée !')
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
    onSuccess: ({ data }) => {
      setCreatedOrderId(data.order.id)
      setStep('confirm')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la commande')
    },
  })

  const initPaymentMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.initPayment(orderId, paymentMethod, user?.phone),
    onSuccess: ({ data }) => {
      if (data.payment_url) window.location.href = data.payment_url
    },
  })

  const loyaltyDiscount = useLoyalty ? loyaltyPoints / 100 : 0
  const finalTotal = Math.max(0, (summary?.total ?? 0) - loyaltyDiscount)

  const STEPS = [
    { id: 'delivery', label: 'Livraison', icon: Truck },
    { id: 'payment',  label: 'Paiement',  icon: CreditCard },
    { id: 'confirm',  label: 'Confirmation', icon: CheckCircle },
  ]
  const stepIndex = STEPS.findIndex(s => s.id === step)

  if (!cart?.items?.length && step !== 'confirm') {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-stone-500 mb-4">Votre panier est vide.</p>
        <Button variant="orange" onClick={() => navigate('/catalogue')}>Voir le catalogue</Button>
      </div>
    )
  }

  return (
    <div className="py-8 bg-stone-50 min-h-screen">
      <div className="container-app max-w-5xl">

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-orange text-stone-900' : 'bg-stone-200 text-stone-400'}`}>
                    {done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${active ? 'text-stone-900' : 'text-stone-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${i < stepIndex ? 'bg-green-400' : 'bg-stone-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* DELIVERY */}
              {step === 'delivery' && (
                <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="card p-6">
                    <h2 className="font-black text-lg text-stone-900 font-display flex items-center gap-2 mb-5"><Truck className="h-5 w-5 text-brand-orange" /> Mode de livraison</h2>
                    <div className="space-y-3">
                      {[
                        { v: 'home', icon: <Home className="h-4 w-4" />, label: 'Livraison à domicile', desc: '24–48h · 2 000 FCFA (gratuit dès 50 000 FCFA)' },
                        { v: 'click_collect', icon: <Store className="h-4 w-4" />, label: 'Click & Collect', desc: 'Retrait gratuit — Magasin Koumassi' },
                      ].map(o => (
                        <label key={o.v} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === o.v ? 'border-brand-orange bg-amber-50' : 'border-stone-200 hover:border-brand-orange/40'}`}>
                          <input type="radio" checked={deliveryType === o.v} onChange={() => setDeliveryType(o.v)} className="mt-1 accent-brand-orange" />
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500">{o.icon}</span>
                            <div>
                              <p className="text-sm font-bold text-stone-900">{o.label}</p>
                              <p className="text-xs text-stone-500">{o.desc}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {deliveryType === 'home' && (
                    <div className="card p-6">
                      <h2 className="font-black text-lg text-stone-900 font-display flex items-center gap-2 mb-5"><MapPin className="h-5 w-5 text-brand-orange" /> Adresse de livraison</h2>
                      <div className="space-y-3">
                        {addresses?.map(addr => (
                          <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-brand-orange bg-amber-50' : 'border-stone-200 hover:border-brand-orange/40'}`}>
                            <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-brand-orange" />
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{addr.recipient_name}</p>
                              <p className="text-sm text-stone-600">{addr.address_line1}</p>
                              <p className="text-sm text-stone-600">{addr.district && `${addr.district}, `}{addr.city}</p>
                              <p className="text-xs text-stone-400">{addr.phone}</p>
                              {addr.is_default && <Badge variant="orange" className="mt-1 text-[10px]">Par défaut</Badge>}
                            </div>
                          </label>
                        ))}
                        <button onClick={() => setShowNewAddress(!showNewAddress)} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-sm font-semibold text-stone-500 hover:border-brand-orange hover:text-brand-orange transition-all">
                          {showNewAddress ? '✕ Annuler' : '+ Nouvelle adresse'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showNewAddress && (
                          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit(d => createAddressMutation.mutate(d))} className="mt-4 space-y-3 border-t border-stone-100 pt-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-3">
                              <Input {...register('recipient_name')} label="Nom" placeholder="Jean Kouassi" error={errors.recipient_name?.message} />
                              <Input {...register('phone')} label="Téléphone" placeholder="+225 07 00 00 00 00" error={errors.phone?.message} />
                            </div>
                            <Input {...register('address_line1')} label="Adresse" placeholder="Rue des Combattants" error={errors.address_line1?.message} />
                            <div className="grid grid-cols-2 gap-3">
                              <Input {...register('district')} label="Quartier" placeholder="Koumassi" />
                              <Input {...register('city')} label="Ville" placeholder="Abidjan" error={errors.city?.message} />
                            </div>
                            <Button type="submit" variant="orange" size="sm" loading={createAddressMutation.isPending}>Enregistrer</Button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/cart')}>Retour</Button>
                    <Button variant="orange" size="lg" className="flex-1" rightIcon={<ArrowRight className="h-5 w-5" />} disabled={deliveryType === 'home' && !selectedAddressId} onClick={() => setStep('payment')}>
                      Continuer au paiement
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PAYMENT */}
              {step === 'payment' && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="card p-6">
                    <h2 className="font-black text-lg text-stone-900 font-display flex items-center gap-2 mb-5"><CreditCard className="h-5 w-5 text-brand-orange" /> Mode de paiement</h2>
                    <div className="space-y-3">
                      {[
                        { v: 'cinetpay', icon: '💳', label: 'CinetPay', desc: 'Orange Money, MTN, Wave, Moov, Carte bancaire' },
                        { v: 'paydunya', icon: '📱', label: 'PayDunya', desc: 'Mobile Money multi-opérateurs Afrique' },
                      ].map(o => (
                        <label key={o.v} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === o.v ? 'border-brand-orange bg-amber-50' : 'border-stone-200 hover:border-brand-orange/40'}`}>
                          <input type="radio" checked={paymentMethod === o.v} onChange={() => setPaymentMethod(o.v)} className="accent-brand-orange" />
                          <span className="text-2xl">{o.icon}</span>
                          <div><p className="text-sm font-bold text-stone-900">{o.label}</p><p className="text-xs text-stone-500">{o.desc}</p></div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {user && user.loyalty_points >= 100 && (
                    <div className="card p-5">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="loyalty-check" checked={useLoyalty} onChange={e => { setUseLoyalty(e.target.checked); if (!e.target.checked) setLoyaltyPoints(0) }} className="w-4 h-4 accent-brand-orange" />
                        <label htmlFor="loyalty-check" className="text-sm font-semibold text-stone-900 cursor-pointer flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-brand-orange fill-brand-orange" />
                          Utiliser mes {user.loyalty_points.toLocaleString('fr-CI')} points ({formatCurrency(user.loyalty_points / 100)})
                        </label>
                      </div>
                      {useLoyalty && (
                        <div className="mt-3">
                          <Input type="number" label="Points à utiliser" value={loyaltyPoints} min={100} max={Math.min(user.loyalty_points, (summary?.total ?? 0) * 100)} onChange={e => setLoyaltyPoints(Number(e.target.value))} hint="100 points = 1 FCFA de réduction" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card p-5">
                    <h3 className="font-bold text-stone-900 mb-3">💬 Notes pour le livreur (optionnel)</h3>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Sonner 2 fois, laisser au gardien…" rows={3} className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange resize-none" />
                  </div>

                  <AlertBanner type="info" message="Vous serez redirigé vers la page sécurisée de votre opérateur pour finaliser le paiement." />

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep('delivery')}>Retour</Button>
                    <Button variant="orange" size="lg" className="flex-1" rightIcon={<ArrowRight className="h-5 w-5" />} onClick={() => setStep('confirm')}>Vérifier la commande</Button>
                  </div>
                </motion.div>
              )}

              {/* CONFIRMATION */}
              {step === 'confirm' && !createdOrderId && (
                <motion.div key="confirm-review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="card p-6">
                    <h2 className="font-black text-lg text-stone-900 font-display mb-5">📋 Récapitulatif</h2>
                    <div className="space-y-3 mb-5 max-h-64 overflow-y-auto scrollbar-hide">
                      {cart?.items?.map(item => (
                        <div key={item.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                            {item.product?.primary_image_url ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xl">🛒</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">{item.product?.name}</p>
                            <p className="text-xs text-stone-500">×{item.quantity} · {formatCurrency(item.price)}/u</p>
                          </div>
                          <p className="font-bold text-sm">{formatCurrency(item.line_total)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-stone-600">Sous-total</span><span className="font-semibold">{formatCurrency(summary?.subtotal ?? 0)}</span></div>
                      {(summary?.coupon_discount ?? 0) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Code promo ({summary!.coupon_code})</span><span className="font-semibold">-{formatCurrency(summary!.coupon_discount)}</span></div>}
                      {loyaltyDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Points fidélité ({loyaltyPoints} pts)</span><span className="font-semibold">-{formatCurrency(loyaltyDiscount)}</span></div>}
                      <div className="flex justify-between text-sm"><span className="text-stone-600">Livraison</span><span className={`font-semibold ${(summary?.delivery_fee ?? 0) === 0 ? 'text-green-600' : ''}`}>{(summary?.delivery_fee ?? 0) === 0 ? 'Gratuite 🎉' : formatCurrency(summary!.delivery_fee)}</span></div>
                      <div className="flex justify-between font-black text-base pt-2 border-t border-stone-200"><span>TOTAL</span><span className="text-brand-red">{formatCurrency(finalTotal)}</span></div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep('payment')}>Modifier</Button>
                    <Button variant="orange" size="lg" className="flex-1" loading={createOrderMutation.isPending} rightIcon={<Shield className="h-5 w-5" />} onClick={() => createOrderMutation.mutate()}>
                      Confirmer et payer · {formatCurrency(finalTotal)}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS */}
              {step === 'confirm' && createdOrderId && (
                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-10 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2, bounce: 0.5 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-stone-900 font-display">Commande créée ! 🎉</h2>
                  <p className="text-stone-500 mt-3 max-w-sm mx-auto">Cliquez sur "Payer maintenant" pour finaliser via {paymentMethod === 'cinetpay' ? 'CinetPay' : 'PayDunya'}.</p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="orange" size="lg" loading={initPaymentMutation.isPending} leftIcon={<CreditCard className="h-5 w-5" />} onClick={() => initPaymentMutation.mutate(createdOrderId)}>
                      Payer maintenant
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/orders/${createdOrderId}`)}>Voir ma commande</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          {step !== 'confirm' && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-5">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-brand-orange" /> Votre panier</h3>
                <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-hide">
                  {cart?.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                        {item.product?.primary_image_url ? <img src={item.product.primary_image_url} alt="" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-sm">🛒</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">{item.product?.name}</p>
                        <p className="text-xs text-stone-400">×{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold shrink-0">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-stone-600">Sous-total</span><span className="font-semibold">{formatCurrency(summary?.subtotal ?? 0)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-stone-600">Livraison</span><span className={`font-semibold ${(summary?.delivery_fee ?? 0) === 0 ? 'text-green-600' : ''}`}>{(summary?.delivery_fee ?? 0) === 0 ? 'Gratuite' : formatCurrency(summary!.delivery_fee)}</span></div>
                  {loyaltyDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Points fidélité</span><span className="font-semibold">-{formatCurrency(loyaltyDiscount)}</span></div>}
                  <div className="flex justify-between font-black text-base pt-2 border-t border-stone-100"><span>Total</span><span className="text-brand-red">{formatCurrency(finalTotal)}</span></div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-400"><Shield className="h-3.5 w-3.5 text-green-500" />Paiement 100% sécurisé</div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
