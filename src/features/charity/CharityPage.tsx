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

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  :root {
    --ch-cream:   #faf7f2;
    --ch-warm:    #f5efe6;
    --ch-amber:   #e8820c;
    --ch-earth:   #8b5e3c;
    --ch-dark:    #1a1209;
    --ch-green:   #16a34a;
    --ch-teal:    #0d9488;
  }

  .ch-display { font-family: 'Playfair Display', Georgia, serif; }
  .ch-body    { font-family: 'DM Sans', system-ui, sans-serif; }

  .ch-card {
    background: white;
    border-radius: 20px;
    border: 1.5px solid rgba(139,94,60,0.12);
    overflow: hidden;
  }

  .ch-input {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 14px;
    color: var(--ch-dark);
    background: var(--ch-warm);
    border: 1.5px solid rgba(139,94,60,0.2);
    border-radius: 12px;
    padding: 10px 14px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .ch-input:focus { border-color: var(--ch-amber); background: white; }
  .ch-input::placeholder { color: rgba(139,94,60,0.4); }
  .ch-input.error { border-color: #dc2626; background: #fef2f2; }

  .ch-btn-primary {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-weight: 700;
    font-size: 14px;
    background: var(--ch-amber);
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
  }
  .ch-btn-primary:hover:not(:disabled) { background: #c06a08; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,130,12,0.35); }
  .ch-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .ch-btn-outline {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-weight: 600;
    font-size: 14px;
    background: white;
    color: var(--ch-dark);
    border: 1.5px solid rgba(139,94,60,0.25);
    border-radius: 14px;
    padding: 13px 28px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ch-btn-outline:hover { border-color: var(--ch-amber); color: var(--ch-amber); }

  .ch-amount-pill {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-weight: 700;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 50px;
    border: 2px solid rgba(139,94,60,0.2);
    background: white;
    color: var(--ch-earth);
    cursor: pointer;
    transition: all 0.18s;
  }
  .ch-amount-pill.active,
  .ch-amount-pill:hover {
    border-color: var(--ch-green);
    background: #f0fdf4;
    color: var(--ch-green);
  }

  .ch-payment-card {
    border: 2px solid rgba(139,94,60,0.15);
    border-radius: 14px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
  }
  .ch-payment-card.active { border-color: var(--ch-green); background: #f0fdf4; }
  .ch-payment-card:hover  { border-color: var(--ch-green); }

  .ch-tab {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: transparent;
    color: rgba(139,94,60,0.6);
  }
  .ch-tab.active {
    background: white;
    color: var(--ch-dark);
    box-shadow: 0 2px 8px rgba(139,94,60,0.12);
  }
`

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

const PAYMENT_METHODS = [
  { key: 'mobile_money', label: 'Mobile Money',     sub: 'MTN, Orange, Wave',  Icon: Smartphone },
  { key: 'virement',     label: 'Virement bancaire', sub: 'Banque locale',       Icon: Building2  },
  { key: 'card',         label: 'Carte bancaire',    sub: 'Visa, Mastercard',    Icon: CreditCard },
]

// ─────────────────────────────────────────────────────────────
// COMPOSANTS UTILITAIRES
// ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="ch-body text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-earth)', opacity: 0.7 }}>
      {children}{required && <span style={{ color: '#dc2626' }}> *</span>}
    </p>
  )
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="ch-body flex items-center gap-1.5 text-xs font-semibold mt-1.5" style={{ color: '#dc2626' }}>
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

function SuccessBanner({ title, sub, onReset }: { title: string; sub: string; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-10 px-6 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: '#dcfce7' }}>
        <Check size={32} style={{ color: 'var(--ch-green)' }} />
      </div>
      <h3 className="ch-display font-black text-2xl" style={{ color: 'var(--ch-dark)' }}>{title}</h3>
      <p className="ch-body text-sm max-w-sm" style={{ color: 'var(--ch-earth)', opacity: 0.75 }}>{sub}</p>
      <button className="ch-btn-outline mt-2" onClick={onReset}>Faire un autre don</button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION — BON ALIMENTAIRE
// ─────────────────────────────────────────────────────────────
function VoucherForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount,    setAmount]    = useState<number | ''>('')
  const [customAmt, setCustomAmt] = useState('')
  const [payment,   setPayment]   = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [done,      setDone]      = useState(false)

  const finalAmount = amount !== '' ? amount : (customAmt ? Number(customAmt) : 0)

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
        sub={`Votre bon alimentaire de ${formatCurrency(finalAmount)} a été créé. Vous gagnez ${pointsEarned} points fidélité.`}
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
            <button key={a}
              className={`ch-amount-pill ${amount === a ? 'active' : ''}`}
              onClick={() => { setAmount(a); setCustomAmt(''); }}>
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

      {/* Indicateur rewards */}
      {finalAmount >= 500 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex items-center gap-2">
            <Star size={14} style={{ color: 'var(--ch-green)' }} />
            <span className="ch-body text-sm font-bold" style={{ color: 'var(--ch-green)' }}>
              Vous gagnez {pointsEarned} points fidélité
            </span>
          </div>
          {scratchUnlocked && (
            <div className="flex items-center gap-2">
              <Gift size={14} style={{ color: '#9333ea' }} />
              <span className="ch-body text-sm font-bold" style={{ color: '#9333ea' }}>
                Carte à gratter débloquée !
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Award size={14} style={{ color: '#0d9488' }} />
            <span className="ch-body text-sm font-semibold" style={{ color: '#0d9488' }}>
              Badge Bienfaiteur attribué
            </span>
          </div>
        </motion.div>
      )}

      {/* Mode de paiement */}
      <div>
        <FieldLabel required>Mode de paiement</FieldLabel>
        <div className="space-y-2.5">
          {PAYMENT_METHODS.map(({ key, label, sub, Icon }) => (
            <div key={key}
              className={`ch-payment-card ${payment === key ? 'active' : ''}`}
              onClick={() => setPayment(key)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: payment === key ? '#dcfce7' : 'var(--ch-warm)' }}>
                <Icon size={18} style={{ color: payment === key ? 'var(--ch-green)' : 'var(--ch-earth)' }} />
              </div>
              <div className="flex-1">
                <p className="ch-body text-sm font-bold" style={{ color: 'var(--ch-dark)' }}>{label}</p>
                <p className="ch-body text-xs" style={{ color: 'var(--ch-earth)', opacity: 0.65 }}>{sub}</p>
              </div>
              {payment === key && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--ch-green)' }}>
                  <Check size={11} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <ErrorMsg msg={errors.payment} />
      </div>

      {errors.api && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <AlertCircle size={15} /> {errors.api}
        </div>
      )}

      <button className="ch-btn-primary w-full" disabled={mutation.isLoading} onClick={() => validate() && mutation.mutate()}>
        {mutation.isLoading ? <><RefreshCw size={15} className="animate-spin" /> Traitement…</> : <>Offrir un bon de {finalAmount ? formatCurrency(finalAmount) : '—'} <ChevronRight size={15} /></>}
      </button>

      <p className="ch-body text-xs text-center" style={{ color: 'var(--ch-earth)', opacity: 0.5 }}>
        Paiement sécurisé · Le bon est envoyé immédiatement après confirmation
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION — DON DE PRODUITS
// ─────────────────────────────────────────────────────────────
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

  const totalAmount = selected ? selected.price * selected.quantity : 0
  const pointsEarned = totalAmount >= 500 ? Math.floor(totalAmount / 500) * 10 : 0
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
      {/* Recherche produit */}
      <div>
        <FieldLabel required>Choisissez un produit à offrir</FieldLabel>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ch-earth)', opacity: 0.5 }} />
          <input
            className="ch-input"
            style={{ paddingLeft: 36 }}
            placeholder="Rechercher un produit du catalogue…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {searching && <RefreshCw size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ch-earth)', opacity: 0.4 }} />}
        </div>

        {/* Résultats */}
        <AnimatePresence>
          {results && results.length > 0 && !selected && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-2 rounded-2xl border overflow-hidden divide-y"
              style={{ borderColor: 'rgba(139,94,60,0.12)', divideColor: 'rgba(139,94,60,0.08)' }}>
              {results.slice(0, 6).map((prod: any) => (
                <button key={prod.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition-colors"
                  onClick={() => { setSelected({ id: prod.id, name: prod.name, price: prod.price, quantity: 1 }); setQuery(''); }}>
                  {prod.primary_image_url ? (
                    <img src={prod.primary_image_url} alt={prod.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--ch-warm)' }}>
                      <Package size={16} style={{ color: 'var(--ch-earth)', opacity: 0.4 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="ch-body text-sm font-semibold truncate" style={{ color: 'var(--ch-dark)' }}>{prod.name}</p>
                    <p className="ch-body text-xs" style={{ color: 'var(--ch-earth)', opacity: 0.65 }}>{formatCurrency(prod.price)}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--ch-earth)', opacity: 0.4 }} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Produit sélectionné */}
      {selected && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'var(--ch-warm)', border: '2px solid rgba(139,94,60,0.15)' }}>
          <div className="flex-1 min-w-0">
            <p className="ch-body text-sm font-bold truncate" style={{ color: 'var(--ch-dark)' }}>{selected.name}</p>
            <p className="ch-body text-xs" style={{ color: 'var(--ch-earth)', opacity: 0.65 }}>{formatCurrency(selected.price)} / unité</p>
          </div>

          {/* Contrôle quantité */}
          <div className="flex items-center gap-2 rounded-xl border px-2 py-1"
            style={{ background: 'white', borderColor: 'rgba(139,94,60,0.2)' }}>
            <button onClick={() => setSelected(s => s ? { ...s, quantity: Math.max(1, s.quantity - 1) } : s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-100">
              <Minus size={12} style={{ color: 'var(--ch-dark)' }} />
            </button>
            <span className="ch-body text-sm font-black w-5 text-center" style={{ color: 'var(--ch-dark)' }}>
              {selected.quantity}
            </span>
            <button onClick={() => setSelected(s => s ? { ...s, quantity: s.quantity + 1 } : s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-100">
              <Plus size={12} style={{ color: 'var(--ch-dark)' }} />
            </button>
          </div>

          <button onClick={() => setSelected(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
            <X size={14} style={{ color: '#dc2626' }} />
          </button>
        </motion.div>
      )}

      {/* Résumé */}
      {selected && totalAmount > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-2"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex justify-between items-center">
            <span className="ch-body text-sm font-semibold" style={{ color: 'var(--ch-earth)' }}>
              Total du don
            </span>
            <span className="ch-display font-black text-lg" style={{ color: 'var(--ch-dark)' }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={13} style={{ color: 'var(--ch-green)' }} />
            <span className="ch-body text-xs font-bold" style={{ color: 'var(--ch-green)' }}>
              +{pointsEarned} points fidélité
            </span>
            {scratchUnlocked && (
              <><span style={{ color: 'rgba(139,94,60,0.3)', fontSize: 12 }}>·</span>
              <Gift size={13} style={{ color: '#9333ea' }} />
              <span className="ch-body text-xs font-bold" style={{ color: '#9333ea' }}>Carte à gratter</span></>
            )}
          </div>
        </motion.div>
      )}

      {errors.api && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <AlertCircle size={15} /> {errors.api}
        </div>
      )}

      <button
        className="ch-btn-primary w-full"
        disabled={!selected || mutation.isLoading}
        onClick={() => mutation.mutate()}>
        {mutation.isLoading
          ? <><RefreshCw size={15} className="animate-spin" /> Traitement…</>
          : <>Confirmer le don <ChevronRight size={15} /></>}
      </button>

      <p className="ch-body text-xs text-center" style={{ color: 'var(--ch-earth)', opacity: 0.5 }}>
        Votre don de produit sera traité dans les 24h
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION — MON IMPACT
// ─────────────────────────────────────────────────────────────
function ImpactSection({ userId }: { userId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['charity-impact'],
    queryFn: () => charityApi.impact(),
    enabled: !!userId,
  })

  if (!userId || isLoading) return null
  if (!data || data.total_donated === 0) return null

  const stats = [
    { label: 'Dons totaux',       value: formatCurrency(data.total_donated), Icon: TrendingUp },
    { label: 'Dons effectués',    value: data.donations_count,               Icon: Heart      },
    { label: 'Produits offerts',  value: data.products_gifted,               Icon: Package    },
  ]

  return (
    <div className="ch-card p-6">
      <h3 className="ch-display font-black text-xl mb-4" style={{ color: 'var(--ch-dark)' }}>
        Votre impact
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="text-center rounded-2xl p-4"
            style={{ background: 'var(--ch-warm)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(22,163,74,0.12)' }}>
              <Icon size={18} style={{ color: 'var(--ch-green)' }} />
            </div>
            <p className="ch-display font-black text-lg" style={{ color: 'var(--ch-dark)' }}>{value}</p>
            <p className="ch-body text-xs font-semibold" style={{ color: 'var(--ch-earth)', opacity: 0.65 }}>{label}</p>
          </div>
        ))}
      </div>
      {data.message && (
        <p className="ch-body text-sm text-center mt-4 font-medium" style={{ color: 'var(--ch-green)' }}>
          {data.message}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function CharityPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [tab, setTab] = useState<'voucher' | 'product'>('voucher')

  const benefits = [
    { Icon: Star,   label: '10 points',       sub: 'par 500 FCFA donnés'    },
    { Icon: Gift,   label: 'Carte à gratter', sub: 'dès 5 000 FCFA de don'  },
    { Icon: Award,  label: 'Badge social',     sub: 'Bienfaiteur e-Sup\'M'  },
    { Icon: Users,  label: 'Impact réel',      sub: 'Familles bénéficiaires' },
  ]

  const handleRequireAuth = () => {
    if (!user) { navigate('/login?redirect=/charity'); return false }
    return true
  }

  return (
    <div className="ch-body" style={{ background: 'var(--ch-cream)', minHeight: '100vh', paddingBottom: 60 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(145deg, #064e3b 0%, #059669 55%, #34d399 100%)', padding: '56px 16px 48px' }}>
        <div className="container-app max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Heart size={14} className="text-white" />
            <span className="ch-body text-xs font-bold uppercase tracking-widest text-white">Charity Panier</span>
          </div>
          <h1 className="ch-display font-black text-white" style={{ fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.15 }}>
            Faites le bien<br />en faisant vos courses
          </h1>
          <p className="ch-body text-white/80 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
            Offrez des bons alimentaires ou des produits à des familles dans le besoin.
            Chaque don génère des points fidélité et peut débloquer des récompenses.
          </p>

          {/* Avantages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {benefits.map(({ Icon, label, sub }) => (
              <div key={label} className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <Icon size={20} className="text-white mx-auto mb-1.5" />
                <p className="ch-body text-xs font-bold text-white">{label}</p>
                <p className="ch-body text-[10px] text-white/65 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-app max-w-2xl py-8 space-y-6">

        {/* Impact utilisateur */}
        <ImpactSection userId={user?.id} />

        {/* Formulaire principal */}
        <div className="ch-card">
          {/* Onglets */}
          <div className="flex gap-1 p-2" style={{ background: 'var(--ch-warm)', margin: '0 0 0 0' }}>
            <button className={`ch-tab flex-1 flex items-center justify-center gap-2 ${tab === 'voucher' ? 'active' : ''}`}
              onClick={() => setTab('voucher')}>
              <Ticket size={14} /> Bon alimentaire
            </button>
            <button className={`ch-tab flex-1 flex items-center justify-center gap-2 ${tab === 'product' ? 'active' : ''}`}
              onClick={() => setTab('product')}>
              <ShoppingBag size={14} /> Don de produit
            </button>
          </div>

          {/* Contenu des onglets */}
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
              /* Non connecté */
              <motion.div key="guest" className="flex flex-col items-center text-center py-12 px-6 gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--ch-warm)' }}>
                  <Heart size={28} style={{ color: 'var(--ch-green)' }} />
                </div>
                <h3 className="ch-display font-black text-xl" style={{ color: 'var(--ch-dark)' }}>
                  Connectez-vous pour donner
                </h3>
                <p className="ch-body text-sm max-w-xs" style={{ color: 'var(--ch-earth)', opacity: 0.75 }}>
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
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <Leaf size={16} style={{ color: '#92400e', marginTop: 2, flexShrink: 0 }} />
          <p className="ch-body text-xs leading-relaxed" style={{ color: '#92400e' }}>
            Les bons alimentaires sont distribués directement aux familles bénéficiaires identifiées par notre équipe.
            Votre don est traité sous 24h. Pour tout renseignement, contactez-nous via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}