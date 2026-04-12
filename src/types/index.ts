// ========================
// API Response Types
// ========================
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    next: string | null
    prev: string | null
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// ========================
// User & Auth
// ========================
export type UserRole = 'admin' | 'client' | 'preparateur' | 'livreur' | 'partner'
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum'
export type UserStatus = 'active' | 'banned' | 'inactive'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  loyalty_points: number
  loyalty_level: LoyaltyLevel
  total_points_earned: number
  email_verified_at?: string
  language: 'fr' | 'en'
  created_at: string
}

export interface AuthTokens {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
}

// ========================
// Address
// ========================
export interface Address {
  id: number
  user_id: number
  label: string
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  district?: string
  country: string
  latitude?: number
  longitude?: number
  is_default: boolean
}

// ========================
// Category
// ========================
export interface Category {
  id: number
  parent_id?: number
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  color?: string
  sort_order: number
  is_active: boolean
  is_premium: boolean
  show_in_menu: boolean
  children?: Category[]
  parent?: Category
  products_count?: number
}

// ========================
// Product
// ========================
export type AdminLabel = 'none' | 'stock_limite' | 'promo' | 'stock_epuise' | 'offre_limitee' | 'vote_rayon'
export type ExpiryAlert = 'none' | 'red' | 'orange' | 'yellow'

export interface ProductImage {
  id: number
  path: string
  url: string
  alt?: string
  is_primary: boolean
  sort_order: number
}

export interface Product {
  id: number
  category_id: number
  category?: Category
  name: string
  slug: string
  sku?: string
  description?: string
  price: number
  compare_price?: number
  weight?: number
  unit: string
  brand?: string
  origin?: string
  stock: number
  is_bio: boolean
  is_local: boolean
  is_eco: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_premium: boolean
  is_new: boolean
  is_featured: boolean
  is_active: boolean
  admin_label: AdminLabel
  admin_label_discount?: number
  expiry_date?: string
  expiry_alert: ExpiryAlert
  average_rating: number
  reviews_count: number
  sales_count: number
  views_count: number
  images?: ProductImage[]
  primary_image_url?: string
  discount_percentage?: number
  in_stock: boolean
  is_low_stock: boolean
  created_at: string
}

// ========================
// Cart
// ========================
export interface CartItem {
  id: number
  cart_id: number
  product_id: number
  product?: Product
  quantity: number
  price: number
  size?: string
  color?: string
  line_total: number
}

export interface Cart {
  id: number
  user_id?: number
  coupon_code?: string
  coupon_discount: number
  items: CartItem[]
  expires_at?: string
}

export interface CartSummary {
  items_count: number
  subtotal: number
  coupon_discount: number
  delivery_fee: number
  total: number
  coupon_code?: string
}

// ========================
// Order
// ========================
export type OrderStatus =
  | 'pending' | 'confirmed' | 'paid' | 'preparing'
  | 'ready' | 'dispatched' | 'delivered' | 'cancelled' | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DeliveryType = 'home' | 'click_collect' | 'locker'
export type PaymentMethod = 'card' | 'mobile_money' | 'cinetpay' | 'paydunya' | 'cash'

export interface OrderItem {
  id: number
  product_id?: number
  product?: Product
  product_name: string
  product_sku?: string
  product_image?: string
  unit_price: number
  compare_price?: number
  quantity: number
  total: number
  size?: string
  color?: string
  preparation_status: 'pending' | 'preparing' | 'ready' | 'substituted' | 'unavailable'
}

export interface Order {
  id: number
  order_number: string
  user_id: number
  user?: User
  address?: Address
  status: OrderStatus
  payment_status: PaymentStatus
  delivery_type: DeliveryType
  payment_method?: PaymentMethod
  subtotal: number
  discount_amount: number
  delivery_fee: number
  loyalty_discount: number
  total: number
  coupon_code?: string
  loyalty_points_earned: number
  loyalty_points_used: number
  notes?: string
  items?: OrderItem[]
  is_subscription_order: boolean
  tracking_code?: string
  paid_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancel_reason?: string
  created_at: string
}

// ========================
// Subscription
// ========================
export type SubscriptionType = 'standard' | 'custom'
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'pending'

export interface SubscriptionItem {
  id: number
  product_id: number
  product?: Product
  quantity: number
  price: number
}

export interface Subscription {
  id: number
  user_id: number
  name: string
  type: SubscriptionType
  preset_type?: string
  frequency: SubscriptionFrequency
  delivery_type: DeliveryType
  address?: Address
  status: SubscriptionStatus
  subtotal: number
  discount_percent: number
  total: number
  next_delivery_at?: string
  suspended_until?: string
  items: SubscriptionItem[]
  total_orders_generated: number
  created_at: string
}

// ========================
// Game
// ========================
export type GameType = 'defi' | 'carte_gratter' | 'roue' | 'quiz' | 'juste_prix' | 'battle' | 'calendrier'
export type GameStatus = 'upcoming' | 'active' | 'closed' | 'draft'

export interface Game {
  id: number
  name: string
  description?: string
  image?: string
  type: GameType
  status: GameStatus
  is_open_to_all: boolean
  requires_purchase: boolean
  min_purchase_amount?: number
  starts_at?: string
  ends_at?: string
  has_countdown: boolean
  time_limit_seconds?: number
  prizes?: string
  loyalty_points_prize: number
  participants_count?: number
}

export interface WheelPrize {
  id: number
  label: string
  type: string
  value?: string
  image?: string
  probability: number
}

export interface QuizQuestion {
  id: number
  question: string
  options: Array<{ text: string; is_correct?: boolean }>
  theme?: string
  points: number
  time_limit_seconds: number
  sort_order: number
}

// ========================
// Loyalty
// ========================
export interface LoyaltyTransaction {
  id: number
  points: number
  type: 'earned' | 'spent' | 'bonus' | 'expired' | 'charity_bonus' | 'referral' | 'review' | 'game_win'
  description?: string
  created_at: string
}

export interface Badge {
  id: number
  name: string
  description?: string
  image: string
  icon?: string
  type: string
  points_reward: number
  earned: boolean
  earned_at?: string
}

export interface LoyaltyProgress {
  level: LoyaltyLevel
  next_level?: LoyaltyLevel
  progress: number
  points_to_next: number
  current_points: number
  total_earned: number
  multiplier: number
}

// ========================
// Promotion
// ========================
export interface Promotion {
  id: number
  name: string
  description?: string
  image?: string
  type: 'promo' | 'solde' | 'destockage' | 'flash' | 'vente_privee'
  discount_type: 'percentage' | 'fixed' | 'buy_x_get_y'
  discount_value: number
  is_active: boolean
  starts_at?: string
  ends_at?: string
}

// ========================
// Charity
// ========================
export interface CharityDonation {
  id: number
  type: 'voucher' | 'product'
  amount?: number
  product?: Product
  quantity?: number
  status: 'pending' | 'confirmed' | 'distributed'
  loyalty_points_earned: number
  scratch_card_unlocked: boolean
  created_at: string
}

// ========================
// Advertisement
// ========================
export interface Advertisement {
  id: number
  title: string
  client_name?: string
  image_url: string
  link?: string
  position: 'large_center' | 'left' | 'right' | 'banner_top'
  is_flashing: boolean
  slide_count: number
}

// ========================
// Admin Stats
// ========================
export interface DashboardStats {
  today: { orders: number; revenue: number; new_users: number }
  month: { orders: number; revenue: number; new_users: number; avg_basket: number }
  totals: { users: number; products: number; orders: number; subscriptions: number }
  recent_orders: Order[]
  low_stock_count: number
  out_of_stock_count: number
  pending_preparation: number
}

// ========================
// Filters
// ========================
export interface ProductFilters {
  q?: string
  category?: string
  min_price?: number
  max_price?: number
  brand?: string
  is_bio?: boolean
  is_local?: boolean
  is_vegan?: boolean
  is_gluten_free?: boolean
  in_promo?: boolean
  is_premium?: boolean
  sort?: 'price' | 'name' | 'created_at' | 'sales_count' | 'average_rating'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}