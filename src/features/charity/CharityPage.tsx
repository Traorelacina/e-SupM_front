import { motion } from 'framer-motion'
import { Heart, Gift, Star, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function CharityPage() {
  const navigate = useNavigate()
  return (
    <div className="py-12 container-app max-w-3xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-4"><Heart className="h-4 w-4" /> Charity Panier</div>
        <h1 className="text-3xl font-black text-stone-900 font-display">Faites le bien en faisant vos courses 💚</h1>
        <p className="mt-3 text-stone-500">Offrez des bons alimentaires. Chaque don vous rapporte des points fidélité.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {[
          { emoji: '🎟️', title: 'Bons Alimentaires', desc: 'À partir de 500 FCFA.', color: 'from-green-500 to-emerald-500', cta: 'Acheter un bon' },
          { emoji: '🥫', title: 'Don de Produits', desc: 'Offrez des produits du catalogue.', color: 'from-teal-500 to-cyan-500', cta: 'Choisir des produits' },
        ].map(({ emoji, title, desc, color, cta }) => (
          <motion.div key={title} whileHover={{ scale: 1.02 }} className={`bg-gradient-to-br ${color} rounded-3xl p-6 text-white`}>
            <span className="text-5xl">{emoji}</span>
            <h2 className="text-xl font-black mt-4 font-display">{title}</h2>
            <p className="text-white/90 text-sm mt-2">{desc}</p>
            <Button className="mt-5 bg-white text-stone-900 hover:bg-stone-100 w-full" onClick={() => navigate('/login')}>{cta}</Button>
          </motion.div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-stone-900 mb-4">🌟 Avantages</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{ icon: Star, label: '10 pts / 500 FCFA' }, { icon: Gift, label: 'Carte à gratter dès 5 000 FCFA' }, { icon: Package, label: 'Badge Bienfaiteur' }].map(({ icon: Icon, label }) => (
            <div key={label} className="text-center"><div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center mx-auto mb-2"><Icon className="h-5 w-5 text-amber-700" /></div><p className="text-xs font-bold text-stone-900">{label}</p></div>
          ))}
        </div>
      </div>
    </div>
  )
}
