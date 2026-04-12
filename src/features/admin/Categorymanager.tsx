// features/admin/CategoryManager.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  FolderTree,
  Eye,
  EyeOff,
  Crown,
  Menu,
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Tag,
} from 'lucide-react';
import { categoriesApi, storageUrl } from '@/api';
import type { Category, ProductCategory } from '@/api';

export interface FlatCat extends Category {
  _depth: number;
}

// ── Flatten helper ────────────────────────────────────────────────
export function flattenCategories(
  cats: Category[] | undefined | null,
  depth = 0
): FlatCat[] {
  if (!cats || !Array.isArray(cats)) return [];
  const result: FlatCat[] = [];
  cats.forEach((c) => {
    result.push({ ...c, _depth: depth });
    if ((c as any).children?.length) {
      result.push(...flattenCategories((c as any).children, depth + 1));
    }
  });
  return result;
}

// ── Image helper ──────────────────────────────────────────────────
function getCategoryImageUrl(cat: any): string | null {
  if (cat.image_url) return cat.image_url;
  if (cat.image) return storageUrl(cat.image);
  return null;
}

// ── Bool Toggle ───────────────────────────────────────────────────
function BoolToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
          value ? 'bg-amber-400' : 'bg-stone-200'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-sm font-semibold text-stone-700">{label}</span>
    </label>
  );
}

// ── Composant pour gérer les catégories de produits dans le formulaire ──
function ProductCategoriesManager({
  categories,
  onChange,
}: {
  categories: any[];
  onChange: (categories: any[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#FBBF24');

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = {
      id: null,
      name: newCategoryName.trim(),
      color: newCategoryColor,
      description: '',
      sort_order: categories.length,
      is_new: true,
    };
    onChange([...categories, newCat]);
    setNewCategoryName('');
    setNewCategoryColor('#FBBF24');
  };

  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;
    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[direction === 'up' ? index - 1 : index + 1];
    updated[direction === 'up' ? index - 1 : index + 1] = temp;
    onChange(updated);
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-stone-700">Catégories de produits</span>
          <span className="text-xs text-stone-400">({categories.length})</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Liste des catégories existantes */}
          {categories.length > 0 && (
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                  <GripVertical size={16} className="text-stone-300 cursor-move" />
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                    placeholder="Nom de la catégorie"
                    className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:ring-1 focus:ring-amber-300 outline-none"
                  />
                  <input
                    type="color"
                    value={cat.color || '#FBBF24'}
                    onChange={(e) => updateCategory(idx, 'color', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200"
                  />
                  <input
                    type="text"
                    value={cat.description || ''}
                    onChange={(e) => updateCategory(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-32 border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:ring-1 focus:ring-amber-300 outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-stone-200 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded hover:bg-stone-200 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(idx)}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ajouter une nouvelle catégorie */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nouvelle catégorie (ex: Produits laitiers)"
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200"
            />
            <button
              type="button"
              onClick={addCategory}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-stone-900 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="text-xs text-stone-400">Les catégories seront créées automatiquement avec le rayon</p>
        </div>
      )}
    </div>
  );
}

// ── Category Form Modal (avec gestion des catégories de produits) ──
function CategoryFormModal({
  cat,
  flatCats,
  onClose,
  onSaved,
  onToast,
}: {
  cat?: FlatCat | null;
  flatCats: FlatCat[];
  onClose: () => void;
  onSaved: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({
    name: cat?.name ?? '',
    parent_id: (cat as any)?.parent_id ?? '',
    description: (cat as any)?.description ?? '',
    color: (cat as any)?.color ?? '#FBBF24',
    sort_order: (cat as any)?.sort_order ?? 0,
    is_active: (cat as any)?.is_active ?? true,
    is_premium: (cat as any)?.is_premium ?? false,
    show_in_menu: (cat as any)?.show_in_menu ?? true,
  });
  const [productCategories, setProductCategories] = useState<any[]>(
    (cat as any)?.product_categories?.map((pc: any) => ({
      id: pc.id,
      name: pc.name,
      color: pc.color,
      description: pc.description,
      sort_order: pc.sort_order,
    })) ?? []
  );
  const [categoriesToDelete, setCategoriesToDelete] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(getCategoryImageUrl(cat ?? {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      onToast('Le nom est requis', 'error');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.parent_id) fd.append('parent_id', String(form.parent_id));
      if (form.description) fd.append('description', form.description);
      if (form.color) fd.append('color', form.color);
      fd.append('sort_order', String(form.sort_order));
      fd.append('is_active', form.is_active ? '1' : '0');
      fd.append('is_premium', form.is_premium ? '1' : '0');
      fd.append('show_in_menu', form.show_in_menu ? '1' : '0');
      if (imageFile) fd.append('image', imageFile);

      // Ajouter les catégories de produits
      productCategories.forEach((pc, index) => {
        if (pc.id) {
          fd.append(`product_categories[${index}][id]`, String(pc.id));
        }
        fd.append(`product_categories[${index}][name]`, pc.name);
        if (pc.color) fd.append(`product_categories[${index}][color]`, pc.color);
        if (pc.description) fd.append(`product_categories[${index}][description]`, pc.description);
        fd.append(`product_categories[${index}][sort_order]`, String(index));
      });

      // Ajouter les IDs des catégories à supprimer
      categoriesToDelete.forEach((id, index) => {
        fd.append(`product_categories_to_delete[${index}]`, String(id));
      });

      if (cat?.id) {
        await categoriesApi.update(cat.id, fd);
        onToast('Rayon mis à jour avec succès');
      } else {
        await categoriesApi.create(fd);
        onToast('Rayon créé avec succès');
      }
      onSaved();
    } catch (e: any) {
      const msg = e.message ?? 'Erreur lors de la sauvegarde';
      setError(msg);
      onToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-bold text-stone-900 text-base">
            {cat ? `Modifier "${cat.name}"` : 'Nouveau rayon'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Informations du rayon */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Nom du rayon <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="ex: Produits frais"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Rayon parent</label>
              <select
                value={form.parent_id}
                onChange={(e) => set('parent_id', e.target.value || '')}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 bg-white transition-all"
              >
                <option value="">— Rayon racine —</option>
                {flatCats
                  .filter((c) => c.id !== cat?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {'　'.repeat(c._depth)}{c._depth > 0 && '↳ '}{c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none transition-all"
              placeholder="Description optionnelle..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Couleur</label>
              <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  className="flex-1 text-sm font-mono bg-transparent outline-none text-stone-700"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Ordre d'affichage</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 bg-stone-50 rounded-xl p-4">
            <BoolToggle label="Actif" value={form.is_active} onChange={(v) => set('is_active', v)} />
            <BoolToggle label="Catégorie premium" value={form.is_premium} onChange={(v) => set('is_premium', v)} />
            <BoolToggle label="Afficher dans le menu" value={form.show_in_menu} onChange={(v) => set('show_in_menu', v)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Image du rayon</label>
            <div
              className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all min-h-[80px] flex items-center justify-center"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setImageFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
              />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="max-h-24 rounded-lg object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(null); setImageFile(null); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon size={32} className="text-stone-400" />
                  <p className="text-sm text-stone-400">Cliquer pour ajouter une image</p>
                </div>
              )}
            </div>
          </div>

          {/* Gestion des catégories de produits */}
          <ProductCategoriesManager
            categories={productCategories}
            onChange={setProductCategories}
          />
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-amber-400 text-stone-900 text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {saving ? 'Enregistrement…' : cat ? 'Mettre à jour' : 'Créer le rayon'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Row ──────────────────────────────────────────────────
function CategoryRow({
  cat,
  depth,
  allFlat,
  onEdit,
  onToggle,
  onDelete,
}: {
  cat: any;
  depth: number;
  allFlat: FlatCat[];
  onEdit: (c: any) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showProductCategories, setShowProductCategories] = useState(false);

  const getImageUrl = () => {
    if (imgError) return null;
    if (cat.image_url) return cat.image_url;
    if (cat.image) return storageUrl(cat.image);
    return null;
  };

  const imgUrl = getImageUrl();
  const inactiveStyle = !cat.is_active ? 'opacity-60 bg-stone-50' : '';
  const hasProductCategories = cat.product_categories && cat.product_categories.length > 0;

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(cat.id);
    setToggling(false);
  };

  return (
    <React.Fragment>
      <tr className={`hover:bg-amber-50/30 transition-colors border-b border-stone-50 ${inactiveStyle}`}>
        <td className="py-3 px-4">
          {imgUrl ? (
            <img src={imgUrl} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-stone-200" onError={() => setImgError(true)} />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: cat.color || '#e5e7eb' }}>
              {cat.name.charAt(0).toUpperCase()}
            </div>
          )}
        </td>
        <td className="py-3 px-4" style={{ paddingLeft: depth > 0 ? `${16 + depth * 20}px` : '16px' }}>
          <div className="flex items-center gap-2.5 min-w-[140px]">
            {depth > 0 && <ChevronRight size={13} className="text-stone-300 flex-shrink-0" />}
            <div>
              <p className={`text-sm font-semibold leading-tight ${cat.is_active ? 'text-stone-900' : 'text-stone-400 line-through decoration-stone-300'}`}>{cat.name}</p>
              {cat.description && <p className="text-xs text-stone-400 truncate max-w-[160px]">{cat.description}</p>}
              {hasProductCategories && (
                <button
                  type="button"
                  onClick={() => setShowProductCategories(!showProductCategories)}
                  className="text-xs text-amber-600 hover:text-amber-700 mt-1 flex items-center gap-1"
                >
                  <Tag size={10} />
                  {showProductCategories ? 'Masquer' : 'Afficher'} ({cat.product_categories.length}) catégories
                  {showProductCategories ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-4 hidden sm:table-cell">
          {cat.parent_id ? (
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{allFlat.find((c) => c.id === cat.parent_id)?.name ?? '—'}</span>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Racine</span>
          )}
        </td>
        <td className="py-3 px-4 hidden md:table-cell">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border border-stone-200 flex-shrink-0" style={{ background: cat.color || '#e5e7eb' }} />
            <span className="text-xs font-mono text-stone-500">{cat.color}</span>
          </div>
        </td>
        <td className="py-3 px-4 hidden lg:table-cell">
          <div className="flex flex-wrap gap-1">
            {cat.is_premium && <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium"><Crown size={10} /> Premium</span>}
            {cat.show_in_menu && <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-medium"><Menu size={10} /> Menu</span>}
            {cat.children?.length > 0 && <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium"><FolderTree size={10} className="inline mr-1" />{cat.children.length} sous-cat.</span>}
          </div>
        </td>
        <td className="py-3 px-4">
          <button onClick={handleToggle} disabled={toggling} className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border transition-all whitespace-nowrap disabled:opacity-60 ${cat.is_active ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}>
            {toggling ? <RefreshCw size={12} className="animate-spin" /> : cat.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
            {cat.is_active ? 'Actif' : 'Inactif'}
          </button>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(cat)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 font-medium transition-colors"><Edit2 size={13} /><span className="hidden sm:inline">Modifier</span></button>
            {confirming ? (
              <>
                <button onClick={() => { onDelete(cat.id); setConfirming(false); }} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 flex items-center gap-1"><Check size={13} /></button>
                <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100"><X size={13} /></button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
            )}
          </div>
        </td>
      </tr>

      {/* Affichage des catégories de produits sous le rayon */}
      {showProductCategories && hasProductCategories && (
        <tr className="bg-stone-50/50">
          <td colSpan={7} className="py-2 px-4">
            <div className="pl-8">
              <p className="text-xs font-semibold text-stone-500 mb-2">Catégories de produits :</p>
              <div className="flex flex-wrap gap-2">
                {cat.product_categories.map((pc: any) => (
                  <span
                    key={pc.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: pc.color ? `${pc.color}20` : '#fef3c7',
                      color: pc.color || '#92400e',
                      border: `1px solid ${pc.color || '#fbbf24'}`
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pc.color || '#fbbf24' }} />
                    {pc.name}
                  </span>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}

      {cat.children?.map((child: any) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} allFlat={allFlat} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </React.Fragment>
  );
}

// ── Main CategoryManager ──────────────────────────────────────────
export default function CategoryManager({ onToast }: { onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCats, setFlatCats] = useState<FlatCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FlatCat | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.tree();
      const tree = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setCategories(tree);
      setFlatCats(flattenCategories(tree));
    } catch (err: any) {
      onToast(err.message || 'Erreur lors du chargement des rayons', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggle = async (id: number) => {
    try {
      const response = await categoriesApi.toggle(id);
      onToast(response.message || 'Statut mis à jour');
      await fetchCategories();
    } catch (err: any) {
      onToast(err.message || 'Erreur lors du changement de statut', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await categoriesApi.delete(id);
      onToast('Rayon supprimé');
      await fetchCategories();
    } catch (err: any) {
      onToast(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const getDisplayList = () => {
    if (search) {
      const q = search.toLowerCase();
      let results = flatCats.filter((c) => c.name.toLowerCase().includes(q));
      if (!showInactive) results = results.filter((c) => c.is_active);
      return results;
    }
    if (!showInactive) {
      return categories.filter((c) => c.is_active);
    }
    return categories;
  };

  const displayList = getDisplayList();
  const isSearchMode = !!search;
  const activeCount = flatCats.filter((c) => c.is_active).length;
  const inactiveCount = flatCats.filter((c) => !c.is_active).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <RefreshCw size={24} className="animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree size={22} className="text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Rayons</h2>
          </div>
          <p className="text-stone-500 text-sm mt-0.5">
            {flatCats.length} rayon(s) au total
            <span className="ml-2 text-green-600 font-medium">{activeCount} actifs</span>
            {inactiveCount > 0 && <span className="ml-1 text-red-500 font-medium">· {inactiveCount} inactifs</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${showInactive ? 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
            title={showInactive ? 'Masquer les rayons inactifs' : 'Afficher les rayons inactifs'}
          >
            {showInactive ? <Eye size={13} /> : <EyeOff size={13} />}
            {showInactive ? 'Inactifs visibles' : 'Inactifs masqués'}
            {inactiveCount > 0 && <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${showInactive ? 'bg-stone-200 text-stone-600' : 'bg-red-100 text-red-600'}`}>{inactiveCount}</span>}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors disabled:opacity-50" title="Actualiser">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-stone-900 font-semibold rounded-xl text-sm transition-colors">
            <Plus size={16} /> Nouveau rayon
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="w-full border border-stone-200 rounded-xl text-sm pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all" placeholder="Rechercher un rayon…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {search && <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 px-2 py-1"><X size={13} /> Effacer</button>}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">Image</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">Nom</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400 hidden sm:table-cell">Parent</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400 hidden md:table-cell">Couleur</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400 hidden lg:table-cell">Attributs</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">Statut</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-stone-400 text-sm">
                  {search ? 'Aucun rayon trouvé pour cette recherche' : !showInactive && inactiveCount > 0 ? 'Tous les rayons sont masqués — cliquez sur "Inactifs masqués" pour les afficher' : 'Aucun rayon — créez-en un !'}
                </td></tr>
              ) : (
                displayList.map((cat: any) => (
                  <CategoryRow key={cat.id} cat={cat} depth={isSearchMode ? (cat._depth ?? 0) : 0} allFlat={flatCats} onEdit={setEditing} onToggle={toggle} onDelete={handleDelete} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing !== null) && (
        <CategoryFormModal cat={editing} flatCats={flatCats} onClose={() => { setCreating(false); setEditing(null); }} onSaved={async () => { setCreating(false); setEditing(null); await fetchCategories(); }} onToast={onToast} />
      )}
    </div>
  );
}