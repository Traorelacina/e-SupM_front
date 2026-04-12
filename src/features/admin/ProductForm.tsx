import { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Leaf,
  MapPin,
  Recycle,
  Sprout,
  Wheat,
  Star,
  Heart,
  Sparkles,
  Package,
  Tag,
  DollarSign,
  Box,
  Scale,
  Award,
  Calendar,
  Barcode,
  AlertTriangle,
  Zap,
  TrendingUp,
  Percent,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Save,
  AlertCircle,
} from 'lucide-react';
import { adminApi, categoriesApi, storageUrl } from '@/api';
import type { Product, Category } from '@/api';

// ── Types ──────────────────────────────────────────────────────────
interface FlatCategory extends Category {
  _depth: number;
}

interface ProductCategory {
  id: number;
  name: string;
  color?: string;
  description?: string;
}

interface Props {
  product?: Product | null;
  categories: FlatCategory[];
  onSaved: () => void;
  onCancel: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

// ── Constants ──────────────────────────────────────────────────────
const TABS = ['Général', 'Prix & Stock', 'Attributs', 'Images', 'Label'];

const LABELS = [
  { value: 'none', label: 'Aucun label', color: '#94a3b8' },
  { value: 'stock_limite', label: 'Stock limité', color: '#f59e0b' },
  { value: 'promo', label: 'Promotion', color: '#16a34a' },
  { value: 'stock_epuise', label: 'Stock épuisé', color: '#dc2626' },
  { value: 'offre_limitee', label: 'Offre limitée', color: '#8b5cf6' },
  { value: 'vote_rayon', label: 'Vote du rayon', color: '#2563eb' },
];

const ATTRS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'is_bio', label: 'Bio / Organique', icon: Leaf },
  { key: 'is_local', label: 'Local / Circuit court', icon: MapPin },
  { key: 'is_eco', label: 'Éco-responsable', icon: Recycle },
  { key: 'is_vegan', label: 'Vegan', icon: Sprout },
  { key: 'is_gluten_free', label: 'Sans gluten', icon: Wheat },
  { key: 'is_premium', label: 'Premium', icon: Star },
  { key: 'is_featured', label: 'Coup de cœur', icon: Heart },
  { key: 'is_new', label: 'Nouveau', icon: Sparkles },
];

const EMPTY_FORM: Record<string, any> = {
  category_id: '',
  product_category_id: '',
  name: '',
  description: '',
  price: '',
  compare_price: '',
  cost_price: '',
  weight: '',
  unit: '',
  brand: '',
  origin: '',
  stock: '',
  low_stock_threshold: 5,
  sku: '',
  barcode: '',
  expiry_date: '',
  partner_id: '',
  is_bio: false,
  is_local: false,
  is_eco: false,
  is_vegan: false,
  is_gluten_free: false,
  is_premium: false,
  is_featured: false,
  is_new: false,
  is_active: true,
  is_draft: false,
  admin_label: 'none',
  admin_label_discount: '',
};

// ── Helper pour l'URL des images produit ──────────────────────────
function getProductImageUrl(img: any): string {
  if (!img) return '';
  if (img.url && (img.url.startsWith('http') || img.url.startsWith('/'))) return img.url;
  if (img.path) return storageUrl(img.path) ?? '';
  return '';
}

// ── Input helper ──────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────
export default function ProductForm({
  product,
  categories,
  onSaved,
  onCancel,
  onToast,
}: Props) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Record<string, any>>(
    product ? { ...EMPTY_FORM, ...product } : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingImgs, setExistingImgs] = useState<any[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Product categories state ──────────────────────────────────
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loadingProdCats, setLoadingProdCats] = useState(false);

  // Charge les catégories de produits quand le rayon change
  useEffect(() => {
    const catId = form.category_id;
    if (!catId) {
      setProductCategories([]);
      setForm((f) => ({ ...f, product_category_id: '' }));
      return;
    }

    const loadProductCategories = async () => {
      setLoadingProdCats(true);
      try {
        // On récupère le rayon depuis l'arbre déjà chargé dans categories
        // ou on appelle l'API show pour avoir les product_categories
        const res = await categoriesApi.get(Number(catId));
        const cat = res as any;
        const pcs: ProductCategory[] = cat?.product_categories ?? [];
        setProductCategories(pcs);

        // Si la catégorie produit actuelle n'appartient pas à ce rayon, reset
        if (form.product_category_id) {
          const stillValid = pcs.some((pc) => pc.id === Number(form.product_category_id));
          if (!stillValid) {
            setForm((f) => ({ ...f, product_category_id: '' }));
          }
        }
      } catch {
        setProductCategories([]);
      } finally {
        setLoadingProdCats(false);
      }
    };

    loadProductCategories();
  }, [form.category_id]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Calcul marge / remise
  const margin =
    form.price && form.cost_price
      ? Math.round((1 - Number(form.cost_price) / Number(form.price)) * 100)
      : null;
  const discount =
    form.price &&
    form.compare_price &&
    Number(form.compare_price) > Number(form.price)
      ? Math.round((1 - Number(form.price) / Number(form.compare_price)) * 100)
      : null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setNewImages((p) => [...p, ...arr]);
    setNewPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImg = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    setNewImages((p) => p.filter((_, idx) => idx !== i));
    setNewPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const deleteExistingImg = async (imgId: number) => {
    if (!product?.id) return;
    try {
      await adminApi.products.deleteImage(product.id, imgId);
      setExistingImgs((p) => p.filter((img) => img.id !== imgId));
      onToast('Image supprimée');
    } catch {
      onToast('Erreur lors de la suppression', 'error');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.category_id) e.category_id = 'Catégorie requise';
    if (!form.name?.trim()) e.name = 'Nom requis';
    if (!form.price || Number(form.price) <= 0) e.price = 'Prix requis (> 0)';
    if (form.stock === '' || form.stock === undefined || Number(form.stock) < 0)
      e.stock = 'Stock requis (≥ 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!validate()) {
      onToast('Corrigez les erreurs avant de continuer', 'error');
      if (errors.category_id || errors.name) setTab(0);
      else if (errors.price || errors.stock) setTab(1);
      return;
    }

    setSaving(true);
    setGlobalError(null);
    try {
      const submitData = { ...form };
      if (isDraft) {
        submitData.is_draft = true;
        submitData.is_active = false;
      } else {
        submitData.is_draft = false;
      }

      if (product?.id) {
        await adminApi.products.update(product.id, submitData);
        if (newImages.length) {
          const imgFd = new FormData();
          newImages.forEach((img) => imgFd.append('images[]', img));
          await adminApi.products.uploadImages(product.id, imgFd);
        }
        onToast(isDraft ? 'Brouillon mis à jour' : 'Produit mis à jour');
      } else {
        const fd = new FormData();
        Object.entries(submitData).forEach(([k, v]) => {
          if (v === null || v === undefined || v === '') return;
          if (typeof v === 'boolean') {
            fd.append(k, v ? '1' : '0');
          } else {
            fd.append(k, String(v));
          }
        });
        newImages.forEach((img) => fd.append('images[]', img));
        await adminApi.products.create(fd);
        onToast(isDraft ? 'Brouillon sauvegardé' : 'Produit publié avec succès');
      }
      onSaved();
    } catch (e: any) {
      const msg = e.message || 'Erreur serveur';
      setGlobalError(msg);
      onToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({
    label,
    k,
    type = 'text',
    placeholder = '',
    required = false,
    hint = '',
    step = '1',
    icon: Icon,
  }: any) => (
    <Field label={label} required={required} error={errors[k]} hint={hint}>
      <div className="relative">
        <input
          type={type}
          value={form[k] ?? ''}
          placeholder={placeholder}
          onChange={(e) =>
            set(k, type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)
          }
          step={step}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition-all ${
            errors[k] ? 'border-red-400 ring-1 ring-red-200' : 'border-stone-200'
          } ${Icon ? 'pr-9' : ''}`}
        />
        {Icon && (
          <Icon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
        )}
      </div>
    </Field>
  );

  const labelObj = LABELS.find((l) => l.value === form.admin_label) ?? LABELS[0];
  const totalImages = existingImgs.length + newImages.length;

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl flex flex-col h-[95vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
              <Package size={18} className="text-amber-500" />
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            {product && (
              <p className="text-xs text-stone-400 mt-0.5">
                ID #{product.id} · {product.sku ?? '—'}
                {(product as any).is_draft && (
                  <span className="ml-2 text-amber-600">(Brouillon)</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-4 sm:px-6 flex-shrink-0 overflow-x-auto scrollbar-none">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`relative px-3 sm:px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 flex-shrink-0 ${
                tab === i
                  ? 'text-amber-600 border-amber-500'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              {t}
              {i === 3 && totalImages > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {totalImages}
                </span>
              )}
              {((i === 0 && (errors.category_id || errors.name)) ||
                (i === 1 && (errors.price || errors.stock))) && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Error banner global */}
        {globalError && (
          <div className="mx-4 sm:mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700 flex-shrink-0">
            <AlertCircle size={15} />
            {globalError}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 overscroll-contain">

          {/* ── Tab 0 : Général ── */}
          {tab === 0 && (
            <div className="space-y-4">
              {/* Rayon + Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Field label="Rayon" required error={errors.category_id}>
                    <select
                      value={form.category_id}
                      onChange={(e) => set('category_id', e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 bg-white transition-all ${
                        errors.category_id ? 'border-red-400' : 'border-stone-200'
                      }`}
                    >
                      <option value="">— Choisir un rayon —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {'　'.repeat(c._depth)}
                          {c._depth > 0 && '↳ '}
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div>
                  <Field label="Statut">
                    <button
                      type="button"
                      onClick={() => set('is_active', !form.is_active)}
                      className={`w-full h-11 px-4 rounded-xl border-2 font-semibold text-sm flex items-center gap-2 transition-all ${
                        form.is_active && !form.is_draft
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-stone-200 bg-stone-50 text-stone-500'
                      }`}
                    >
                      {form.is_active && !form.is_draft ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                      {form.is_active && !form.is_draft
                        ? 'Actif'
                        : form.is_draft
                        ? 'Brouillon'
                        : 'Inactif'}
                    </button>
                  </Field>
                </div>
              </div>

              {/* Catégorie de produit — s'affiche uniquement si un rayon est sélectionné */}
              {form.category_id && (
                <Field label="Catégorie de produit">
                  <div className="relative">
                    <select
                      value={form.product_category_id ?? ''}
                      onChange={(e) => set('product_category_id', e.target.value || '')}
                      disabled={loadingProdCats}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 bg-white transition-all disabled:opacity-60"
                    >
                      <option value="">— Aucune catégorie —</option>
                      {productCategories.map((pc) => (
                        <option key={pc.id} value={pc.id}>
                          {pc.name}
                        </option>
                      ))}
                    </select>
                    {loadingProdCats && (
                      <RefreshCw
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin pointer-events-none"
                      />
                    )}
                  </div>
                  {!loadingProdCats && productCategories.length === 0 && (
                    <p className="text-xs text-stone-400 mt-1">
                      Ce rayon n'a pas de catégories de produits
                    </p>
                  )}
                  {!loadingProdCats && productCategories.length > 0 && form.product_category_id && (
                    <div className="mt-1.5">
                      {productCategories
                        .filter((pc) => pc.id === Number(form.product_category_id))
                        .map((pc) => (
                          <span
                            key={pc.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: pc.color ? `${pc.color}20` : '#fef3c7',
                              color: pc.color || '#92400e',
                              border: `1px solid ${pc.color || '#fbbf24'}`,
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: pc.color || '#fbbf24' }}
                            />
                            {pc.name}
                          </span>
                        ))}
                    </div>
                  )}
                </Field>
              )}

              <InputField
                label="Nom du produit"
                k="name"
                placeholder="ex : Tomates cerises bio 500g"
                required
              />

              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Description détaillée…"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none transition-all"
                />
              </Field>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InputField label="Marque" k="brand" placeholder="NaturaBio" />
                <InputField label="Origine" k="origin" placeholder="Côte d'Ivoire" />
                <InputField label="Unité" k="unit" placeholder="kg, L, pièce…" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InputField label="SKU" k="sku" placeholder="REF-001" icon={Barcode} />
                <InputField label="Code-barres" k="barcode" placeholder="EAN13" />
                <InputField label="Date d'expiration" k="expiry_date" type="date" />
              </div>
            </div>
          )}

          {/* ── Tab 1 : Prix & Stock ── */}
          {tab === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                    <Tag size={12} /> Prix de vente
                    <span className="text-red-500 ml-0.5">*</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-500 font-bold flex-shrink-0">FCFA</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.price}
                      onChange={(e) => set('price', parseFloat(e.target.value) || '')}
                      placeholder="0"
                      className={`flex-1 min-w-0 bg-white border rounded-xl px-3 py-2 text-lg font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-300 ${
                        errors.price ? 'border-red-400' : 'border-amber-200'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 font-medium mt-1">{errors.price}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                    <Percent size={12} /> Prix barré
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-bold flex-shrink-0">FCFA</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.compare_price ?? ''}
                      onChange={(e) => set('compare_price', parseFloat(e.target.value) || '')}
                      placeholder="0"
                      className="flex-1 min-w-0 bg-white border border-stone-200 rounded-xl px-3 py-2 text-lg font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  {discount !== null && (
                    <span className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} /> -{discount}%
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                    <DollarSign size={12} /> Prix de revient
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-bold flex-shrink-0">FCFA</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.cost_price ?? ''}
                      onChange={(e) => set('cost_price', parseFloat(e.target.value) || '')}
                      placeholder="0"
                      className="flex-1 min-w-0 bg-white border border-stone-200 rounded-xl px-3 py-2 text-lg font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  {margin !== null && (
                    <span
                      className={`mt-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        margin > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <TrendingUp size={10} /> Marge {margin}%
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-stone-100" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Stock actuel" required error={errors.stock}>
                  <input
                    type="number"
                    min="0"
                    value={form.stock ?? ''}
                    onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition-all ${
                      errors.stock ? 'border-red-400' : 'border-stone-200'
                    }`}
                  />
                </Field>
                <InputField
                  label="Seuil d'alerte"
                  k="low_stock_threshold"
                  type="number"
                  placeholder="5"
                  hint="Alerte si stock ≤ seuil"
                />
                <InputField
                  label="Poids (kg)"
                  k="weight"
                  type="number"
                  placeholder="0.500"
                  step="0.001"
                />
              </div>

              {form.stock !== '' && form.stock !== undefined && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-500">Niveau de stock</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                        Number(form.stock) === 0
                          ? 'bg-red-100 text-red-700'
                          : Number(form.stock) <= Number(form.low_stock_threshold || 5)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {Number(form.stock) === 0 ? (
                        <AlertTriangle size={10} />
                      ) : Number(form.stock) <= Number(form.low_stock_threshold || 5) ? (
                        <Zap size={10} />
                      ) : (
                        <CheckCircle size={10} />
                      )}
                      {Number(form.stock) === 0
                        ? 'Rupture de stock'
                        : Number(form.stock) <= Number(form.low_stock_threshold || 5)
                        ? 'Stock faible'
                        : 'En stock'}
                    </span>
                  </div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(form.stock) / Math.max(Number(form.stock), 100)) * 100
                        )}%`,
                        background:
                          Number(form.stock) === 0
                            ? '#dc2626'
                            : Number(form.stock) <= Number(form.low_stock_threshold || 5)
                            ? '#f59e0b'
                            : '#16a34a',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 2 : Attributs ── */}
          {tab === 2 && (
            <div>
              <p className="text-sm text-stone-500 mb-4 flex items-center gap-2">
                <Award size={16} /> Sélectionnez les attributs applicables.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ATTRS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key, !form[key])}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold text-sm text-left transition-all ${
                      form[key]
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1">{label}</span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        form[key] ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                      }`}
                    >
                      {form[key] && <Check size={10} className="text-white" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab 3 : Images ── */}
          {tab === 3 && (
            <div className="space-y-5">
              {existingImgs.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                    <ImageIcon size={12} /> Images actuelles ({existingImgs.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {existingImgs.map((img) => {
                      const imgUrl = getProductImageUrl(img);
                      return (
                        <div
                          key={img.id}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 ${
                            img.is_primary ? 'border-amber-400' : 'border-stone-200'
                          }`}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af">?</text></svg>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                              <ImageIcon size={24} className="text-stone-300" />
                            </div>
                          )}
                          {img.is_primary && (
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-black text-center py-0.5 flex items-center justify-center gap-1">
                              <Star size={8} /> PRINCIPALE
                            </div>
                          )}
                          <button
                            onClick={() => deleteExistingImg(img.id)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                className="border-2 border-dashed border-stone-300 rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-amber-400', 'bg-amber-50/30');
                }}
                onDragLeave={(e) =>
                  e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30')
                }
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30');
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Upload size={36} className="mx-auto mb-3 text-stone-400" />
                <p className="text-sm font-semibold text-stone-600">
                  Glissez des images ou{' '}
                  <span className="text-amber-600">cliquez pour parcourir</span>
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  PNG, JPG, WEBP · 5 Mo max · La 1ère sera l'image principale
                </p>
              </div>

              {newPreviews.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Nouvelles images ({newPreviews.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {newPreviews.map((src, i) => (
                      <div
                        key={i}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 ${
                          i === 0 && existingImgs.length === 0
                            ? 'border-amber-400'
                            : 'border-stone-200'
                        }`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && existingImgs.length === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-black text-center py-0.5 flex items-center justify-center gap-1">
                            <Star size={8} /> PRINCIPALE
                          </div>
                        )}
                        <button
                          onClick={() => removeNewImg(i)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 4 : Label ── */}
          {tab === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-stone-500 flex items-center gap-2">
                <Award size={16} /> Le label s'affiche comme badge sur la fiche produit.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LABELS.map((lbl) => (
                  <button
                    key={lbl.value}
                    type="button"
                    onClick={() => set('admin_label', lbl.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-semibold text-sm text-left transition-all ${
                      form.admin_label === lbl.value ? 'bg-stone-50' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                    style={
                      form.admin_label === lbl.value
                        ? { borderColor: lbl.color, color: lbl.color }
                        : {}
                    }
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: lbl.color }}
                    />
                    {lbl.label}
                    {form.admin_label === lbl.value && (
                      <Check size={14} className="ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              {form.admin_label === 'promo' && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Remise affichée sur le badge
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 50, 70].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set('admin_label_discount', d)}
                        className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all flex items-center gap-1 ${
                          form.admin_label_discount == d
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        <Percent size={12} /> -{d}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => set('admin_label_discount', '')}
                      className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                        !form.admin_label_discount
                          ? 'border-stone-400 bg-stone-100 text-stone-700'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      Sans %
                    </button>
                  </div>
                </div>
              )}

              {form.admin_label !== 'none' && (
                <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                  <span className="text-sm text-stone-500 font-medium">Aperçu :</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-wide flex items-center gap-1"
                    style={{ background: labelObj.color }}
                  >
                    <Award size={10} />
                    {labelObj.label}
                    {form.admin_label === 'promo' && form.admin_label_discount
                      ? ` -${form.admin_label_discount}%`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-stone-100 flex-shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={tab === 0}
              onClick={() => setTab((t) => t - 1)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Préc.</span>
            </button>
            <span className="text-xs text-stone-400 font-medium px-1 whitespace-nowrap">
              {tab + 1}/{TABS.length}
            </span>
            <button
              disabled={tab === TABS.length - 1}
              onClick={() => setTab((t) => t + 1)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <span className="hidden sm:inline">Suiv.</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Annuler
            </button>
            {!product && (
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
                <span className="hidden sm:inline">Brouillon</span>
              </button>
            )}
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              {saving
                ? 'Enregistrement…'
                : product
                ? 'Mettre à jour'
                : 'Publier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}