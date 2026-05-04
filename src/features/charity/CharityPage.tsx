// features/charity/CharityPage.tsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Gift, Star, Package, CreditCard, Smartphone, Building2,
  ChevronRight, Check, AlertCircle, RefreshCw, Leaf, Award,
  Ticket, ShoppingBag, TrendingUp, Search, Plus, Minus, X, Users,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { charityApi, productApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'

// ── Palette e-Sup'M
const C = {
  orange: '#F5A623',
  red: '#E02020',
  dark: '#1C0F00',
  warm: '#FFF8F0',
  card: '#FFFDF9',
  text: '#3D1F00',
  muted: '#9E7554',
  border: 'rgba(245,166,35,0.2)',
  green: '#16A34A',
}

// ── Styles injectés
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .ch-root * { font-family: 'Nunito', system-ui, sans-serif; }

  .ch-input {
    font-size: 14px;
    font-weight: 600;
    color: #1C0F00;
    background: #FFF8F0;
    border: 1.5px solid rgba(245,166,35,0.3);
    border-radius: 12px;
    padding: 10px 14px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .ch-input:focus { border-color: #F5A623; background: white; }
  .ch-input::placeholder { color: rgba(158,117,84,0.5); font-weight: 500; }
  .ch-input.error { border-color: #DC2626; background: #FEF2F2; }

  .ch-btn-primary {
    font-weight: 800;
    font-size: 15px;
    background: linear-gradient(90deg, #E02020 0%, #F5A623 100%);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 13px 28px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(224,32,32,0.25);
  }
  .ch-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(224,32,32,0.3); }
  .ch-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .ch-btn-outline {
    font-weight: 700;
    font-size: 14px;
    background: white;
    color: #3D1F00;
    border: 1.5px solid rgba(245,166,35,0.4);
    border-radius: 14px;
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ch-btn-outline:hover { border-color: #F5A623; color: #E02020; }

  .ch-pill {
    font-weight: 700;
    font-size: 13px;
    padding: 8px 18px;
    border-radius: 50px;
    border: 2px solid rgba(245,166,35,0.25);
    background: white;
    color: #9E7554;
    cursor: pointer;
    transition: all 0.18s;
  }
  .ch-pill.active, .ch-pill:hover {
    border-color: #F5A623;
    background: #FFF3E0;
    color: #E02020;
  }

  .ch-pay-card {
    border: 1.5px solid rgba(245,166,35,0.2);
    border-radius: 14px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
  }
  .ch-pay-card.active { border-color: #F5A623; background: #FFF3E0; }
  .ch-pay-card:hover { border-color: #F5A623; }

  .ch-tab {
    font-weight: 800;
    font-size: 14px;
    padding: 11px 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: transparent;
    color: rgba(61,31,0,0.45);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ch-tab.active {
    background: white;
    color: #1C0F00;
    box-shadow: 0 2px 10px rgba(245,166,35,0.2);
  }
`

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

const PAYMENT_METHODS = [
  { key: 'mobile_money', label: 'Mobile Money',      sub: 'MTN, Orange, Wave', Icon: Smartphone },
  { key: 'virement',     label: 'Virement bancaire',  sub: 'Banque locale',      Icon: Building2  },
  { key: 'card',         label: 'Carte bancaire',     sub: 'Visa, Mastercard',   Icon: CreditCard },
]

// ── Utilitaires UI
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
      {children}{required && <span style={{ color: '#DC2626' }}> *</span>}
    </p>
  )
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

function SuccessBanner({ title, sub, onReset }: { title: string; sub: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-12 px-6 gap-4"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: '#DCFCE7' }}
      >
        <Check size={30} style={{ color: C.green }} />
      </div>
      <h3 style={{ fontWeight: 900, fontSize: 22, color: C.dark }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.muted, maxWidth: 320 }}>{sub}</p>
      <button className="ch-btn-outline mt-2" onClick={onReset}>Faire un autre don</button>
    </motion.div>
  )
}

// ── Formulaire bon alimentaire
function VoucherForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount,    setAmount]    = useState<number | ''>('')
  const [customAmt, setCustomAmt] = useState('')
  const [payment,   setPayment]   = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [done,      setDone]      = useState(false)

  const finalAmount    = amount !== '' ? amount : (customAmt ? Number(customAmt) : 0)
  const pointsEarned   = finalAmount >= 500 ? Math.floor(finalAmount / 500) * 10 : 0
  const scratchUnlocked = finalAmount >= 5000

  const mutation = useMutation({
    mutationFn: () => charityApi.donateVoucher({ amount: finalAmount, payment_method: payment }),
    onSuccess: () => setDone(true),
    onError: (e: any) => setErrors({ api: e.message || 'Erreur lors du traitement' }),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!finalAmount || finalAmount < 500) e.amount  = 'Montant minimum 500 FCFA'
    if (!payment)                           e.payment = 'Choisissez un mode de paiement'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (done) {
    return (
      <SuccessBanner
        title="Merci pour votre don !"
        sub={`Votre bon de ${formatCurrency(finalAmount)} a été créé. Vous gagnez ${pointsEarned} points fidélité.`}
        onReset={() => { setDone(false); setAmount(''); setCustomAmt(''); setPayment(''); }}
      />
    )
  }

  return (
    <div className="space-y-6 p-6">

      {/* Montant */}
      <div>
        <FieldLabel required>Montant du bon</FieldLabel>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_AMOUNTS.map(a => (
            <button
              key={a}
              className={`ch-pill ${amount === a ? 'active' : ''}`}
              onClick={() => { setAmount(a); setCustomAmt(''); }}
            >
              {formatCurrency(a)}
            </button>
          ))}
        </div>
        <input
          type="number"
          className={`ch-input ${errors.amount && !finalAmount ? 'error' : ''}`}
          placeholder="Autre montant (min. 500 FCFA)"
          value={customAmt}
          min={500}
          onChange={e => { setCustomAmt(e.target.value); setAmount(''); }}
        />
        <ErrorMsg msg={errors.amount} />
      </div>

      {/* Récompenses */}
      {finalAmount >= 500 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <div className="flex items-center gap-2">
            <Star size={14} style={{ color: C.green }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
              Vous gagnez {pointsEarned} points fidélité
            </span>
          </div>
          {scratchUnlocked && (
            <div className="flex items-center gap-2">
              <Gift size={14} style={{ color: '#9333EA' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9333EA' }}>
                Carte à gratter débloquée !
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Award size={14} style={{ color: C.orange }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.orange }}>
              Badge Bienfaiteur e-Sup'M attribué
            </span>
          </div>
        </motion.div>
      )}

      {/* Mode de paiement */}
      <div>
        <FieldLabel required>Mode de paiement</FieldLabel>
        <div className="space-y-2.5">
          {PAYMENT_METHODS.map(({ key, label, sub, Icon }) => (
            <div
              key={key}
              className={`ch-pay-card ${payment === key ? 'active' : ''}`}
              onClick={() => setPayment(key)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: payment === key ? '#FFF3E0' : '#F5F5F5' }}
              >
                <Icon size={18} style={{ color: payment === key ? C.orange : C.muted }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{label}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{sub}</p>
              </div>
              {payment === key && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: C.orange }}
                >
                  <Check size={11} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <ErrorMsg msg={errors.payment} />
      </div>

      {errors.api && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          <AlertCircle size={15} /> {errors.api}
        </div>
      )}

      <button
        className="ch-btn-primary w-full"
        disabled={mutation.isLoading}
        onClick={() => validate() && mutation.mutate()}
      >
        {mutation.isLoading
          ? <><RefreshCw size={15} className="animate-spin" /> Traitement en cours...</>
          : <>Offrir un bon de {finalAmount ? formatCurrency(finalAmount) : '—'} <ChevronRight size={15} /></>
        }
      </button>

      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
        Paiement sécurisé · Le bon est envoyé immédiatement après confirmation
      </p>
    </div>
  )
}

// ── Formulaire don produit
function ProductDonationForm({ onSuccess }: { onSuccess: () => void }) {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<{ id: number; name: string; price: number; quantity: number } | null>(null)
  const [done,     setDone]     = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  const { data: results, isLoading: searching } = useQuery({
    queryKey: ['charity-product-search', query],
    queryFn: () => productApi.list({ q: query, per_page: 8 }).then(r => r.data),
    enabled: query.length >= 2,
  })

  const mutation = useMutation({
    mutationFn: () => charityApi.donateProduct({ product_id: selected!.id, quantity: selected!.quantity }),
    onSuccess: () => setDone(true),
    onError: (e: any) => setErrors({ api: e.message || 'Erreur lors du traitement' }),
  })

  const totalAmount    = selected ? selected.price * selected.quantity : 0
  const pointsEarned   = totalAmount >= 500 ? Math.floor(totalAmount / 500) * 10 : 0
  const scratchUnlocked = totalAmount >= 5000

  if (done) {
    return (
      <SuccessBanner
        title="Don de produit enregistré !"
        sub={`Merci pour votre générosité. Vous gagnez ${pointsEarned} points fidélité.`}
        onReset={() => { setDone(false); setSelected(null); setQuery(''); }}
      />
    )
  }

  return (
    <div className="space-y-6 p-6">

      <div>
        <FieldLabel required>Choisissez un produit à offrir</FieldLabel>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input
            className="ch-input"
            style={{ paddingLeft: 36 }}
            placeholder="Rechercher dans le catalogue..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {searching && (
            <RefreshCw size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          )}
        </div>

        <AnimatePresence>
          {results && results.length > 0 && !selected && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 rounded-2xl overflow-hidden"
              style={{ border: `1.5px solid ${C.border}` }}
            >
              {results.slice(0, 6).map((prod: any) => (
                <button
                  key={prod.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  onClick={() => { setSelected({ id: prod.id, name: prod.name, price: prod.price, quantity: 1 }); setQuery('') }}
                >
                  {prod.primary_image_url ? (
                    <img src={prod.primary_image_url} alt={prod.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5EDD8' }}>
                      <Package size={16} style={{ color: C.muted }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }} className="truncate">{prod.name}</p>
                    <p style={{ fontSize: 12, color: C.muted }}>{formatCurrency(prod.price)}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: C.muted }} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Produit sélectionné */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: '#FFF3E0', border: `1.5px solid ${C.border}` }}
        >
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 700, color: C.dark }} className="truncate">{selected.name}</p>
            <p style={{ fontSize: 12, color: C.muted }}>{formatCurrency(selected.price)} / unité</p>
          </div>

          <div
            className="flex items-center gap-2 rounded-xl px-2 py-1"
            style={{ background: 'white', border: `1.5px solid ${C.border}` }}
          >
            <button
              onClick={() => setSelected(s => s ? { ...s, quantity: Math.max(1, s.quantity - 1) } : s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-50 transition-colors"
            >
              <Minus size={12} style={{ color: C.dark }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.dark, minWidth: 20, textAlign: 'center' }}>
              {selected.quantity}
            </span>
            <button
              onClick={() => setSelected(s => s ? { ...s, quantity: s.quantity + 1 } : s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-50 transition-colors"
            >
              <Plus size={12} style={{ color: C.dark }} />
            </button>
          </div>

          <button
            onClick={() => setSelected(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
          >
            <X size={14} style={{ color: '#DC2626' }} />
          </button>
        </motion.div>
      )}

      {/* Résumé */}
      {selected && totalAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-2"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Total du don</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.dark }}>{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={13} style={{ color: C.green }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>+{pointsEarned} points fidélité</span>
            {scratchUnlocked && (
              <>
                <span style={{ color: C.muted, fontSize: 12 }}>·</span>
                <Gift size={13} style={{ color: '#9333EA' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9333EA' }}>Carte à gratter</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {errors.api && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          <AlertCircle size={15} /> {errors.api}
        </div>
      )}

      <button
        className="ch-btn-primary w-full"
        disabled={!selected || mutation.isLoading}
        onClick={() => mutation.mutate()}
      >
        {mutation.isLoading
          ? <><RefreshCw size={15} className="animate-spin" /> Traitement...</>
          : <>Confirmer le don <ChevronRight size={15} /></>
        }
      </button>

      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
        Votre don de produit sera traité dans les 24h ouvrées
      </p>
    </div>
  )
}

// ── Section impact
function ImpactSection({ userId }: { userId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['charity-impact'],
    queryFn: () => charityApi.impact(),
    enabled: !!userId,
  })

  if (!userId || isLoading || !data || data.total_donated === 0) return null

  const stats = [
    { label: 'Dons totaux',      value: formatCurrency(data.total_donated), Icon: TrendingUp },
    { label: 'Dons effectués',   value: data.donations_count,               Icon: Heart      },
    { label: 'Produits offerts', value: data.products_gifted,               Icon: Package    },
  ]

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(245,166,35,0.08)' }}
    >
      <h3 style={{ fontWeight: 900, fontSize: 20, color: C.dark, marginBottom: 16 }}>Votre impact</h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="text-center rounded-2xl p-4" style={{ background: '#FFF3E0' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(245,166,35,0.15)' }}
            >
              <Icon size={18} style={{ color: C.orange }} />
            </div>
            <p style={{ fontWeight: 900, fontSize: 18, color: C.dark }}>{value}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>{label}</p>
          </div>
        ))}
      </div>
      {data.message && (
        <p style={{ fontSize: 13, textAlign: 'center', marginTop: 16, fontWeight: 600, color: C.green }}>
          {data.message}
        </p>
      )}
    </div>
  )
}

// ── Page principale
export default function CharityPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [tab, setTab] = useState<'voucher' | 'product'>('voucher')

  const benefits = [
    { Icon: Star,   label: '10 points',        sub: 'par 500 FCFA donnés'   },
    { Icon: Gift,   label: 'Carte à gratter',  sub: 'dès 5 000 FCFA de don' },
    { Icon: Award,  label: 'Badge Bienfaiteur', sub: "Reconnu e-Sup'M"       },
    { Icon: Users,  label: 'Impact réel',       sub: 'Familles bénéficiaires' },
  ]

  return (
    <div className="ch-root min-h-screen" style={{ background: C.warm, paddingBottom: 60 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Bande de couleur en haut ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.red} 0%, ${C.orange} 100%)` }} />

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(140deg, #1C0F00 0%, #B91C1C 40%, #F5A623 100%)`, padding: '56px 16px 48px' }}>
        <div className="max-w-2xl mx-auto text-center">

          {/* Badge section */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-5"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <Heart size={14} className="text-white" />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Charity Panier
            </span>
          </div>

          <h1 style={{ fontWeight: 900, color: 'white', fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.15, marginBottom: 12 }}>
            Faites le bien<br />en faisant vos courses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            Offrez des bons alimentaires ou des produits à des familles dans le besoin.
            Chaque don génère des points fidélité et peut déclencher des récompenses.
          </p>

          {/* Avantages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {benefits.map(({ Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
              >
                <Icon size={20} className="text-white mx-auto mb-1.5" />
                <p style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{label}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

        {/* Impact */}
        <ImpactSection userId={user?.id} />

        {/* Formulaire */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: C.card,
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 4px 24px rgba(245,166,35,0.1)',
          }}
        >
          {/* Onglets */}
          <div className="flex gap-1 p-2" style={{ background: '#FFF3E0' }}>
            <button
              className={`ch-tab flex-1 ${tab === 'voucher' ? 'active' : ''}`}
              onClick={() => setTab('voucher')}
            >
              <Ticket size={14} /> Bon alimentaire
            </button>
            <button
              className={`ch-tab flex-1 ${tab === 'product' ? 'active' : ''}`}
              onClick={() => setTab('product')}
            >
              <ShoppingBag size={14} /> Don de produit
            </button>
          </div>

          {/* Contenu onglet */}
          <AnimatePresence mode="wait">
            {user ? (
              tab === 'voucher' ? (
                <motion.div key="voucher" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <VoucherForm onSuccess={() => {}} />
                </motion.div>
              ) : (
                <motion.div key="product" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <ProductDonationForm onSuccess={() => {}} />
                </motion.div>
              )
            ) : (
              <motion.div
                key="guest"
                className="flex flex-col items-center text-center py-12 px-6 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: '#FFF3E0' }}
                >
                  <Heart size={28} style={{ color: C.red }} />
                </div>
                <h3 style={{ fontWeight: 900, fontSize: 20, color: C.dark }}>
                  Connectez-vous pour donner
                </h3>
                <p style={{ fontSize: 14, color: C.muted, maxWidth: 280 }}>
                  Un compte est nécessaire pour recevoir vos points fidélité et votre carte à gratter.
                </p>
                <div className="flex gap-3 mt-2">
                  <button className="ch-btn-primary" onClick={() => navigate('/login?redirect=/charity')}>
                    Se connecter
                  </button>
                  <button className="ch-btn-outline" onClick={() => navigate('/register')}>
                    Créer un compte
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Note d'information */}
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: '#FFFBEB', border: '1px solid rgba(245,166,35,0.4)' }}
        >
          <Leaf size={16} style={{ color: C.orange, marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
            Les bons alimentaires sont distribués directement aux familles bénéficiaires identifiées par notre équipe.
            Votre don est traité sous 24h. Pour toute question, contactez-nous via WhatsApp.
          </p>
        </div>

      </div>
    </div>
  )
}