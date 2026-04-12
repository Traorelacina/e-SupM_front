import { Outlet, Link } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import { Navbar } from './Navbar'
import { CartDrawer } from '@/features/cart/components/CartDrawer'

// Extraire les icônes
const {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  MapPin,
  Phone,
  Mail,
  Shield,
  Truck,
  RefreshCw,
  Headphones
} = LucideIcons

const FOOTER_LINKS = {
  'Nos Services': [
    { href: '/rayons', label: 'Nos Rayons' },
    { href: '/good-box', label: 'Good Box Alimentaire' },
    { href: '/games', label: 'Jeux e-Sup\'M' },
    { href: '/charity', label: 'Charity Panier' },
    { href: '/subscriptions', label: 'Abonnement Mensuel' },
    { href: '/delegate', label: 'Déléguez vos courses' },
  ],
  'Informations': [
    { href: '/conseils', label: 'Nos Conseils' },
    { href: '/recettes', label: 'Vos Recettes' },
    { href: '/nouveautes', label: 'Nouveautés' },
    { href: '/partners', label: 'Devenez Partenaire' },
    { href: '/winners', label: 'Nos Gagnants' },
  ],
  'Légal': [
    { href: '/cgv', label: 'CGV' },
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/faq', label: 'FAQ' },
  ],
}

const TRUST_BADGES = [
  { icon: Shield, label: 'Paiement sécurisé', desc: 'CinetPay · PayDunya' },
  { icon: Truck, label: 'Livraison rapide', desc: '24–48h à domicile' },
  { icon: RefreshCw, label: 'Retours faciles', desc: 'Sous 48h' },
  { icon: Headphones, label: 'Support 7j/7', desc: '08h – 20h' },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
      <Navbar />
      <CartDrawer />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Trust Badges Strip */}
      <div className="bg-white border-t border-stone-100">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">{label}</p>
                  <p className="text-xs text-stone-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300">
        <div className="container-app py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center border-2 border-brand-red shadow-brand">
                  <span className="text-brand-red font-black text-xs">e-SUP'</span>
                </div>
                <div>
                  <div className="font-black text-xl font-display">
                    <span className="text-brand-orange">e-Sup'</span>
                    <span className="text-white">M</span>
                  </div>
                  <div className="text-[10px] text-stone-400 -mt-0.5">Supermarché en Ligne</div>
                </div>
              </Link>

              <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
                Votre supermarché digital en Côte d'Ivoire. Courses rapides, produits frais,
                livraison à domicile ou Click & Collect. <em>Fait avec ❤️ pour vous !</em>
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>Koumassi, Abidjan – Côte d'Ivoire</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>+225 07 00 00 00 00</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-brand-orange shrink-0" />
                  <span>contact@esup-m.ci</span>
                </div>
              </div>

              {/* Social */}
              <div className="mt-6 flex items-center gap-3">
                {[
                  { icon: Facebook, href: '#', label: 'Facebook' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Youtube, href: '#', label: 'YouTube' },
                  { icon: Twitter, href: '#', label: 'Twitter (X)' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-brand-orange hover:text-stone-900 flex items-center justify-center text-stone-400 transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-white font-bold text-sm mb-4 font-display">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        to={href}
                        className="text-sm text-stone-400 hover:text-brand-orange transition-colors hover:translate-x-0.5 inline-block"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 py-6">
          <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-500">
              © {new Date().getFullYear()} e-Sup'M — Tous droits réservés · RCCM CI-ABJ-XXXX
            </p>
            <div className="flex items-center gap-4">
              <img src="/cinetpay.png" alt="CinetPay" className="h-6 opacity-60 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <img src="/paydunya.png" alt="PayDunya" className="h-6 opacity-60 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                Paiement 100% sécurisé
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}