import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useAuthStore } from '@/stores/authStore'

// Lazy pages
const HomePage          = lazy(() => import('@/features/home/HomePage'))
const CataloguePage     = lazy(() => import('@/features/catalogue/CataloguePage'))
const ProductDetail     = lazy(() => import('@/features/catalogue/ProductDetail'))
const LoginPage         = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage      = lazy(() => import('@/features/auth/RegisterPage'))
const CartPage          = lazy(() => import('@/features/cart/CartPage'))
const CheckoutPage      = lazy(() => import('@/features/cart/CheckoutPage'))
const OrdersPage        = lazy(() => import('@/features/orders/OrdersPage'))
const OrderDetail       = lazy(() => import('@/features/orders/OrderDetail'))
const ProfilePage       = lazy(() => import('@/features/profile/ProfilePage'))
const LoyaltyPage       = lazy(() => import('@/features/loyalty/LoyaltyPage'))
const GamesPage         = lazy(() => import('@/features/games/GamesPage'))
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/SubscriptionsPage'))
const CharityPage       = lazy(() => import('@/features/charity/CharityPage'))
const AdminLayout       = lazy(() => import('@/features/admin/AdminLayout'))
const AdminDashboard    = lazy(() => import('@/features/admin/AdminDashboard'))
const AdminProducts     = lazy(() => import('@/features/admin/AdminProducts'))
const AdminOrders       = lazy(() => import('@/features/admin/AdminOrders'))
const AdminUsers        = lazy(() => import('@/features/admin/AdminUsers'))
const AdminStats        = lazy(() => import('@/features/admin/AdminStats'))
const NotFound          = lazy(() => import('@/features/NotFound'))

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-orange/20 flex items-center justify-center">
          <span className="text-2xl animate-bounce">🛒</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/rayons" element={<CataloguePage />} />
          <Route path="/rayons/:slug" element={<CataloguePage />} />
          <Route path="/produit/:slug" element={<ProductDetail />} />
          <Route path="/promos" element={<CataloguePage />} />
          <Route path="/good-box" element={<CataloguePage />} />
          <Route path="/nouveautes" element={<CataloguePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/charity" element={<CharityPage />} />

          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><AdminLayout /></Suspense></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stats" element={<AdminStats />} />
        </Route>
      </Routes>
    </Suspense>
  )
}