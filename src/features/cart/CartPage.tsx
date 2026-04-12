import { useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/data/EmptyState'
import { ArrowRight, ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const { cart, summary } = useCart()
  const navigate = useNavigate()

  if (!cart?.items?.length) return (
    <div className="container-app py-20">
      <EmptyState emoji="🛒" title="Votre panier est vide" description="Ajoutez des produits pour commencer vos courses." action={<Button variant="orange" onClick={() => navigate('/catalogue')}>Explorer le catalogue</Button>} />
    </div>
  )

  return (
    <div className="py-8 container-app max-w-2xl">
      <h1 className="section-title mb-6">Mon Panier ({summary?.items_count} articles)</h1>
      <div className="card p-5 mb-4">
        <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-brand-red">{formatCurrency(summary?.total ?? 0)}</span></div>
      </div>
      <Button variant="orange" fullWidth size="lg" rightIcon={<ArrowRight className="h-5 w-5" />} onClick={() => navigate('/checkout')}>
        Commander · {formatCurrency(summary?.total ?? 0)}
      </Button>
    </div>
  )
}
