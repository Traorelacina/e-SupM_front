import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  FolderTree,
  Plus,
  Upload,
  Download,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  Leaf,
  MapPin,
  Recycle,
  Sprout,
  Wheat,
  Star,
  Heart,
  Sparkles,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import { adminApi, categoryApi, storageUrl } from '@/api';
import type { Product, Category, PaginatedResponse } from '@/api';
import ProductForm from './ProductForm';
import CategoryManager, { flattenCategories } from './CategoryManager';
import { StockModal, LabelModal, ImportModal } from './ProductModals';

// ── Toast hook ─────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  return { toasts, toast };
}

// ── Label config ───────────────────────────────────────────────────
const LABEL_COLORS: Record<string, string> = {
  stock_limite: '#f59e0b',
  promo: '#16a34a',
  stock_epuise: '#dc2626',
  offre_limitee: '#8b5cf6',
  vote_rayon: '#2563eb',
};

const LABEL_NAMES: Record<string, string> = {
  stock_limite: 'Stock limité',
  promo: 'Promotion',
  stock_epuise: 'Stock épuisé',
  offre_limitee: 'Offre limitée',
  vote_rayon: 'Vote du rayon',
};

const ATTR_ICONS: Record<string, React.ElementType> = {
  is_bio: Leaf,
  is_local: MapPin,
  is_eco: Recycle,
  is_vegan: Sprout,
  is_gluten_free: Wheat,
  is_premium: Star,
  is_featured: Heart,
  is_new: Sparkles,
};

const ATTR_LABELS: Record<string, string> = {
  is_bio: 'Bio',
  is_local: 'Local',
  is_eco: 'Éco',
  is_vegan: 'Vegan',
  is_gluten_free: 'Sans gluten',
  is_premium: 'Premium',
  is_featured: 'Coup de cœur',
  is_new: 'Nouveau',
};

// ── Helper URL image produit ───────────────────────────────────────
function getProductThumb(prod: any): string | null {
  const primary = prod.primary_image ?? prod.images?.find((img: any) => img.is_primary);
  const first = prod.images?.[0];
  const img = primary ?? first;

  if (!img) return null;
  if (img.url && (img.url.startsWith('http') || img.url.startsWith('/'))) return img.url;
  if (img.path) return storageUrl(img.path);
  return null;
}

// ── Skeleton row ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-9 bg-stone-100 rounded-xl animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Data
  const [products, setProducts] = useState<(PaginatedResponse<Product> & { low_stock_count?: number; out_of_stock_count?: number }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const flatCats = flattenCategories(categories);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(searchParams.get('category_id') ?? '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? '');
  const [filterLowStock, setFilterLow] = useState(searchParams.get('low_stock') === 'true');
  const [filterOutStock, setFilterOut] = useState(searchParams.get('out_of_stock') === 'true');
  const [page, setPage] = useState(1);

  // Modals
  const [modal, setModal] = useState<'create' | 'edit' | 'stock' | 'label' | 'import' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);

  // Action loading states
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const { toasts, toast } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (search) params.q = search;
      if (filterCat) params.category_id = filterCat;
      if (filterStatus) params.status = filterStatus;
      if (filterLowStock) params.low_stock = 'true';
      if (filterOutStock) params.out_of_stock = 'true';

      const res = await adminApi.products.list(params);

      if (res && typeof res === 'object') {
        if (res.data && Array.isArray(res.data)) {
          setProducts(res as any);
        } else if (Array.isArray(res)) {
          setProducts({ data: res, total: res.length, current_page: 1, last_page: 1, per_page: res.length } as any);
        } else {
          setProducts({ data: [], total: 0, current_page: 1, last_page: 1, per_page: 25 } as any);
        }
      }
    } catch (error: any) {
      toast(error.message || 'Erreur de chargement', 'error');
      setProducts({ data: [], total: 0, current_page: 1, last_page: 1, per_page: 25 } as any);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCat, filterStatus, filterLowStock, filterOutStock, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApi.tree();
      const list = Array.isArray(res) ? res : (res as any).data ?? [];
      setCategories(list);
    } catch (err) {
      console.error('fetchCategories error:', err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
  }, [fetchProducts, activeTab]);

  // ── Actions ────────────────────────────────────────────────────
  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    try {
      const response = await adminApi.products.toggle(product.id);
      
      // Mise à jour locale avec les données retournées par l'API
      setProducts((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((p) =>
            p.id === product.id 
              ? { 
                  ...p, 
                  is_active: response.is_active ?? !(p as any).is_active,
                  is_draft: response.is_active ? false : (p as any).is_draft
                } 
              : p
          ),
        };
      });
      
      toast(response.is_active ? 'Produit activé' : 'Produit désactivé');
    } catch (e: any) {
      toast(e.message || 'Erreur lors du changement de statut', 'error');
      fetchProducts();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    setDuplicatingId(id);
    try {
      await adminApi.products.duplicate(id);
      toast('Produit dupliqué');
      fetchProducts();
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la duplication', 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Supprimer « ${product.name} » ? Cette action est irréversible.`)) return;
    setDeletingId(product.id);
    try {
      await adminApi.products.delete(product.id);
      toast('Produit supprimé');
      setProducts((prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.filter((p) => p.id !== product.id), total: prev.total - 1 };
      });
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCat('');
    setFilterStatus('');
    setFilterLow(false);
    setFilterOut(false);
    setPage(1);
    setSearchParams({});
  };

  const hasFilters = search || filterCat || filterStatus || filterLowStock || filterOutStock;

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F';

  const productList: Product[] = products?.data ?? [];

  // Fonction pour déterminer le statut affiché
  const getDisplayStatus = (prod: any) => {
    if (prod.is_draft) return { text: 'Brouillon', isActive: false, icon: EyeOff };
    if (prod.is_active) return { text: 'Actif', isActive: true, icon: Eye };
    return { text: 'Inactif', isActive: false, icon: EyeOff };
  };

  return (
    <div className="min-h-full bg-stone-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900">Catalogue</h1>
            <p className="text-stone-500 text-sm mt-0.5">Gestion des produits et des rayons</p>
          </div>
          {activeTab === 'products' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setModal('import')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Upload size={15} />
                <span className="hidden sm:inline">Importer</span>
              </button>
              <button
                onClick={() => adminApi.products.export()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Exporter</span>
              </button>
              <button
                onClick={() => {
                  setSelected(null);
                  setModal('create');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold transition-colors"
              >
                <Plus size={15} /> Nouveau produit
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4">
          {(['products', 'categories'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t
                  ? 'bg-amber-400 text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {t === 'products' ? <Package size={15} /> : <FolderTree size={15} />}
              {t === 'products' ? 'Produits' : 'Rayons'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products tab ─────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Statistiques en haut */}
          {products && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Total produits */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Total produits</p>
                    <p className="text-2xl font-display font-bold text-amber-900 mt-1">
                      {products.total?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
                    <LayoutGrid size={20} className="text-amber-700" />
                  </div>
                </div>
              </div>

              {/* Actifs */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-green-600">Actifs</p>
                    <p className="text-2xl font-display font-bold text-green-900 mt-1">
                      {products.data?.filter((p: any) => p.is_active && !p.is_draft).length || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                    <Eye size={20} className="text-green-700" />
                  </div>
                </div>
              </div>

              {/* Brouillons */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Brouillons</p>
                    <p className="text-2xl font-display font-bold text-orange-900 mt-1">
                      {products.data?.filter((p: any) => p.is_draft).length || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-200 rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-orange-700" />
                  </div>
                </div>
              </div>

              {/* Inactifs */}
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Inactifs</p>
                    <p className="text-2xl font-display font-bold text-stone-700 mt-1">
                      {products.data?.filter((p: any) => !p.is_active && !p.is_draft).length || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-stone-200 rounded-xl flex items-center justify-center">
                    <EyeOff size={20} className="text-stone-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alertes stock */}
          {products && ((products.low_stock_count ?? 0) > 0 || (products.out_of_stock_count ?? 0) > 0) && (
            <div className="flex flex-wrap gap-3">
              {(products.low_stock_count ?? 0) > 0 && (
                <button
                  onClick={() => {
                    setFilterLow(true);
                    setFilterOut(false);
                  }}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle size={15} />
                  {products.low_stock_count} en stock faible
                </button>
              )}
              {(products.out_of_stock_count ?? 0) > 0 && (
                <button
                  onClick={() => {
                    setFilterOut(true);
                    setFilterLow(false);
                  }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <AlertCircle size={15} />
                  {products.out_of_stock_count} en rupture
                </button>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="w-52 border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              />
            </div>

            <select
              className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 bg-white transition-all max-w-[160px]"
              value={filterCat}
              onChange={(e) => {
                setFilterCat(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les rayons</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {'　'.repeat(c._depth)}
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 bg-white transition-all"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="draft">Brouillons</option>
            </select>

            {filterLowStock && (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
                <Zap size={11} /> Stock faible
                <button onClick={() => setFilterLow(false)} className="ml-1">
                  <X size={11} />
                </button>
              </span>
            )}
            {filterOutStock && (
              <span className="flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1.5 rounded-full">
                <AlertCircle size={11} /> Rupture
                <button onClick={() => setFilterOut(false)} className="ml-1">
                  <X size={11} />
                </button>
              </span>
            )}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-stone-400 hover:text-red-500 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}

            <button
              onClick={fetchProducts}
              disabled={loading}
              className="ml-auto p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full border-collapse min-w-[800px]">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['Produit', 'Rayon', 'Prix', 'Stock', 'Label', 'Attrs', 'Statut', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {loading ? (
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  ) : productList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-stone-400 text-sm">
                        Aucun produit trouvé
                        {hasFilters && (
                          <button
                            onClick={clearFilters}
                            className="ml-2 text-amber-600 font-semibold underline"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                        </td>
                    </tr>
                  ) : (
                    productList.map((prod: any) => {
                      const thumbUrl = getProductThumb(prod);
                      const isToggling = togglingId === prod.id;
                      const isDeleting = deletingId === prod.id;
                      const isDuplicating = duplicatingId === prod.id;
                      const status = getDisplayStatus(prod);
                      const StatusIcon = status.icon;

                      return (
                        <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* Produit */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[180px]">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={prod.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                                  onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      prod.name
                                    )}&background=fbbf24&color=1c1917&size=40`;
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                                  <Package size={18} className="text-stone-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-semibold text-stone-900 truncate max-w-[160px]">
                                    {prod.name}
                                  </p>
                                  {prod.is_draft && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                      <FileText size={9} /> Brouillon
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-400 font-mono">
                                  {prod.sku ?? `#${prod.id}`}
                                </p>
                              </div>
                            </div>
                            </td>

                          {/* Rayon */}
                          <td className="py-3 px-4">
                            <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                              {prod.category?.name ?? '—'}
                            </span>
                            </td>

                          {/* Prix */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-stone-900">{fmt(prod.price)}</p>
                            {prod.compare_price && Number(prod.compare_price) > 0 && (
                              <p className="text-xs text-stone-400 line-through">
                                {fmt(prod.compare_price)}
                              </p>
                            )}
                            </td>

                          {/* Stock */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelected(prod);
                                setModal('stock');
                              }}
                              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border transition-all hover:opacity-80 whitespace-nowrap ${
                                prod.stock === 0
                                  ? 'bg-red-50 border-red-200 text-red-600'
                                  : prod.stock <= (prod.low_stock_threshold ?? 5)
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-green-50 border-green-200 text-green-700'
                              }`}
                              title="Cliquer pour modifier le stock"
                            >
                              {prod.stock === 0 ? (
                                <AlertCircle size={11} />
                              ) : prod.stock <= (prod.low_stock_threshold ?? 5) ? (
                                <Zap size={11} />
                              ) : null}
                              {prod.stock}
                            </button>
                            </td>

                          {/* Label */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelected(prod);
                                setModal('label');
                              }}
                              title="Changer l'étiquette"
                              className="text-xs font-bold px-2.5 py-1 rounded-full border hover:opacity-80 transition-all whitespace-nowrap"
                              style={
                                prod.admin_label && prod.admin_label !== 'none'
                                  ? {
                                      borderColor: LABEL_COLORS[prod.admin_label],
                                      color: LABEL_COLORS[prod.admin_label],
                                      background: `${LABEL_COLORS[prod.admin_label]}18`,
                                    }
                                  : { borderColor: '#e2e8f0', color: '#94a3b8' }
                              }
                            >
                              {prod.admin_label && prod.admin_label !== 'none'
                                ? LABEL_NAMES[prod.admin_label] ?? prod.admin_label.replace(/_/g, ' ')
                                : '—'}
                            </button>
                            </td>

                          {/* Attributs */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[70px]">
                              {Object.entries(ATTR_ICONS).map(([k, Icon]) =>
                                prod[k] ? (
                                  <Icon
                                    key={k}
                                    size={13}
                                    className="text-stone-500"
                                    title={ATTR_LABELS[k]}
                                  />
                                ) : null
                              )}
                            </div>
                            </td>

                          {/* Statut */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggle(prod)}
                              disabled={isToggling}
                              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap disabled:opacity-60 ${
                                status.isActive
                                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                              }`}
                            >
                              {isToggling ? (
                                <RefreshCw size={11} className="animate-spin" />
                              ) : (
                                <StatusIcon size={11} />
                              )}
                              {status.text}
                            </button>
                            </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => {
                                  setSelected(prod);
                                  setModal('edit');
                                }}
                                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(prod.id)}
                                disabled={isDuplicating}
                                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors disabled:opacity-50"
                                title="Dupliquer"
                              >
                                {isDuplicating ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(prod)}
                                disabled={isDeleting}
                                className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {isDeleting ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                            </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {products && products.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                disabled={products.current_page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Précédent
              </button>
              <span className="text-sm font-medium text-stone-600 whitespace-nowrap">
                Page {products.current_page} / {products.last_page}
                <span className="text-stone-400 ml-1.5">({products.total} résultats)</span>
              </span>
              <button
                disabled={products.current_page === products.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
              >
                Suivant <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Categories tab ────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <CategoryManager
          categories={categories}
          flatCats={flatCats}
          onRefetch={fetchCategories}
          onToast={toast}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <ProductForm
          product={modal === 'edit' ? selected : null}
          categories={flatCats}
          onSaved={() => {
            setModal(null);
            fetchProducts();
          }}
          onCancel={() => setModal(null)}
          onToast={toast}
        />
      )}
      {modal === 'stock' && selected && (
        <StockModal
          product={selected}
          onClose={() => setModal(null)}
          onDone={fetchProducts}
          onToast={toast}
        />
      )}
      {modal === 'label' && selected && (
        <LabelModal
          product={selected}
          onClose={() => setModal(null)}
          onDone={fetchProducts}
          onToast={toast}
        />
      )}
      {modal === 'import' && (
        <ImportModal
          onClose={() => setModal(null)}
          onDone={fetchProducts}
          onToast={toast}
        />
      )}

      {/* ── Toasts ───────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-4 sm:right-5 flex flex-col gap-2 z-[200] max-w-[320px] w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold w-full pointer-events-auto ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-green-200 text-green-700'
            }`}
            style={{ animation: 'slideUp 0.3s ease' }}
          >
            {t.type === 'error' ? (
              <AlertCircle size={15} className="flex-shrink-0" />
            ) : (
              <CheckCircle size={15} className="flex-shrink-0" />
            )}
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}