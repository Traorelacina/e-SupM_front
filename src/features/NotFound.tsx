import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
        <div className="text-8xl mb-4">🛒</div>
        <h1 className="text-6xl font-black text-stone-900 font-display">404</h1>
        <h2 className="text-2xl font-bold text-stone-700 mt-2">Page introuvable</h2>
        <p className="text-stone-500 mt-3 max-w-sm mx-auto">Cette page n'existe pas ou a été déplacée. Retournez à l'accueil pour continuer vos courses.</p>
        <Button variant="orange" size="lg" className="mt-8" leftIcon={<Home className="h-5 w-5" />} onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </motion.div>
    </div>
  )
}
