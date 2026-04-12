// hooks/useNormalizedProducts.ts
import { useMemo } from 'react';

/**
 * Options de normalisation pour le hook
 */
interface NormalizationOptions {
  /** Retourner un tableau vide si les données sont invalides (défaut: true) */
  fallbackToEmptyArray?: boolean;
  /** Logguer les avertissements en console (défaut: false en production) */
  logWarnings?: boolean;
  /** Profondeur maximale pour l'extraction (défaut: 3) */
  maxDepth?: number;
}

/**
 * Extrait un tableau de produits à partir de différentes structures de réponse API
 * 
 * Supporte les formats:
 * - Tableau direct: [...]
 * - Pagination Laravel: { data: [...], meta: {...} }
 * - Resource collection: { data: [...], links: {...} }
 * - Format avec items: { items: [...], total: 42 }
 * - Format imbriqué: { result: { products: [...] } }
 * - Format avec pagination personnalisée: { products: [...], pagination: {...} }
 * 
 * @param data - Les données brutes de l'API
 * @param options - Options de normalisation
 * @returns Un tableau de produits (toujours un tableau)
 * 
 * @example
 * const { data: response } = useQuery({
 *   queryKey: ['products'],
 *   queryFn: () => productApi.featured().then(r => r.data)
 * });
 * const products = useNormalizedProducts(response);
 * 
 * @example
 * const products = useNormalizedProducts(response, {
 *   fallbackToEmptyArray: true,
 *   logWarnings: true
 * });
 */
export function useNormalizedProducts(
  data: unknown,
  options: NormalizationOptions = {}
): any[] {
  const {
    fallbackToEmptyArray = true,
    logWarnings = process.env.NODE_ENV === 'development',
    maxDepth = 3
  } = options;

  return useMemo(() => {
    const result = extractProducts(data, maxDepth, logWarnings);
    
    if (!result && fallbackToEmptyArray) {
      if (logWarnings && data !== null && data !== undefined) {
        console.warn('[useNormalizedProducts] Impossible d\'extraire les produits:', data);
      }
      return [];
    }
    
    return result || [];
  }, [data, maxDepth, logWarnings, fallbackToEmptyArray]);
}

/**
 * Fonction récursive pour extraire les produits
 */
function extractProducts(data: unknown, depth: number, logWarnings: boolean): any[] | null {
  if (depth < 0) return null;
  
  // Cas null/undefined
  if (!data) return null;
  
  // Cas 1: Déjà un tableau
  if (Array.isArray(data)) {
    // Vérifier que le tableau contient des objets avec des propriétés de produit
    if (data.length === 0 || isValidProduct(data[0])) {
      return data;
    }
    if (logWarnings) {
      console.warn('[useNormalizedProducts] Le tableau ne contient pas des produits valides');
    }
    return null;
  }
  
  // Cas 2: Objet avec data (Laravel Resource Collection)
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    
    // 2.1 Propriété 'data' (Laravel standard)
    if (obj.data && Array.isArray(obj.data)) {
      if (obj.data.length === 0 || isValidProduct(obj.data[0])) {
        return obj.data;
      }
    }
    
    // 2.2 Propriété 'items' (Certains paginators)
    if (obj.items && Array.isArray(obj.items)) {
      if (obj.items.length === 0 || isValidProduct(obj.items[0])) {
        return obj.items;
      }
    }
    
    // 2.3 Propriété 'products' (Format personnalisé)
    if (obj.products && Array.isArray(obj.products)) {
      if (obj.products.length === 0 || isValidProduct(obj.products[0])) {
        return obj.products;
      }
    }
    
    // 2.4 Propriété 'results' (Format API standard)
    if (obj.results && Array.isArray(obj.results)) {
      if (obj.results.length === 0 || isValidProduct(obj.results[0])) {
        return obj.results;
      }
    }
    
    // 2.5 Propriété 'records' (Format legacy)
    if (obj.records && Array.isArray(obj.records)) {
      if (obj.records.length === 0 || isValidProduct(obj.records[0])) {
        return obj.records;
      }
    }
    
    // 2.6 Recherche récursive dans des propriétés communes
    const nestedProps = ['result', 'response', 'body', 'content'];
    for (const prop of nestedProps) {
      if (obj[prop]) {
        const nested = extractProducts(obj[prop], depth - 1, logWarnings);
        if (nested) return nested;
      }
    }
    
    // 2.7 Parcourir toutes les propriétés de l'objet
    if (depth > 0) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
          const nested = extractProducts(obj[key], depth - 1, logWarnings);
          if (nested) return nested;
        }
      }
    }
  }
  
  return null;
}

/**
 * Vérifie si un objet ressemble à un produit
 */
function isValidProduct(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false;
  
  const obj = item as Record<string, unknown>;
  
  // Un produit devrait avoir au moins un identifiant et un nom
  const hasId = obj.id !== undefined && typeof obj.id === 'number';
  const hasSlug = obj.slug !== undefined && typeof obj.slug === 'string';
  const hasName = obj.name !== undefined && typeof obj.name === 'string';
  const hasPrice = obj.price !== undefined && typeof obj.price === 'number';
  
  // Au moins 2 critères sur 4 doivent être présents
  const criteria = [hasId, hasSlug, hasName, hasPrice];
  const validCount = criteria.filter(Boolean).length;
  
  return validCount >= 2;
}

/**
 * Version avec typage générique
 */
export function useNormalizedProductsTyped<T = any>(
  data: unknown,
  options: NormalizationOptions = {}
): T[] {
  return useNormalizedProducts(data, options) as T[];
}

/**
 * Hook avec état de chargement intégré
 */
export function useNormalizedQuery<T = any>(
  queryResult: {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
  },
  options?: NormalizationOptions
): {
  products: T[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  hasProducts: boolean;
} {
  const products = useNormalizedProductsTyped<T>(queryResult.data, options);
  
  return {
    products,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    hasProducts: products.length > 0 && !queryResult.isLoading
  };
}