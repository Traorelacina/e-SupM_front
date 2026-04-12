import { useState } from 'react';
import { adminApi } from '@/api';
import type { Product } from '@/api';
import { AlertCircle, CheckCircle, X, Percent, Award } from 'lucide-react';

// ── Shared Modal shell ─────────────────────────────────────────────
function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-bold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-100 flex-shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
}

// ── StockModal ─────────────────────────────────────────────────────
export function StockModal({
  product,
  onClose,
  onDone,
  onToast,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [stock, setStock] = useState(product.stock ?? 0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diff = stock - (product.stock ?? 0);

  const handleSave = async () => {
    if (diff === 0) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.products.updateStock(product.id, stock, reason || undefined);
      onToast(`Stock mis à jour : ${product.stock} → ${stock}`);
      onDone();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur lors de la mise à jour du stock';
      setError(msg);
      onToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Modifier le stock"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || diff === 0}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? 'Mise à jour…' : 'Valider'}
          </button>
        </>
      }
    >
      <p className="text-sm text-stone-500 font-medium truncate">{product.name}</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Contrôle stock */}
      <div className="flex items-center rounded-xl border-2 border-stone-200 overflow-hidden">
        <button
          onClick={() => setStock((s) => Math.max(0, s - 1))}
          className="w-14 h-14 bg-stone-50 hover:bg-stone-100 text-stone-700 text-2xl font-bold transition-colors flex-shrink-0 flex items-center justify-center"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
          className="flex-1 text-center text-2xl font-bold text-stone-900 border-none outline-none py-3 bg-white"
        />
        <button
          onClick={() => setStock((s) => s + 1)}
          className="w-14 h-14 bg-stone-50 hover:bg-stone-100 text-stone-700 text-2xl font-bold transition-colors flex-shrink-0 flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Indicateur de différence */}
      <div className="text-center">
        {diff > 0 && (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
            <CheckCircle size={13} /> +{diff} ajouté(s)
          </span>
        )}
        {diff < 0 && (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
            <AlertCircle size={13} /> −{Math.abs(diff)} retiré(s)
          </span>
        )}
        {diff === 0 && (
          <span className="text-xs text-stone-400">Stock inchangé</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Motif (optionnel)
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ex: Réception livraison, inventaire…"
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300 transition-all"
        />
      </div>
    </Modal>
  );
}

// ── LabelModal ─────────────────────────────────────────────────────
const LABELS = [
  { value: 'none', label: 'Aucun label', color: '#94a3b8' },
  { value: 'stock_limite', label: 'Stock limité', color: '#f59e0b' },
  { value: 'promo', label: 'Promotion', color: '#16a34a' },
  { value: 'stock_epuise', label: 'Stock épuisé', color: '#dc2626' },
  { value: 'offre_limitee', label: 'Offre limitée', color: '#8b5cf6' },
  { value: 'vote_rayon', label: 'Vote du rayon', color: '#2563eb' },
];

export function LabelModal({
  product,
  onClose,
  onDone,
  onToast,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [label, setLabel] = useState((product as any).admin_label ?? 'none');
  const [discount, setDiscount] = useState((product as any).admin_label_discount ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.products.setLabel(
        product.id,
        label,
        label === 'promo' ? Number(discount) || undefined : undefined
      );
      onToast('Étiquette appliquée avec succès');
      onDone();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur lors de la mise à jour';
      setError(msg);
      onToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Étiquette produit"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? 'Application…' : 'Appliquer'}
          </button>
        </>
      }
    >
      <p className="text-sm text-stone-500 font-medium truncate">{product.name}</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {LABELS.map((lbl) => (
          <button
            key={lbl.value}
            type="button"
            onClick={() => setLabel(lbl.value)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
              label === lbl.value
                ? 'bg-stone-50'
                : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
            }`}
            style={
              label === lbl.value ? { borderColor: lbl.color, color: lbl.color } : {}
            }
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: lbl.color }}
            />
            {lbl.label}
          </button>
        ))}
      </div>

      {label === 'promo' && (
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50, 70].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiscount(d)}
              className={`px-3 py-1.5 rounded-lg border-2 font-bold text-sm transition-all flex items-center gap-1 ${
                discount == d
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-stone-200 text-stone-600'
              }`}
            >
              <Percent size={11} /> -{d}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDiscount('')}
            className={`px-3 py-1.5 rounded-lg border-2 font-bold text-sm transition-all ${
              !discount
                ? 'border-stone-400 bg-stone-100 text-stone-700'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            Sans %
          </button>
        </div>
      )}
    </Modal>
  );
}

// ── ImportModal ────────────────────────────────────────────────────
export function ImportModal({
  onClose,
  onDone,
  onToast,
}: {
  onClose: () => void;
  onDone: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImp] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setImp(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Erreur lors de l\'import');
      setResult(json.message);
      onToast(json.message);
      onDone();
    } catch (e: any) {
      onToast(e.message ?? 'Erreur import', 'error');
    } finally {
      setImp(false);
    }
  };

  return (
    <Modal
      title="Importer des produits"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {importing ? 'Import en cours…' : 'Importer'}
          </button>
        </>
      }
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
        Format CSV attendu :{' '}
        <code className="font-mono bg-amber-100 px-1 rounded">
          name, price, stock, sku, category_id
        </code>
      </div>

      <div
        className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
        onClick={() => document.getElementById('import-file')?.click()}
      >
        <input
          id="import-file"
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-3xl mb-2">📂</p>
        {file ? (
          <p className="text-sm font-semibold text-stone-700">
            {file.name}{' '}
            <span className="text-stone-400">({(file.size / 1024).toFixed(1)} Ko)</span>
          </p>
        ) : (
          <p className="text-sm text-stone-500">
            Choisir un fichier <strong>CSV</strong> ou <strong>XLSX</strong>
          </p>
        )}
      </div>

      {result && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
          <CheckCircle size={15} /> {result}
        </div>
      )}
    </Modal>
  );
}