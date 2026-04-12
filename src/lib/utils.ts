import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'FCFA'): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export function formatDate(dateString: string, formatStr = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateString), formatStr, { locale: fr })
  } catch {
    return dateString
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: fr })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  return formatDate(dateString, 'dd/MM/yyyy à HH:mm')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export const LOYALTY_LEVELS = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-100',  icon: '🥉', multiplier: 1.0 },
  silver:   { label: 'Argent',   color: 'text-slate-600',  bg: 'bg-slate-100',  icon: '🥈', multiplier: 1.5 },
  gold:     { label: 'Or',       color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🥇', multiplier: 2.0 },
  platinum: { label: 'Platinum', color: 'text-purple-700', bg: 'bg-purple-100', icon: '💎', multiplier: 3.0 },
}

export const ORDER_STATUS_CONFIG = {
  pending:    { label: 'En attente',         color: 'badge-orange',  icon: '⏳' },
  confirmed:  { label: 'Confirmée',          color: 'badge-blue',    icon: '✓' },
  paid:       { label: 'Payée',              color: 'badge-blue',    icon: '💳' },
  preparing:  { label: 'En préparation',     color: 'badge-orange',  icon: '📦' },
  ready:      { label: 'Prête',              color: 'badge-green',   icon: '✅' },
  dispatched: { label: 'En livraison',       color: 'badge-orange',  icon: '🚚' },
  delivered:  { label: 'Livrée',             color: 'badge-green',   icon: '🎉' },
  cancelled:  { label: 'Annulée',            color: 'badge-red',     icon: '✕' },
  refunded:   { label: 'Remboursée',         color: 'badge-blue',    icon: '↩' },
}

export const RAYON_EMOJIS: Record<string, string> = {
  'produits-frais':         '🥗',
  'epicerie-salee':         '🥫',
  'epicerie-sucree':        '🍬',
  'espace-soif':            '🥤',
  'boucherie-poissonnerie': '🥩',
  'pain-patisserie':        '🍞',
  'bebe-confort':           '👶',
  'hygiene-beaute':         '💄',
  'dietetique-sante':       '🌿',
  'entretien-menage':       '🧹',
  'non-alimentaire':        '🏠',
  'demi-gros-gros':         '📦',
  'rayon-premium':          '⭐',
}
