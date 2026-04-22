// features/admin/FoodBoxManager.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  X,
  RefreshCw,
  Package,
  ShoppingBag,
  Star,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calendar,
  Users,
  Percent,
  Sparkles,
  Check,
  Minus,
  Plus as PlusIcon,
  Upload,
  Save,
  Info,
} from 'lucide-react';
import { foodBoxesApi, storageUrl } from '@/api';
import type { FoodBox, FoodBoxItem } from '@/api';

// ── Types locaux ──────────────────────────────────────────────────
interface BoxItemDraft {
  product_id: number;
  product_name: string;
  product_price: number;
  product_thumb: string | null;
  product_category: string;
  quantity: number;
  sort_order: number;
}

// ── Constantes ────────────────────────────────────────────────────
const FREQUENCIES = [
  { value: 'weekly',   label: 'Hebdomadaire',      sub: 'Chaque semaine' },
  { value: 'biweekly', label: 'Bi-mensuelle',       sub: 'Toutes les 2 semaines' },
  { value: 'monthly',  label: 'Mensuelle',          sub: 'Chaque mois' },
];

const BADGE_PRESETS = [
  { label: 'Populaire',    color: '#f59e0b' },
  { label: 'Nouveau',      color: '#10b981' },
  { label: 'Promo',        color: '#ef4444' },
  { label: 'Recommandé',   color: '#8b5cf6' },
  { label: 'Exclusif',     color: '#2563eb' },
];

const EMPTY_FORM = {
  name: '',
  tagline: '',
  description: '',
  price: '',
  compare_price: '',
  frequency: 'monthly' as const,
  is_active: true,
  is_featured: false,
  max_subscribers: '',
  sort_order: 0,
  badge_label: '',
  badge_color: '#f59e0b',
};

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F';

function getBoxThumb(box: FoodBox): string | null {
  if (box.image_url) return box.image_url;
  if (box.image) return storageUrl(box.image);
  return null;
}

function getProductThumb(prod: any): string | null {
  if (prod.thumb_url) return prod.thumb_url;
  const img = prod.primary_image ?? prod.images?.[0];
  if (!img) return null;
  if (img.url?.startsWith('http') || img.url?.startsWith('/')) return img.url;
  if (img.path) return storageUrl(img.path) ?? null;
  return null;
}

// ── Toast hook ────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  return { toasts, toast };
}

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-stone-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone-100 rounded w-3/4" />
          <div className="h-3 bg-stone-100 rounded w-1/2" />
          <div className="h-3 bg-stone-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-8 bg-stone-100 rounded-xl" />
    </div>
  );
}

// ── Product Picker (dans le modal) ────────────────────────────────
function ProductPicker({
  items,
  onAdd,
  onRemove,
  onQtyChange,
}: {
  items: BoxItemDraft[];
  onAdd: (p: any) => void;
  onRemove: (productId: number) => void;
  onQtyChange: (productId: number, qty: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement initial des produits (sans recherche)
  const loadInitialProducts = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const res = await foodBoxesApi.searchProducts({});
      setResults(res.data ?? []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setResults([]);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // Recherche avec debounce
  const search = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await foodBoxesApi.searchProducts({ q });
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Charger les produits au montage
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  // Debounce pour la recherche
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!query.trim()) {
      loadInitialProducts();
      return;
    }
    
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search, loadInitialProducts]);

  const isInBox = (productId: number) => items.some((i) => i.product_id === productId);

  if (loadingInitial) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit à ajouter…"
            className="w-full border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all"
          />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
              <div className="w-9 h-9 bg-stone-100 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit à ajouter…"
          className="w-full border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all"
        />
        {searching && (
          <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />
        )}
        {query && !searching && results.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
            {results.length} résultat(s)
          </span>
        )}
      </div>

      {/* Liste des produits */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
          <Package size={12} /> 
          {query ? `Résultats pour "${query}"` : 'Tous les produits actifs'}
          <span className="text-stone-300 font-normal">({results.length})</span>
        </p>

        {results.length === 0 && !searching ? (
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center">
            <Package size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm text-stone-400">
              {query ? `Aucun produit trouvé pour « ${query} »` : 'Aucun produit disponible'}
            </p>
          </div>
        ) : (
          <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-50 max-h-80 overflow-y-auto">
            {results.map((prod) => {
              const inBox = isInBox(prod.id);
              const thumbUrl = getProductThumb(prod);
              return (
                <div
                  key={prod.id}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    inBox ? 'bg-amber-50' : 'hover:bg-stone-50 cursor-pointer'
                  }`}
                  onClick={() => !inBox && onAdd(prod)}
                >
                  {thumbUrl ? (
                    <img 
                      src={thumbUrl} 
                      alt={prod.name} 
                      className="w-9 h-9 rounded-lg object-cover border border-stone-200 flex-shrink-0" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{prod.name}</p>
                    <p className="text-xs text-stone-400">
                      {prod.category?.name || 'Sans catégorie'} · {fmt(prod.price)}
                    </p>
                    {prod.sku && (
                      <p className="text-[10px] text-stone-300 font-mono mt-0.5">SKU: {prod.sku}</p>
                    )}
                  </div>
                  {inBox ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      <Check size={11} /> Ajouté
                    </span>
                  ) : (
                    <button className="flex items-center gap-1 text-xs text-stone-600 bg-stone-100 hover:bg-amber-100 hover:text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0 transition-colors">
                      <PlusIcon size={11} /> Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Produits dans la box */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
          <ShoppingBag size={12} /> Contenu de la box ({items.length} produit{items.length !== 1 ? 's' : ''})
        </p>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center">
            <Package size={28} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm text-stone-400">
              Cliquez sur un produit ci-dessus pour l'ajouter à la box
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2"
              >
                {item.product_thumb ? (
                  <img 
                    src={item.product_thumb} 
                    alt={item.product_name} 
                    className="w-9 h-9 rounded-lg object-cover border border-stone-200 flex-shrink-0" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{item.product_name}</p>
                  <p className="text-xs text-stone-400">{item.product_category} · {fmt(item.product_price)}</p>
                </div>
                {/* Contrôle quantité */}
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-1">
                  <button
                    type="button"
                    onClick={() => onQtyChange(item.product_id, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 rounded text-stone-600"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-stone-800">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQtyChange(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 rounded text-stone-600"
                  >
                    <PlusIcon size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.product_id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal Création / Édition ──────────────────────────────────────
function FoodBoxModal({
  box,
  onClose,
  onSaved,
  onToast,
}: {
  box?: FoodBox | null;
  onClose: () => void;
  onSaved: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [tab, setTab] = useState<'general' | 'products'>('general');
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(box ? {
    name: box.name,
    tagline: box.tagline ?? '',
    description: box.description ?? '',
    price: String(box.price),
    compare_price: box.compare_price ? String(box.compare_price) : '',
    frequency: box.frequency,
    is_active: box.is_active,
    is_featured: box.is_featured,
    max_subscribers: box.max_subscribers ? String(box.max_subscribers) : '',
    sort_order: box.sort_order,
    badge_label: box.badge_label ?? '',
    badge_color: box.badge_color ?? '#f59e0b',
  } : {}) });

  // Items de la box
  const [items, setItems] = useState<BoxItemDraft[]>(() => {
    if (!box?.items) return [];
    return box.items.map((item, idx) => ({
      product_id: item.product_id,
      product_name: item.product?.name ?? `Produit #${item.product_id}`,
      product_price: item.product?.price ?? 0,
      product_thumb: item.product ? getProductThumb(item.product) : null,
      product_category: item.product?.category?.name ?? '—',
      quantity: item.quantity,
      sort_order: idx,
    }));
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(getBoxThumb(box ?? {} as FoodBox));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const discount = form.price && form.compare_price && Number(form.compare_price) > Number(form.price)
    ? Math.round((1 - Number(form.price) / Number(form.compare_price)) * 100)
    : null;

  const totalProductsValue = items.reduce((acc, i) => acc + i.product_price * i.quantity, 0);

  const addProduct = (prod: any) => {
    if (items.some((i) => i.product_id === prod.id)) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_thumb: getProductThumb(prod),
        product_category: prod.category?.name ?? '—',
        quantity: 1,
        sort_order: prev.length,
      },
    ]);
  };

  const removeProduct = (productId: number) =>
    setItems((prev) => prev.filter((i) => i.product_id !== productId));

  const changeQty = (productId: number, qty: number) =>
    setItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.price || Number(form.price) <= 0) e.price = 'Prix requis (> 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      onToast('Corrigez les erreurs', 'error');
      setTab('general');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('price', String(form.price));
      fd.append('frequency', form.frequency);
      fd.append('is_active', form.is_active ? '1' : '0');
      fd.append('is_featured', form.is_featured ? '1' : '0');
      fd.append('sort_order', String(form.sort_order));

      if (form.tagline.trim()) fd.append('tagline', form.tagline.trim());
      if (form.description.trim()) fd.append('description', form.description.trim());
      if (form.compare_price) fd.append('compare_price', String(form.compare_price));
      if (form.max_subscribers) fd.append('max_subscribers', String(form.max_subscribers));
      if (form.badge_label.trim()) {
        fd.append('badge_label', form.badge_label.trim());
        fd.append('badge_color', form.badge_color);
      }
      if (imageFile) fd.append('image', imageFile);

      items.forEach((item, idx) => {
        fd.append(`items[${idx}][product_id]`, String(item.product_id));
        fd.append(`items[${idx}][quantity]`, String(item.quantity));
        fd.append(`items[${idx}][sort_order]`, String(idx));
      });

      if (box?.id) {
        await foodBoxesApi.update(box.id, fd);
        onToast('Box mise à jour avec succès');
      } else {
        await foodBoxesApi.create(fd);
        onToast('Box créée avec succès');
      }
      onSaved();
    } catch (e: any) {
      onToast(e.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl flex flex-col h-[95vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-500" />
              {box ? `Modifier "${box.name}"` : 'Nouvelle Box Alimentaire'}
            </h3>
            {box && <p className="text-xs text-stone-400 mt-0.5">ID #{box.id} · {box.items?.length ?? 0} produit(s)</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-5 flex-shrink-0">
          {[
            { key: 'general', label: 'Informations générales', icon: Info },
            { key: 'products', label: `Produits (${items.length})`, icon: Package },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? 'text-amber-600 border-amber-500'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              <Icon size={14} /> {label}
              {key === 'general' && (errors.name || errors.price) && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 overscroll-contain">
          {/* ── Tab Général ── */}
          {tab === 'general' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Nom de la box <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="ex: Box Famille Essentielle"
                    className={`border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 ${errors.name ? 'border-red-400' : 'border-stone-200'}`}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Accroche</label>
                  <input
                    value={form.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="ex: Pour toute la famille"
                    className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Décrivez le contenu et les avantages de cette box…"
                  className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                    <Tag size={11} /> Prix de la box <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-500 font-bold">FCFA</span>
                    <input
                      type="number" min="0" step="1"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="0"
                      className={`flex-1 bg-white border rounded-xl px-3 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-amber-300 ${errors.price ? 'border-red-400' : 'border-amber-200'}`}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                    <Percent size={11} /> Prix barré (optionnel)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-bold">FCFA</span>
                    <input
                      type="number" min="0" step="1"
                      value={form.compare_price}
                      onChange={(e) => set('compare_price', e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  {discount !== null && (
                    <span className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Calendar size={12} /> Fréquence de livraison
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => set('frequency', f.value)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl border-2 text-sm transition-all ${
                        form.frequency === f.value
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className="font-bold text-xs">{f.label}</span>
                      <span className="text-[11px] text-stone-400">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set('is_active', !form.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.is_active ? 'bg-amber-400' : 'bg-stone-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set('is_featured', !form.is_featured)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.is_featured ? 'bg-amber-400' : 'bg-stone-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700 flex items-center gap-1"><Star size={12} /> En vedette</span>
                </label>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-stone-500 flex items-center gap-1"><Users size={11} /> Max abonnés</label>
                  <input
                    type="number" min="1"
                    value={form.max_subscribers}
                    onChange={(e) => set('max_subscribers', e.target.value)}
                    placeholder="∞ illimité"
                    className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Sparkles size={12} /> Badge d'étiquette (optionnel)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {BADGE_PRESETS.map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => { set('badge_label', b.label); set('badge_color', b.color); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        form.badge_label === b.label ? 'scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ borderColor: b.color, color: b.color, background: `${b.color}18` }}
                    >
                      {b.label}
                    </button>
                  ))}
                  {form.badge_label && (
                    <button
                      type="button"
                      onClick={() => { set('badge_label', ''); }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-500"
                    >
                      <X size={11} /> Retirer
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.badge_label}
                    onChange={(e) => set('badge_label', e.target.value)}
                    placeholder="Texte du badge personnalisé…"
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    type="color"
                    value={form.badge_color}
                    onChange={(e) => set('badge_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200"
                  />
                </div>
                {form.badge_label && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Aperçu :</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${form.badge_color}22`, color: form.badge_color, border: `1.5px solid ${form.badge_color}` }}
                    >
                      {form.badge_label}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Image de la box</label>
                <div
                  className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition-all flex items-center justify-center min-h-[80px]"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); }
                    }}
                  />
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="" className="max-h-24 rounded-lg object-cover" />
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setPreview(null); setImageFile(null); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={28} className="text-stone-300" />
                      <p className="text-sm text-stone-400">Cliquer pour ajouter une image de couverture</p>
                    </div>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-amber-700 font-medium flex items-center gap-1.5">
                    <ShoppingBag size={14} /> Valeur catalogue des {items.length} produits
                  </span>
                  <span className="font-bold text-amber-900">{fmt(totalProductsValue)}</span>
                </div>
              )}
            </>
          )}

          {/* ── Tab Produits ── */}
          {tab === 'products' && (
            <ProductPicker
              items={items}
              onAdd={addProduct}
              onRemove={removeProduct}
              onQtyChange={changeQty}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100 flex-shrink-0 gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('general')}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${tab === 'general' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
            >
              <ChevronLeft size={14} /> Général
            </button>
            <button
              onClick={() => setTab('products')}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${tab === 'products' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
            >
              Produits ({items.length}) <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Enregistrement…' : box ? 'Mettre à jour' : 'Créer la box'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte Box (liste) ─────────────────────────────────────────────
function FoodBoxCard({
  box,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  box: FoodBox;
  onEdit: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const thumbUrl = getBoxThumb(box);
  const freq = FREQUENCIES.find((f) => f.value === box.frequency);
  const itemCount = box.items?.length ?? 0;

  const discount = box.compare_price && box.compare_price > box.price
    ? Math.round((1 - box.price / box.compare_price) * 100)
    : null;

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!box.is_active ? 'opacity-70' : ''}`}>
      <div className="relative h-36 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt={box.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag size={40} className="text-amber-300" />
        )}
        {box.badge_label && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: `${box.badge_color}dd`, color: '#fff' }}
          >
            {box.badge_label}
          </span>
        )}
        {box.is_featured && (
          <span className="absolute top-2 right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow">
            <Star size={14} className="text-white fill-white" />
          </span>
        )}
        {!box.is_active && (
          <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
            <span className="bg-stone-900/70 text-white text-xs font-bold px-3 py-1 rounded-full">Inactif</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-stone-900 text-sm leading-tight">{box.name}</h3>
          {box.tagline && <p className="text-xs text-stone-400 mt-0.5 truncate">{box.tagline}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-amber-700">{fmt(box.price)}</span>
          {box.compare_price && (
            <span className="text-sm text-stone-400 line-through">{fmt(box.compare_price)}</span>
          )}
          {discount && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
              -{discount}%
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
            <Calendar size={10} /> {freq?.label ?? box.frequency}
          </span>
          <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
            <Package size={10} /> {itemCount} produit{itemCount !== 1 ? 's' : ''}
          </span>
          {box.max_subscribers && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              box.is_full ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600'
            }`}>
              <Users size={10} /> {box.subscribers_count}/{box.max_subscribers}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-50">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
              box.is_active
                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
            }`}
          >
            {box.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
            {box.is_active ? 'Active' : 'Inactive'}
          </button>

          <div className="flex items-center gap-0.5">
            <button onClick={onEdit} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" title="Modifier">
              <Edit2 size={13} />
            </button>
            <button onClick={onDuplicate} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" title="Dupliquer">
              <Copy size={13} />
            </button>
            {confirming ? (
              <>
                <button
                  onClick={() => { onDelete(); setConfirming(false); }}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  title="Confirmer la suppression"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                title="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
export default function FoodBoxManager({ onToast: parentToast }: { onToast?: (msg: string, type?: 'success' | 'error') => void }) {
  const [boxes, setBoxes] = useState<FoodBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterFreq, setFilterFreq] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<FoodBox | null>(null);

  const { toasts, toast } = useToast();
  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    toast(msg, type);
    parentToast?.(msg, type);
  };

  const fetchBoxes = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.q = search;
      if (filterActive === 'active') params.active = 'true';
      if (filterActive === 'inactive') params.active = 'false';
      if (filterFreq) params.frequency = filterFreq;

      const res = await foodBoxesApi.list(params);
      setBoxes(res.data ?? []);
    } catch (err: any) {
      notify(err.message || 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterActive, filterFreq]);

  useEffect(() => { fetchBoxes(); }, [fetchBoxes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBoxes();
    setRefreshing(false);
  };

  const handleToggle = async (box: FoodBox) => {
    try {
      const res = await foodBoxesApi.toggle(box.id);
      setBoxes((prev) => prev.map((b) => b.id === box.id ? { ...b, is_active: res.is_active } : b));
      notify(res.message);
    } catch (e: any) {
      notify(e.message || 'Erreur', 'error');
    }
  };

  const handleDuplicate = async (box: FoodBox) => {
    try {
      await foodBoxesApi.duplicate(box.id);
      notify('Box dupliquée');
      fetchBoxes();
    } catch (e: any) {
      notify(e.message || 'Erreur lors de la duplication', 'error');
    }
  };

  const handleDelete = async (box: FoodBox) => {
    try {
      await foodBoxesApi.delete(box.id);
      setBoxes((prev) => prev.filter((b) => b.id !== box.id));
      notify('Box supprimée');
    } catch (e: any) {
      notify(e.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const activeCount = boxes.filter((b) => b.is_active).length;
  const featuredCount = boxes.filter((b) => b.is_featured).length;
  const totalItems = boxes.reduce((acc, b) => acc + (b.items?.length ?? 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag size={22} className="text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Boxes Alimentaires</h2>
          </div>
          <p className="text-stone-500 text-sm mt-0.5">
            {boxes.length} box{boxes.length !== 1 ? 'es' : ''} au total
            {activeCount > 0 && <span className="ml-2 text-green-600 font-medium">{activeCount} active{activeCount !== 1 ? 's' : ''}</span>}
            {featuredCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {featuredCount} en vedette</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-900 font-semibold rounded-xl text-sm transition-colors"
          >
            <Plus size={16} /> Nouvelle box
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total boxes', value: boxes.length, color: 'amber', icon: ShoppingBag },
          { label: 'Actives', value: activeCount, color: 'green', icon: Eye },
          { label: 'En vedette', value: featuredCount, color: 'blue', icon: Star },
          { label: 'Produits liés', value: totalItems, color: 'stone', icon: Package },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`bg-gradient-to-br from-${color}-50 to-${color}-100/40 rounded-2xl p-4 border border-${color}-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider text-${color}-600`}>{label}</p>
                <p className={`text-2xl font-bold text-${color}-900 mt-1`}>{value}</p>
              </div>
              <div className={`w-9 h-9 bg-${color}-200 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-700`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une box…"
            className="w-48 border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all"
          />
        </div>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
        >
          <option value="all">Tous statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>

        <select
          value={filterFreq}
          onChange={(e) => setFilterFreq(e.target.value)}
          className="border border-stone-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
        >
          <option value="">Toutes fréquences</option>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {(search || filterActive !== 'all' || filterFreq) && (
          <button
            onClick={() => { setSearch(''); setFilterActive('all'); setFilterFreq(''); }}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 px-2 py-2 rounded-lg hover:bg-red-50"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {boxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag size={48} className="text-stone-200 mb-4" />
          <h3 className="text-lg font-bold text-stone-400 mb-1">Aucune box alimentaire</h3>
          <p className="text-stone-400 text-sm mb-4">Créez votre première box pour que les clients puissent s'abonner</p>
          <button
            onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-900 font-semibold rounded-xl text-sm"
          >
            <Plus size={16} /> Créer une box alimentaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box) => (
            <FoodBoxCard
              key={box.id}
              box={box}
              onEdit={() => { setSelected(box); setModal('edit'); }}
              onToggle={() => handleToggle(box)}
              onDuplicate={() => handleDuplicate(box)}
              onDelete={() => handleDelete(box)}
            />
          ))}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <FoodBoxModal
          box={modal === 'edit' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSaved={() => { setModal(null); setSelected(null); fetchBoxes(); }}
          onToast={notify}
        />
      )}

      {!parentToast && (
        <div className="fixed bottom-5 right-4 sm:right-5 flex flex-col gap-2 z-[200] max-w-[320px] w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold pointer-events-auto ${
                t.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-green-200 text-green-700'
              }`}
            >
              {t.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}