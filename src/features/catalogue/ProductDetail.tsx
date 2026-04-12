import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShoppingCart, Star, Heart, Share2, Package, Truck, Shield, Plus, Minus, ChevronRight, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { productApi } from '@/api'
import { useCart } from '@/hooks/useCart'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem, isAdding } = useCart()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', 'detail', slug],
    queryFn: () => productApi.get(slug!).then(r => r.data),
    enabled: !!slug,
  })

  const { data: related } = useQuery({
    queryKey: ['products', 'related', product?.id],
    queryFn: () => productApi.related(product!.id).then(r => r.data),
    enabled: !!product?.id,
  })

  if (isLoading) return (
    <div className="container-app py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-10 w-36" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )

  if (!product) return <div className="container-app py-20 text-center text-stone-500">Produit introuvable</div>

  const images = product.images?.length ? product.images : [{ url: product.primary_image_url ?? '', id: 0, path: '', alt: '', is_primary: true, sort_order: 0 }]

  return (
    <div className="py-8">
      <div className="container-app">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
          <Link to="/" className="hover:text-brand-orange">Accueil</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/rayons/${product.category?.slug}`} className="hover:text-brand-orange">{product.category?.name ?? 'Catalogue'}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-stone-900 font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-stone-50 rounded-3xl overflow-hidden border border-stone-100"
            >
              {images[activeImage]?.url ? (
                <img src={images[activeImage].url} alt={product.name} className="w-full h-full object-contain p-4" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🛒</div>
              )}
            </motion.div>

            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === activeImage ? 'border-brand-orange shadow-brand' : 'border-stone-200'}`}
                  >
                    <img src={img.url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category && <Badge variant="orange">{product.category.name}</Badge>}
              {product.brand && <Badge variant="gray">{product.brand}</Badge>}
              {product.is_bio && <Badge variant="green">🌿 Bio</Badge>}
              {product.is_local && <Badge variant="green">🇨🇮 Local</Badge>}
              {product.is_new && <Badge variant="blue">Nouveau</Badge>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display leading-tight">{product.name}</h1>

            {product.reviews_count > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.average_rating) ? 'text-brand-orange fill-brand-orange' : 'text-stone-200 fill-stone-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-stone-700">{product.average_rating.toFixed(1)}</span>
                <span className="text-sm text-stone-400">({product.reviews_count} avis)</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-black text-stone-900">{formatCurrency(product.price)}</span>
              {product.compare_price && (
                <>
                  <span className="text-lg text-stone-400 line-through">{formatCurrency(product.compare_price)}</span>
                  <Badge variant="red">-{product.discount_percentage}%</Badge>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="mt-5 text-stone-600 text-sm leading-relaxed">{product.description}</p>
            )}

            {/* Stock */}
            <div className="mt-4">
              {!product.in_stock ? (
                <p className="text-brand-red font-semibold text-sm flex items-center gap-1.5"><Package className="h-4 w-4" /> Rupture de stock</p>
              ) : product.is_low_stock ? (
                <p className="text-orange-600 font-semibold text-sm flex items-center gap-1.5"><Package className="h-4 w-4" /> Stock limité — {product.stock} restant{product.stock > 1 ? 's' : ''}</p>
              ) : (
                <p className="text-green-600 font-semibold text-sm flex items-center gap-1.5"><Package className="h-4 w-4" /> En stock</p>
              )}
            </div>

            {/* Quantity + Add to cart */}
            {product.in_stock && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-stone-100 rounded-2xl p-1">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-stone-900">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  variant="orange"
                  size="lg"
                  className="flex-1"
                  loading={isAdding}
                  leftIcon={<ShoppingCart className="h-5 w-5" />}
                  onClick={() => addItem({ productId: product.id, quantity: qty })}
                >
                  Ajouter au panier · {formatCurrency(product.price * qty)}
                </Button>

                <button className="w-11 h-11 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-stone-400 hover:text-red-500 transition-all">
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Trust */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Livraison 24-48h' },
                { icon: Shield, label: 'Paiement sécurisé' },
                { icon: Package, label: 'Retour sous 48h' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-stone-50 rounded-xl text-center">
                  <Icon className="h-4 w-4 text-stone-500" />
                  <span className="text-[10px] font-semibold text-stone-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="section-title mb-6">Produits similaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {related.slice(0, 5).map(p => (
                <div key={p.id} className="card-hover overflow-hidden cursor-pointer" onClick={() => navigate(`/produit/${p.slug}`)}>
                  <div className="aspect-square bg-stone-50 overflow-hidden">
                    {p.primary_image_url ? <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-stone-400 truncate">{p.category?.name}</p>
                    <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 mt-0.5">{p.name}</h3>
                    <p className="font-black text-stone-900 mt-2">{formatCurrency(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
