import { useState, useEffect, useCallback } from 'react';
import { adminApi, categoryApi, productApi } from '@/api';
import type { Product, Category, PaginatedResponse } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ProductFilters {
  q?: string;
  category_id?: string | number;
  status?: 'active' | 'inactive';
  low_stock?: boolean;
  out_of_stock?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface ProductsState {
  data: Product[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface UseProductsReturn {
  // State
  products: ProductsState | null;
  loading: boolean;
  error: string | null;
  categories: Category[];
  flatCategories: FlatCategory[];
  
  // Filters
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  updateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  
  // Pagination
  page: number;
  setPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  toggleProduct: (id: number) => Promise<void>;
  duplicateProduct: (id: number) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  updateStock: (id: number, stock: number, reason?: string) => Promise<void>;
  updateLabel: (id: number, label: string, discount?: number) => Promise<void>;
  exportProducts: () => void;
  
  // Selection
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Loading states
  isToggling: number | null;
  isDeleting: number | null;
  isDuplicating: number | null;
}

interface FlatCategory extends Category {
  _depth: number;
}

// ─── Helper: flatten categories ────────────────────────────────────────────
function flattenCategories(cats: Category[], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  cats.forEach(cat => {
    result.push({ ...cat, _depth: depth });
    if ((cat as any).children?.length) {
      result.push(...flattenCategories((cat as any).children, depth + 1));
    }
  });
  return result;
}

// ─── Hook: Search suggestions ──────────────────────────────────────────────
export function useSearchSuggestions(query: string, limit: number = 5) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setData([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productApi.suggestions(query);
        const suggestions = response.data || response;
        setData(suggestions.slice(0, limit));
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la recherche');
        console.error('Search suggestions error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, limit]);

  return { data, isLoading, error };
}

// ─── Hook: Search products ─────────────────────────────────────────────────
export function useSearchProducts() {
  const [results, setResults] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: ProductFilters) => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.search(query, filters);
      setResults(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

// ─── Hook principal: useProducts ───────────────────────────────────────────
export function useProducts(initialFilters?: ProductFilters): UseProductsReturn {
  // State
  const [products, setProducts] = useState<ProductsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 20,
    ...initialFilters,
  });
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Loading states for actions
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<number | null>(null);

  // Computed
  const flatCategories = flattenCategories(categories);
  const hasFilters = !!(filters.q || filters.category_id || filters.status || filters.low_stock || filters.out_of_stock);

  // ── Filter handlers ──────────────────────────────────────────────────────
  const updateFilter = useCallback(<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      per_page: filters.per_page,
    });
    setPage(1);
  }, [filters.per_page]);

  // ── Pagination handlers ─────────────────────────────────────────────────
  const goToNextPage = useCallback(() => {
    if (products && products.current_page < products.last_page) {
      const nextPage = products.current_page + 1;
      setPage(nextPage);
      setFilters(prev => ({ ...prev, page: nextPage }));
    }
  }, [products]);

  const goToPrevPage = useCallback(() => {
    if (products && products.current_page > 1) {
      const prevPage = products.current_page - 1;
      setPage(prevPage);
      setFilters(prev => ({ ...prev, page: prevPage }));
    }
  }, [products]);

  // ── Fetch products ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: filters.page || page,
        per_page: filters.per_page || 20,
      };
      
      if (filters.q) params.q = filters.q;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.low_stock) params.low_stock = true;
      if (filters.out_of_stock) params.out_of_stock = true;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_direction) params.sort_direction = filters.sort_direction;
      
      const response = await adminApi.products.list(params);
      
      setProducts({
        data: response.data.data || response.data || [],
        current_page: response.data.current_page || response.current_page || 1,
        last_page: response.data.last_page || response.last_page || 1,
        total: response.data.total || response.total || 0,
        per_page: response.data.per_page || response.per_page || 20,
        low_stock_count: response.data.low_stock_count || response.low_stock_count || 0,
        out_of_stock_count: response.data.out_of_stock_count || response.out_of_stock_count || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // ── Fetch categories ────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryApi.tree();
      setCategories(response.data || response);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
    }
  }, []);

  // ── Toggle product active status ────────────────────────────────────────
  const toggleProduct = useCallback(async (id: number) => {
    setIsToggling(id);
    try {
      await adminApi.products.toggle(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de statut');
      console.error('Toggle product error:', err);
    } finally {
      setIsToggling(null);
    }
  }, [fetchProducts]);

  // ── Duplicate product ───────────────────────────────────────────────────
  const duplicateProduct = useCallback(async (id: number) => {
    setIsDuplicating(id);
    try {
      await adminApi.products.duplicate(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la duplication');
      console.error('Duplicate product error:', err);
    } finally {
      setIsDuplicating(null);
    }
  }, [fetchProducts]);

  // ── Delete product ──────────────────────────────────────────────────────
  const deleteProduct = useCallback(async (id: number) => {
    setIsDeleting(id);
    try {
      await adminApi.products.delete(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      console.error('Delete product error:', err);
    } finally {
      setIsDeleting(null);
    }
  }, [fetchProducts]);

  // ── Update stock ────────────────────────────────────────────────────────
  const updateStock = useCallback(async (id: number, stock: number, reason?: string) => {
    try {
      await adminApi.products.updateStock(id, stock, reason);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du stock');
      console.error('Update stock error:', err);
      throw err;
    }
  }, [fetchProducts]);

  // ── Update label ────────────────────────────────────────────────────────
  const updateLabel = useCallback(async (id: number, label: string, discount?: number) => {
    try {
      await adminApi.products.setLabel(id, label, discount);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du label');
      console.error('Update label error:', err);
      throw err;
    }
  }, [fetchProducts]);

  // ── Export products ─────────────────────────────────────────────────────
  const exportProducts = useCallback(() => {
    adminApi.products.export();
  }, []);

  // ── Sync page with filters ──────────────────────────────────────────────
  useEffect(() => {
    setFilters(prev => ({ ...prev, page }));
  }, [page]);

  // ── Initial fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    // State
    products,
    loading,
    error,
    categories,
    flatCategories,
    
    // Filters
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasFilters,
    
    // Pagination
    page,
    setPage,
    goToNextPage,
    goToPrevPage,
    
    // Actions
    fetchProducts,
    fetchCategories,
    toggleProduct,
    duplicateProduct,
    deleteProduct,
    updateStock,
    updateLabel,
    exportProducts,
    
    // Selection
    selectedProduct,
    setSelectedProduct,
    
    // Loading states
    isToggling,
    isDeleting,
    isDuplicating,
  };
}

// ─── Hook for single product ───────────────────────────────────────────────
export function useProduct(slugOrId: string | number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.products.get(slugOrId);
      setProduct(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du produit');
      console.error('Fetch product error:', err);
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    if (slugOrId) {
      fetchProduct();
    }
  }, [slugOrId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

// ─── Hook for product statistics ───────────────────────────────────────────
export function useProductStats() {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lowStockRes, outOfStockRes] = await Promise.all([
        adminApi.products.lowStock(),
        adminApi.products.outOfStock(),
      ]);
      setLowStock(lowStockRes.data || lowStockRes);
      setOutOfStock(outOfStockRes.data || outOfStockRes);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    lowStock,
    outOfStock,
    loading,
    error,
    refetch: fetchStats,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
  };
}

// ─── Hook for product form ─────────────────────────────────────────────────
export interface ProductFormData {
  category_id: number | string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  unit?: string;
  brand?: string;
  origin?: string;
  stock: number;
  low_stock_threshold: number;
  sku?: string;
  barcode?: string;
  expiry_date?: string;
  is_bio: boolean;
  is_local: boolean;
  is_eco: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_premium: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  admin_label: string;
  admin_label_discount?: number;
}

export function useProductForm(product?: Product | null, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProduct = useCallback(async (formData: FormData | ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let response;
      if (formData instanceof FormData) {
        response = await adminApi.products.create(formData);
      } else {
        const fd = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
          }
        });
        response = await adminApi.products.create(fd);
      }
      onSuccess?.();
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  const updateProduct = useCallback(async (id: number, data: Partial<ProductFormData>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await adminApi.products.update(id, data);
      onSuccess?.();
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  const deleteProduct = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.products.delete(id);
      onSuccess?.();
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    loading: loading || isSubmitting,
    error,
  };
}

export default useProducts;