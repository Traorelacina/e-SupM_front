// src/api/index.ts

export const STORAGE_URL = '/storage/';

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
    'X-Requested-With': 'XMLHttpRequest',
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
    credentials: 'include',
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

const del = async <T = any>(path: string, body?: any): Promise<T> => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
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
};

const patch = <T = any>(path: string, body: any): Promise<T> =>
  request<T>('PATCH', path, body);

// ─── Types existants ──────────────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  category_id: number;
  category?: Pick<Category, 'id' | 'name' | 'color'>;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedProductCategories {
  id: number;
  name: string;
  color?: string;
  product_categories: ProductCategory[];
}

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
  product_category_id?: number | null;
  product_category?: ProductCategory;
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
  thumb_url?: string | null;
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
  product_categories?: ProductCategory[];
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
  session_id?: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  line_total: number;
  size?: string;
  color?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    stock: number;
    is_active: boolean;
    slug?: string;
    append_primary_image_url?: string | null;
    primary_image_url?: string | null;
    primary_image?: { path: string; url?: string };
    category?: { id: number; name: string; slug: string; color?: string };
  };
}

export interface CartSummary {
  items_count: number;
  subtotal: number;
  total: number;
  delivery_fee: number;
  coupon_code?: string | null;
  coupon_discount: number;
}

export interface Order {
  id: number;
  reference: string;
  status: string;
  total: number;
  created_at: string;
}

export interface FoodBoxItem {
  id: number;
  food_box_id: number;
  product_id: number;
  quantity: number;
  sort_order: number;
  product?: Product & { thumb_url?: string | null };
  created_at?: string;
}

export interface FoodBox {
  id: number;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  image?: string;
  image_url?: string | null;
  price: number;
  compare_price?: number | null;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  is_active: boolean;
  is_featured: boolean;
  max_subscribers?: number | null;
  subscribers_count: number;
  sort_order: number;
  badge_label?: string | null;
  badge_color?: string | null;
  items?: FoodBoxItem[];
  discount_percent?: number | null;
  is_full?: boolean;
  frequency_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CharityDonation {
  id: number;
  user?: { id: number; name: string; email: string; phone?: string };
  product?: { id: number; name: string; price: number };
  type: 'voucher' | 'product';
  amount: number;
  quantity?: number;
  payment_method?: string;
  status: 'pending' | 'confirmed' | 'distributed' | 'cancelled';
  scratch_card_unlocked: boolean;
  loyalty_points_earned: number;
  admin_note?: string;
  created_at: string;
  vouchers?: { code: string; is_used: boolean; amount: number }[];
}

export interface CharityVoucher {
  id: number;
  code: string;
  amount: number;
  is_used: boolean;
  used_at?: string;
  expires_at: string;
  donation?: { user?: { name: string; email: string } };
}

export interface CharityImpact {
  total_donated: number;
  donations_count: number;
  products_gifted: number;
  message?: string;
}

export interface CharityDashboardStats {
  total_donated: number;
  total_donated_fcfa: string;
  donations_count: number;
  pending_count: number;
  distributed_count: number;
  vouchers_total: number;
  vouchers_used: number;
  vouchers_pending: number;
  products_gifted: number;
  scratch_cards_unlocked: number;
  donors_count: number;
}

export interface SelectiveSubscriptionItem {
  id: number;
  subscription_id: number;
  product_id: number;
  quantity: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  line_total: number;
  product?: Product & { in_stock?: boolean };
}

export interface SelectiveSubscription {
  id: number;
  name: string;
  status: 'active' | 'suspended' | 'cancelled';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  delivery_type: 'home' | 'click_collect' | 'locker';
  delivery_day?: number;
  delivery_week_of_month?: number;
  payment_method: 'auto' | 'manual';
  discount_percent: number;
  subtotal: number;
  total: number;
  next_delivery_at: string | null;
  suspended_until: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  items_count: number;
  active_items_count: number;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string; phone: string | null };
  address?: { id: number; full_label: string };
  items?: SelectiveSubscriptionItem[];
  orders?: Order[];
}

export interface SelectiveSubscriptionStats {
  total: number;
  active: number;
  suspended: number;
  cancelled: number;
  by_frequency?: Record<string, number>;
  by_payment?: Record<string, number>;
  revenue_monthly?: number;
  upcoming_3days?: number;
}

export interface Subscription {
  id: number;
  name: string;
  type: 'standard' | 'custom';
  preset_type?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  delivery_type: 'home' | 'click_collect' | 'locker';
  delivery_day?: number;
  delivery_week_of_month?: number;
  payment_method: 'auto' | 'manual';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  discount_percent: number;
  subtotal: number;
  total: number;
  next_delivery_at?: string;
  suspended_until?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  user?: User;
  items?: SubscriptionItem[];
  orders?: Order[];
  address?: Address;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionItem {
  id: number;
  subscription_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

// ==================== CONSEILS (Nos Conseils) ====================

// ─── Types pour les conseils ─────────────────────────────────────

export type ConseilCategory = 'nutrition' | 'astuce' | 'recette';
export type ConseilContentType = 'text' | 'video' | 'image' | 'mixed';
export type ConseilDifficulty = 'facile' | 'moyen' | 'difficile';

export interface ConseilIngredient {
  name: string;
  qty: string;
  unit: string;
}

export interface ConseilAuthor {
  id: number;
  name: string;
  email?: string;
}

export interface Conseil {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: ConseilCategory;
  content_type: ConseilContentType;
  body: string | null;
  video_url: string | null;
  video_provider: 'youtube' | 'vimeo' | 'local' | null;
  video_duration: string | null;
  youtube_id?: string | null;
  thumbnail: string | null;
  thumbnail_url?: string;
  gallery: string[] | null;
  tags: string | null;
  tags_array?: string[];
  reading_time: string | null;
  views: number;
  likes: number;
  recipe_ingredients: ConseilIngredient[] | null;
  recipe_prep_time: number | null;
  recipe_cook_time: number | null;
  recipe_servings: number | null;
  recipe_difficulty: ConseilDifficulty | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  author_id: number;
  author?: ConseilAuthor;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ConseilPaginatedResponse {
  data: Conseil[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface ConseilStatsResponse {
  all: number;
  nutrition: number;
  astuce: number;
  recette: number;
}

// ─── API Publique pour les Conseils ───────────────────────────────

export const conseilApi = {
  // Liste paginée des conseils (avec filtres)
  list: (params?: {
    category?: ConseilCategory;
    search?: string;
    sort?: 'recent' | 'popular' | 'liked';
    page?: number;
    per_page?: number;
  }) => get<{ data: ConseilPaginatedResponse; featured?: Conseil[] }>('/conseils', params),

  // Détail d’un conseil par slug
  get: (slug: string) => get<{ data: Conseil; related?: Conseil[] }>(`/conseils/${slug}`),

  // Like / unlike
  like: (conseilId: number) => post<{ likes: number }>(`/conseils/${conseilId}/like`),

  // Statistiques des catégories (pour les onglets)
  categoryStats: () => get<{ data: ConseilStatsResponse }>('/conseils/categories/stats'),
};

// ─── API Admin pour les Conseils ─────────────────────────────────

export const adminConseilApi = {
  // Liste avec filtres et pagination (inchangée)
  list: (params?: {
    search?: string;
    category?: ConseilCategory;
    is_published?: boolean;
    page?: number;
    per_page?: number;
  }) =>
    get<{
      data: {
        data: Conseil[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
      stats: {
        total: number;
        published: number;
        drafts: number;
        featured: number;
      };
    }>('/admin/conseils', params),

  // ✓ Création : envoi JSON (pas FormData)
  create: (data: any) => post<{ data: Conseil; message: string }>('/admin/conseils', data),

  // Récupération par ID
  get: (id: number) => get<{ data: Conseil }>(`/admin/conseils/${id}`),

  // ✓ Mise à jour : envoi JSON via PUT
  update: (id: number, data: any) => put<{ data: Conseil; message: string }>(`/admin/conseils/${id}`, data),

  // Suppression
  delete: (id: number) => del<{ message: string }>(`/admin/conseils/${id}`),

  // Actions rapides (inchangées)
  togglePublish: (id: number) =>
    patch<{ data: Conseil; message: string }>(`/admin/conseils/${id}/toggle-publish`, {}),

  toggleFeatured: (id: number) =>
    patch<{ data: Conseil; message: string }>(`/admin/conseils/${id}/toggle-featured`, {}),

  // ✓ Upload média : seul endpoint multipart
  uploadMedia: (file: File, type: 'thumbnail' | 'gallery' = 'thumbnail') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    return post<{ path: string; url: string }>('/admin/conseils/upload-media', fd, true);
  },

  // Suppression média
  deleteMedia: (path: string) => del<{ message: string }>('/admin/conseils/delete-media', { path }),
};
// ─── APIS existantes (inchangées) ─────────────────────────────────────────

export const categoryApi = {
  list: () => get<Category[]>('/categories'),
  tree: () => get<Category[]>('/categories/tree'),
  get: (slug: string) => get<Category>(`/categories/${slug}`),
  products: (slug: string, params?: Record<string, any>) =>
    get<PaginatedResponse<Product>>(`/categories/${slug}/products`, params),
};

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

export const productCategoriesApi = {
  list: (params?: { category_id?: number; active?: boolean; q?: string }) =>
    get<{ success: boolean; data: ProductCategory[] }>('/admin/product-categories', params as any),
  grouped: () =>
    get<{ success: boolean; data: GroupedProductCategories[] }>('/admin/product-categories/grouped'),
  byRayon: (categoryId: number) =>
    get<{ success: boolean; data: ProductCategory[]; rayon: { id: number; name: string } }>(
      `/admin/product-categories/by-rayon/${categoryId}`
    ),
  get: (id: number) =>
    get<{ success: boolean; data: ProductCategory }>(`/admin/product-categories/${id}`),
  create: (formData: FormData) =>
    post<{ success: boolean; message: string; data: ProductCategory }>(
      '/admin/product-categories',
      formData,
      true
    ),
  update: (id: number, formData: FormData) => {
    formData.append('_method', 'PUT');
    return post<{ success: boolean; message: string; data: ProductCategory }>(
      `/admin/product-categories/${id}`,
      formData,
      true
    );
  },
  delete: (id: number) =>
    del<{ success: boolean; message: string }>(`/admin/product-categories/${id}`),
  toggle: (id: number) =>
    post<{ success: boolean; is_active: boolean; message: string }>(
      `/admin/product-categories/${id}/toggle`
    ),
  reorder: (items: { id: number; sort_order: number }[]) =>
    post<{ success: boolean; message: string }>('/admin/product-categories/reorder', { items }),
};

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

export const publicFoodBoxApi = {
  list: (params?: { featured?: boolean; frequency?: string; limit?: number }) =>
    get<{ success: boolean; data: FoodBox[]; meta?: any }>('/food-boxes', params as any),
  featured: (limit?: number) =>
    get<{ success: boolean; data: FoodBox[] }>('/food-boxes/featured', { limit }),
  get: (identifier: string | number) =>
    get<{ success: boolean; data: FoodBox }>(`/food-boxes/${identifier}`),
  search: (query: string) =>
    get<{ success: boolean; data: FoodBox[]; meta: { query: string; total: number } }>(
      '/food-boxes/search',
      { q: query }
    ),
  frequencies: () =>
    get<{
      success: boolean;
      data: {
        weekly: { label: string; description: string; delivery_days: number };
        biweekly: { label: string; description: string; delivery_days: number };
        monthly: { label: string; description: string; delivery_days: number };
      };
    }>('/food-boxes/frequencies'),
  checkAvailability: (id: number) =>
    get<{
      success: boolean;
      data: {
        is_available: boolean;
        is_full: boolean;
        subscribers_count: number;
        max_subscribers: number | null;
        available_spots: number | null;
      };
    }>(`/food-boxes/${id}/availability`),
};

export const foodBoxesApi = {
  list: (params?: { q?: string; active?: boolean; featured?: boolean; frequency?: string }) =>
    get<{ success: boolean; data: FoodBox[] }>('/admin/food-boxes', params as any),
  get: (id: number) => get<{ success: boolean; data: FoodBox }>(`/admin/food-boxes/${id}`),
  create: (formData: FormData) =>
    post<{ success: boolean; message: string; data: FoodBox }>('/admin/food-boxes', formData, true),
  update: (id: number, formData: FormData) => {
    formData.append('_method', 'PUT');
    return post<{ success: boolean; message: string; data: FoodBox }>(
      `/admin/food-boxes/${id}`,
      formData,
      true
    );
  },
  delete: (id: number) => del<{ success: boolean; message: string }>(`/admin/food-boxes/${id}`),
  toggle: (id: number) =>
    post<{ success: boolean; is_active: boolean; message: string; data: FoodBox }>(
      `/admin/food-boxes/${id}/toggle`
    ),
  duplicate: (id: number) =>
    post<{ success: boolean; message: string; data: FoodBox }>(`/admin/food-boxes/${id}/duplicate`),
  searchProducts: (params: { q?: string; category_id?: number }) =>
    get<{ success: boolean; data: (Product & { thumb_url?: string | null })[] }>(
      '/admin/food-boxes/products/search',
      params as any
    ),
  addItem: (id: number, data: { product_id: number; quantity: number; sort_order?: number }) =>
    post<{ success: boolean; message: string; data: FoodBoxItem }>(
      `/admin/food-boxes/${id}/items`,
      data
    ),
  removeItem: (id: number, itemId: number) =>
    del<{ success: boolean; message: string }>(`/admin/food-boxes/${id}/items/${itemId}`),
};

export const adminCharityApi = {
  dashboard: () =>
    get<{
      success: boolean;
      stats: CharityDashboardStats;
      monthly: any[];
      by_type: any[];
      top_donors: any[];
    }>('/admin/charity/dashboard'),
  donations: (params?: {
    status?: string;
    type?: string;
    q?: string;
    date_from?: string;
    date_to?: string;
    scratch_unlocked?: boolean;
    min_amount?: number;
    page?: number;
  }) =>
    get<{
      success: boolean;
      data: { data: CharityDonation[]; current_page: number; last_page: number; total: number };
    }>('/admin/charity/donations', params as any),
  showDonation: (id: number) =>
    get<{ success: boolean; data: CharityDonation }>(`/admin/charity/donations/${id}`),
  updateStatus: (id: number, data: { status: string; note?: string }) =>
    put<{ success: boolean; message: string; data: CharityDonation }>(
      `/admin/charity/donations/${id}/status`,
      data
    ),
  bulkUpdateStatus: (data: { ids: number[]; status: string }) =>
    post<{ success: boolean; message: string }>('/admin/charity/donations/bulk-update', data),
  triggerScratchCard: (id: number) =>
    post<{ success: boolean; message: string }>(`/admin/charity/donations/${id}/scratch-card`),
  exportDonations: (params?: { status?: string; type?: string }) => {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams(params as any).toString();
    window.open(`${BASE_URL}/admin/charity/donations/export?token=${token}&${queryParams}`, '_blank');
  },
  vouchers: (params?: { q?: string; is_used?: string; expired?: string; min_amount?: number; page?: number }) =>
    get<{
      success: boolean;
      data: { data: CharityVoucher[]; current_page: number; last_page: number; total: number };
    }>('/admin/charity/vouchers', params as any),
  createVoucher: (data: { amount: number; expires_at?: string; note?: string }) =>
    post<{ success: boolean; message: string; data: CharityVoucher }>('/admin/charity/vouchers', data),
  useVoucher: (code: string, note?: string) =>
    post<{ success: boolean; message: string; data: CharityVoucher }>(
      `/admin/charity/vouchers/${code}/use`,
      { note }
    ),
};

export const selectiveSubscriptionApi = {
  list: () => get<{ success: boolean; data: SelectiveSubscription[]; meta?: any }>('/selective-subscriptions'),
  get: (id: number) => get<{ success: boolean; data: SelectiveSubscription }>(`/selective-subscriptions/${id}`),
  create: (data: any) =>
    post<{ success: boolean; message: string; subscription: SelectiveSubscription }>(
      '/selective-subscriptions',
      data
    ),
  update: (id: number, data: any) =>
    put<{ success: boolean; message: string; subscription: SelectiveSubscription }>(
      `/selective-subscriptions/${id}`,
      data
    ),
  addItem: (id: number, data: { product_id: number; quantity: number; is_active?: boolean }) =>
    post<{ success: boolean; message: string; item: any }>(`/selective-subscriptions/${id}/items`, data),
  updateItem: (
    id: number,
    itemId: number,
    data: { quantity?: number; is_active?: boolean }
  ) =>
    put<{
      success: boolean;
      message: string;
      item: any;
      totals: { subtotal: number; total: number };
    }>(`/selective-subscriptions/${id}/items/${itemId}`, data),
  toggleItem: (id: number, itemId: number) =>
    patch<{
      success: boolean;
      message: string;
      is_active: boolean;
      totals: { subtotal: number; total: number };
    }>(`/selective-subscriptions/${id}/items/${itemId}/toggle`, {}),
  removeItem: (id: number, itemId: number) =>
    del<{
      success: boolean;
      message: string;
      totals: { subtotal: number; total: number };
    }>(`/selective-subscriptions/${id}/items/${itemId}`),
  syncItems: (id: number, items: Array<{ product_id: number; quantity: number; is_active?: boolean }>) =>
    put<{ success: boolean; message: string; subscription: SelectiveSubscription }>(
      `/selective-subscriptions/${id}/sync-items`,
      { items }
    ),
  suspend: (id: number, until?: string) =>
    post<{ success: boolean; message: string }>(`/selective-subscriptions/${id}/suspend`, { until }),
  resume: (id: number) => post<{ success: boolean; message: string }>(`/selective-subscriptions/${id}/resume`),
  cancel: (id: number, reason?: string) => del<{ success: boolean; message: string }>(`/selective-subscriptions/${id}`),
  history: (id: number, params?: { page?: number }) =>
    get<{ success: boolean; data: PaginatedResponse<Order> }>(`/selective-subscriptions/${id}/history`, params),
};

export const adminSelectiveSubscriptionApi = {
  list: (params?: {
    status?: string;
    frequency?: string;
    payment_method?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) =>
    get<{
      success: boolean;
      data: SelectiveSubscription[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
      stats: SelectiveSubscriptionStats;
    }>('/admin/selective-subscriptions', params as any),
  show: (id: number) => get<{ success: boolean; data: SelectiveSubscription }>(`/admin/selective-subscriptions/${id}`),
  update: (
    id: number,
    data: {
      status?: string;
      frequency?: string;
      next_delivery_at?: string;
      payment_method?: string;
      discount_percent?: number;
      notes?: string;
    }
  ) =>
    put<{ success: boolean; message: string; subscription: SelectiveSubscription }>(
      `/admin/selective-subscriptions/${id}`,
      data
    ),
  suspend: (id: number) => post<{ success: boolean; message: string }>(`/admin/selective-subscriptions/${id}/suspend`),
  resume: (id: number) => post<{ success: boolean; message: string }>(`/admin/selective-subscriptions/${id}/resume`),
  processManually: (id: number) =>
    post<{
      success: boolean;
      message: string;
      order?: { id: number; reference: string; total: number; created_at: string };
    }>(`/admin/selective-subscriptions/${id}/process`),
  upcoming: (params?: { days?: number }) =>
    get<{ success: boolean; data: any[]; meta: { days_ahead: number; total: number } }>(
      '/admin/selective-subscriptions/upcoming',
      params
    ),
  stats: () => get<{ success: boolean; data: SelectiveSubscriptionStats }>('/admin/selective-subscriptions/stats'),
};

export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  kpis: () => get('/admin/dashboard/kpis'),
  alerts: () => get('/admin/dashboard/alerts'),
  products: productsApi,
  categories: categoriesApi,
  productCategories: productCategoriesApi,
  foodBoxes: foodBoxesApi,
  charity: adminCharityApi,
  selectiveSubscriptions: adminSelectiveSubscriptionApi,
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

export const addressApi = {
  list: () => get<Address[]>('/addresses'),
  create: (data: Partial<Address>) => post<Address>('/addresses', data),
  update: (id: number, data: Partial<Address>) => put<Address>(`/addresses/${id}`, data),
  delete: (id: number) => del(`/addresses/${id}`),
  setDefault: (id: number) => put(`/addresses/${id}/default`),
};

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

export const orderApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    get<PaginatedResponse<Order>>('/orders', params),
  get: (id: number) => get<Order>(`/orders/${id}`),
  create: (data: any) => post<{ order: Order; message: string }>('/orders', data),
  cancel: (id: number, reason?: string) => post(`/orders/${id}/cancel`, { reason }),
  reorder: (id: number) => post(`/orders/${id}/reorder`),
  trackDelivery: (orderId: number) => get(`/deliveries/${orderId}/track`),
};

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

export const adminSubscriptionApi = {
  index: (params?: { status?: string; page?: number }) =>
    get<PaginatedResponse<Subscription>>('/admin/subscriptions', params),
  show: (id: number) => get<Subscription>(`/admin/subscriptions/${id}`),
  update: (id: number, data: any) => put(`/admin/subscriptions/${id}`, data),
  suspend: (id: number) => post(`/admin/subscriptions/${id}/suspend`),
  resume: (id: number) => post(`/admin/subscriptions/${id}/resume`),
  cancel: (id: number) => del(`/admin/subscriptions/${id}`),
  processManually: (id: number) => post(`/admin/subscriptions/${id}/process`),
  upcoming: () => get<Subscription[]>('/admin/subscriptions/upcoming'),
};

export const loyaltyApi = {
  dashboard: () => get('/loyalty'),
  transactions: (params?: any) => get('/loyalty/transactions', params),
  badges: () => get('/loyalty/badges'),
  redeem: (points: number, type: string) => post('/loyalty/redeem', { points, type }),
  leaderboard: () => get('/loyalty/leaderboard'),
};

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

export const charityApi = {
  myDonations: (params?: any) => get('/charity/donations', params),
  donateVoucher: (data: { amount: number; payment_method: string }) =>
    post('/charity/donate/voucher', data),
  donateProduct: (data: { product_id: number; quantity: number }) =>
    post('/charity/donate/product', data),
  checkVoucher: (code: string) => get(`/charity/vouchers/check/${code}`),
  impact: () => get<CharityImpact>('/charity/impact'),
};

export const promotionApi = {
  list: (params?: any) => get('/promotions', params),
  flash: () => get('/promotions/flash'),
  soldes: () => get('/promotions/soldes'),
  destockage: () => get('/promotions/destockage'),
};

export const wishlistApi = {
  list: () => get('/wishlist'),
  add: (productId: number) => post('/wishlist/add', { product_id: productId }),
  remove: (productId: number) => del(`/wishlist/${productId}`),
  moveToCart: (productIds: number[]) => post('/wishlist/to-cart', { product_ids: productIds }),
};

export const reviewApi = {
  list: (productId: number, params?: any) => get(`/products/${productId}/reviews`, params),
  create: (productId: number, data: { rating: number; comment?: string; order_id?: number }) =>
    post(`/products/${productId}/reviews`, data),
  update: (id: number, data: any) => put(`/reviews/${id}`, data),
  delete: (id: number) => del(`/reviews/${id}`),
};

export const partnerApi = {
  list: () => get('/partners'),
  get: (id: number) => get(`/partners/${id}`),
  apply: (formData: FormData) => post('/partners/apply', formData, true),
};

export const delegateShoppingApi = {
  create: (formData: FormData) => post('/delegate-shopping', formData, true),
  list: () => get('/delegate-shopping'),
  get: (id: number) => get(`/delegate-shopping/${id}`),
};

export const advertisementApi = {
  list: (position?: string, page?: string) => get('/advertisements', { position, page }),
  registerClick: (id: number) => get(`/advertisements/${id}/click`),
};

export const recipeApi = {
  list: (params?: any) => get('/recipes', params),
  get: (id: number) => get(`/recipes/${id}`),
};

// ─── Export principal ────────────────────────────────────────────────────────

export default {
  authApi,
  profileApi,
  addressApi,
  categoryApi,
  categoriesApi,
  productCategoriesApi,
  productApi,
  productsApi,
  foodBoxesApi,
  publicFoodBoxApi,
  adminApi,
  adminCharityApi,
  selectiveSubscriptionApi,
  adminSelectiveSubscriptionApi,
  cartApi,
  orderApi,
  subscriptionApi,
  adminSubscriptionApi,
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
  conseilApi,          // public
  adminConseilApi,     // admin
};