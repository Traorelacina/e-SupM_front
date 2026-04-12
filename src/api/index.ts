// ─── Base config ─────────────────────────────────────────────────────────────
export const STORAGE_URL = '/storage/';

/** Construit l'URL complète d'une image stockée dans storage/public */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/storage/')) {
    return path;
  }
  return `${STORAGE_URL}${path}`;
}

const BASE_URL = '/api';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  [key: string]: any;
}

async function request<T = any>(
  method: string,
  path: string,
  body: any = null,
  isFormData: boolean = false
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

const get = <T = any>(path: string, params: Record<string, any> = {}): Promise<T> => {
  // Filtrer les valeurs undefined/null/vides
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(filtered).toString();
  return request<T>('GET', `${path}${qs ? `?${qs}` : ''}`);
};

const post = <T = any>(path: string, body?: any, fd?: boolean): Promise<T> =>
  request<T>('POST', path, body, fd);

const put = <T = any>(path: string, body?: any, fd?: boolean): Promise<T> =>
  request<T>('PUT', path, body, fd);

const del = <T = any>(path: string): Promise<T> => request<T>('DELETE', path);

const patch = <T = any>(path: string, body: any): Promise<T> =>
  request<T>('PATCH', path, body);

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  stock: number;
  low_stock_threshold: number;
  sku?: string;
  barcode?: string;
  category_id: number;
  category?: Category;
  images?: ProductImage[];
  primary_image?: ProductImage;
  is_active: boolean;
  is_draft?: boolean;
  is_bio: boolean;
  is_local: boolean;
  is_eco: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_premium: boolean;
  is_featured: boolean;
  is_new: boolean;
  admin_label?: string;
  admin_label_discount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: number;
  path: string;
  url?: string;
  is_primary: boolean;
  sort_order?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  parent?: Category;
  color?: string;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  show_in_menu: boolean;
  image?: string;
  image_url?: string;
  children?: Category[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  loyalty_level: string;
  loyalty_points: number;
}

export interface Address {
  id: number;
  label: string;
  address: string;
  city: string;
  postal_code?: string;
  phone: string;
  is_default: boolean;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartSummary {
  items_count: number;
  subtotal: number;
  total: number;
}

export interface Order {
  id: number;
  reference: string;
  status: string;
  total: number;
  created_at: string;
}

// ─── Categories API (public) ─────────────────────────────────────────────────
export const categoryApi = {
  list: () => get<Category[]>('/categories'),
  tree: () => get<Category[]>('/categories/tree'),
  get: (slug: string) => get<Category>(`/categories/${slug}`),
  products: (slug: string, params?: Record<string, any>) =>
    get<PaginatedResponse<Product>>(`/categories/${slug}/products`, params),
};

// ─── Categories API (admin) ─────────────────────────────────────────────────

export const categoriesApi = {
  list: () => get<Category[]>('/admin/categories'),
  tree: () => get<Category[]>('/admin/categories/tree'),
  get: (id: number) => get<Category>(`/admin/categories/${id}`),
  create: (formData: FormData) => post<Category>('/admin/categories', formData, true),
  update: (id: number, formData: FormData) => {
    formData.append('_method', 'PUT');
    return post<Category>(`/admin/categories/${id}`, formData, true);
  },
  delete: (id: number) => del(`/admin/categories/${id}`),
  toggle: (id: number) => post(`/admin/categories/${id}/toggle`),
  reorder: (id: number, sortOrder: number) =>
    put(`/admin/categories/${id}/reorder`, { sort_order: sortOrder }),
};

// ─── Products API (public) ──────────────────────────────────────────────────
export const productApi = {
  list: (params?: Record<string, any>) => get<PaginatedResponse<Product>>('/products', params),
  get: (slug: string) => get<Product>(`/products/${slug}`),
  featured: () => get<Product[]>('/products/featured'),
  newArrivals: () => get<Product[]>('/products/new-arrivals'),
  bestsellers: () => get<Product[]>('/products/bestsellers'),
  premium: () => get<PaginatedResponse<Product>>('/products/premium'),
  related: (id: number) => get<Product[]>(`/products/${id}/related`),
  search: (q: string, params?: Record<string, any>) =>
    get<PaginatedResponse<Product>>('/search', { q, ...params }),
  suggestions: (q: string) => get<Product[]>('/search/suggestions', { q }),
};

// ─── Products API (admin) ───────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, any>) =>
    get<PaginatedResponse<Product>>('/admin/products', params),
  get: (id: number) => get<Product>(`/admin/products/${id}`),
  create: (formData: FormData) => post<Product>('/admin/products', formData, true),
  update: (id: number, data: Partial<Product>) => put<Product>(`/admin/products/${id}`, data),
  updateWithFormData: (id: number, formData: FormData) => {
    formData.append('_method', 'PUT');
    return post<Product>(`/admin/products/${id}`, formData, true);
  },
  delete: (id: number) => del(`/admin/products/${id}`),
  toggle: (id: number) => post(`/admin/products/${id}/toggle`),
  setLabel: (id: number, label: string, discount?: number) =>
    post(`/admin/products/${id}/label`, { label, discount }),
  updateStock: (id: number, stock: number, reason?: string) =>
    put(`/admin/products/${id}/stock`, { stock, reason }),
  duplicate: (id: number) => post(`/admin/products/${id}/duplicate`),
  lowStock: () => get<Product[]>('/admin/products/low-stock'),
  outOfStock: () => get<Product[]>('/admin/products/out-of-stock'),
  export: () => {
    const token = localStorage.getItem('auth_token');
    window.open(`${BASE_URL}/admin/products/export?token=${token}`, '_blank');
  },
  import: (formData: FormData) => post('/admin/products/import', formData, true),
  uploadImages: (id: number, formData: FormData) =>
    post(`/admin/products/${id}/images`, formData, true),
  deleteImage: (id: number, imgId: number) => del(`/admin/products/${id}/images/${imgId}`),
};

// ─── Admin API (aggregator) ─────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  kpis: () => get('/admin/dashboard/kpis'),
  alerts: () => get('/admin/dashboard/alerts'),
  products: productsApi,
  categories: categoriesApi,
  orders: {
    list: (params?: Record<string, any>) => get('/admin/orders', params),
    get: (id: number) => get(`/admin/orders/${id}`),
    updateStatus: (id: number, status: string) => put(`/admin/orders/${id}/status`, { status }),
    assignDriver: (id: number, driverId: number) =>
      post(`/admin/orders/${id}/assign-driver`, { driver_id: driverId }),
  },
  users: {
    list: (params?: Record<string, any>) => get('/admin/users', params),
    get: (id: number) => get(`/admin/users/${id}`),
    update: (id: number, data: any) => put(`/admin/users/${id}`, data),
    ban: (id: number, reason: string) => post(`/admin/users/${id}/ban`, { reason }),
    unban: (id: number) => post(`/admin/users/${id}/unban`),
    updateRole: (id: number, role: string) => put(`/admin/users/${id}/role`, { role }),
  },
  stats: {
    sales: (from?: string, to?: string) => get('/admin/stats/sales', { from, to }),
    revenue: (year?: number) => get('/admin/stats/revenue', { year }),
    products: () => get('/admin/stats/products'),
    users: () => get('/admin/stats/users'),
  },
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    post<{ token: string; user: User }>('/auth/login', data),
  register: (data: any) => post('/auth/register', data),
  logout: () => post('/auth/logout'),
  me: () => get<User>('/auth/me'),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => post('/auth/reset-password', data),
  refresh: () => post<{ token: string }>('/auth/refresh'),
  verifyTwoFactor: (data: { user_id: number; code: string }) =>
    post<{ token: string; user: User }>('/auth/two-factor/verify', data),
};

// ─── Profile API ─────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => get<User>('/profile'),
  update: (data: Partial<User>) => put('/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return post('/profile/avatar', formData, true);
  },
  changePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => put('/profile/password', data),
  consumptionReport: () => get('/my-stats/consumption'),
  favoriteProducts: () => get<Product[]>('/my-stats/favorite-products'),
  monthlyStats: () => get('/my-stats/monthly'),
};

// ─── Address API ─────────────────────────────────────────────────────────────
export const addressApi = {
  list: () => get<Address[]>('/addresses'),
  create: (data: Partial<Address>) => post<Address>('/addresses', data),
  update: (id: number, data: Partial<Address>) => put<Address>(`/addresses/${id}`, data),
  delete: (id: number) => del(`/addresses/${id}`),
  setDefault: (id: number) => put(`/addresses/${id}/default`),
};

// ─── Cart API ────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => get<{ cart: Cart; summary: CartSummary }>('/cart'),
  add: (productId: number, quantity: number, size?: string, color?: string) =>
    post('/cart/add', { product_id: productId, quantity, size, color }),
  updateItem: (id: number, quantity: number) => put(`/cart/item/${id}`, { quantity }),
  removeItem: (id: number) => del(`/cart/item/${id}`),
  clear: () => del('/cart'),
  applyCoupon: (code: string) => post('/cart/coupon/apply', { code }),
  removeCoupon: () => del('/cart/coupon'),
};

// ─── Order API ───────────────────────────────────────────────────────────────
export const orderApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    get<PaginatedResponse<Order>>('/orders', params),
  get: (id: number) => get<Order>(`/orders/${id}`),
  create: (data: any) => post<{ order: Order; message: string }>('/orders', data),
  cancel: (id: number, reason?: string) => post(`/orders/${id}/cancel`, { reason }),
  reorder: (id: number) => post(`/orders/${id}/reorder`),
  trackDelivery: (orderId: number) => get(`/deliveries/${orderId}/track`),
};

// ─── Subscription API ────────────────────────────────────────────────────────
export const subscriptionApi = {
  list: () => get('/subscriptions'),
  get: (id: number) => get(`/subscriptions/${id}`),
  create: (data: any) => post('/subscriptions', data),
  update: (id: number, data: any) => put(`/subscriptions/${id}`, data),
  suspend: (id: number, until?: string) => post(`/subscriptions/${id}/suspend`, { until }),
  resume: (id: number) => post(`/subscriptions/${id}/resume`),
  cancel: (id: number, reason?: string) => del(`/subscriptions/${id}`),
  history: (id: number, params?: any) => get(`/subscriptions/${id}/history`, params),
};

// ─── Loyalty API ─────────────────────────────────────────────────────────────
export const loyaltyApi = {
  dashboard: () => get('/loyalty'),
  transactions: (params?: any) => get('/loyalty/transactions', params),
  badges: () => get('/loyalty/badges'),
  redeem: (points: number, type: string) => post('/loyalty/redeem', { points, type }),
  leaderboard: () => get('/loyalty/leaderboard'),
};

// ─── Game API ────────────────────────────────────────────────────────────────
export const gameApi = {
  list: () => get('/games'),
  get: (id: number) => get(`/games/${id}`),
  winners: () => get('/games/winners'),
  register: (id: number) => post(`/games/${id}/register`),
  revealScratchCard: () => post('/games/scratch-card/reveal'),
  spinWheel: (wheelNumber: number) => post('/games/wheel/spin', { wheel_number: wheelNumber }),
  answerQuiz: (gameId: number, answers: any, timeTaken?: number) =>
    post('/games/quiz/answer', { game_id: gameId, answers, time_taken: timeTaken }),
  guessPrix: (gameId: number, productId: number, guessedPrice: number) =>
    post('/games/juste-prix/guess', {
      game_id: gameId,
      product_id: productId,
      guessed_price: guessedPrice,
    }),
  vote: (id: number, candidateId: number, battleType: string) =>
    post(`/games/${id}/vote`, { candidate_id: candidateId, battle_type: battleType }),
  myParticipations: () => get('/games/my-participations'),
};

// ─── Charity API ─────────────────────────────────────────────────────────────
export const charityApi = {
  myDonations: (params?: any) => get('/charity/donations', params),
  donateVoucher: (amount: number, paymentMethod: string) =>
    post('/charity/donate/voucher', { amount, payment_method: paymentMethod }),
  donateProduct: (productId: number, quantity: number) =>
    post('/charity/donate/product', { product_id: productId, quantity }),
  checkVoucher: (code: string) => get(`/charity/vouchers/check/${code}`),
  impact: () => get('/charity/impact'),
};

// ─── Promotion API ───────────────────────────────────────────────────────────
export const promotionApi = {
  list: (params?: any) => get('/promotions', params),
  flash: () => get('/promotions/flash'),
  soldes: () => get('/promotions/soldes'),
  destockage: () => get('/promotions/destockage'),
};

// ─── Wishlist API ────────────────────────────────────────────────────────────
export const wishlistApi = {
  list: () => get('/wishlist'),
  add: (productId: number) => post('/wishlist/add', { product_id: productId }),
  remove: (productId: number) => del(`/wishlist/${productId}`),
  moveToCart: (productIds: number[]) => post('/wishlist/to-cart', { product_ids: productIds }),
};

// ─── Review API ──────────────────────────────────────────────────────────────
export const reviewApi = {
  list: (productId: number, params?: any) => get(`/products/${productId}/reviews`, params),
  create: (
    productId: number,
    data: { rating: number; comment?: string; order_id?: number }
  ) => post(`/products/${productId}/reviews`, data),
  update: (id: number, data: any) => put(`/reviews/${id}`, data),
  delete: (id: number) => del(`/reviews/${id}`),
};

// ─── Partner API ─────────────────────────────────────────────────────────────
export const partnerApi = {
  list: () => get('/partners'),
  get: (id: number) => get(`/partners/${id}`),
  apply: (formData: FormData) => post('/partners/apply', formData, true),
};

// ─── Delegate Shopping API ───────────────────────────────────────────────────
export const delegateShoppingApi = {
  create: (formData: FormData) => post('/delegate-shopping', formData, true),
  list: () => get('/delegate-shopping'),
  get: (id: number) => get(`/delegate-shopping/${id}`),
};

// ─── Advertisement API ───────────────────────────────────────────────────────
export const advertisementApi = {
  list: (position?: string, page?: string) => get('/advertisements', { position, page }),
  registerClick: (id: number) => get(`/advertisements/${id}/click`),
};

// ─── Recipe API ──────────────────────────────────────────────────────────────
export const recipeApi = {
  list: (params?: any) => get('/recipes', params),
  get: (id: number) => get(`/recipes/${id}`),
};

export default {
  authApi,
  profileApi,
  addressApi,
  categoryApi,
  categoriesApi,
  productApi,
  productsApi,
  adminApi,
  cartApi,
  orderApi,
  subscriptionApi,
  loyaltyApi,
  gameApi,
  charityApi,
  promotionApi,
  wishlistApi,
  reviewApi,
  partnerApi,
  delegateShoppingApi,
  advertisementApi,
  recipeApi,
};