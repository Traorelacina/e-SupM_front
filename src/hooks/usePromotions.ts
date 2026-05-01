// hooks/usePromotions.ts
import { useQuery } from '@tanstack/react-query';
import { promotionApi, productApi } from '@/api';
import type { Product } from '@/api';

export interface PromotionGroup {
  id: string;
  label: string;
  items: Product[];
  icon?: React.ReactNode;
}

export function usePromotions() {
  // Récupération des produits en solde
  const { data: soldesData, isLoading: soldesLoading } = useQuery({
    queryKey: ['promotions', 'soldes'],
    queryFn: () => promotionApi.soldes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Récupération des produits flash
  const { data: flashData, isLoading: flashLoading } = useQuery({
    queryKey: ['promotions', 'flash'],
    queryFn: () => promotionApi.flash(),
    staleTime: 5 * 60 * 1000,
  });

  // Récupération des produits en déstockage
  const { data: destockageData, isLoading: destockageLoading } = useQuery({
    queryKey: ['promotions', 'destockage'],
    queryFn: () => promotionApi.destockage(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = soldesLoading || flashLoading || destockageLoading;

  const soldes = Array.isArray(soldesData) ? soldesData : (soldesData as any)?.data ?? [];
  const flash = Array.isArray(flashData) ? flashData : (flashData as any)?.data ?? [];
  const destockage = Array.isArray(destockageData) ? destockageData : (destockageData as any)?.data ?? [];

  const promotionGroups: PromotionGroup[] = [
    { id: 'soldes', label: 'Soldes', items: soldes.slice(0, 8) },
    { id: 'flash', label: 'Flash', items: flash.slice(0, 8) },
    { id: 'destockage', label: 'Déstockage', items: destockage.slice(0, 8) },
  ];

  return {
    promotionGroups,
    soldes,
    flash,
    destockage,
    isLoading,
    totalCount: soldes.length + flash.length + destockage.length,
  };
}