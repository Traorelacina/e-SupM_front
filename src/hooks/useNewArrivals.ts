// hooks/useNewArrivals.ts
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/api';
import type { Product } from '@/api';

export function useNewArrivals() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productApi.newArrivals(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const newArrivals = Array.isArray(data) ? data : (data as any)?.data ?? [];

  return {
    newArrivals: newArrivals.slice(0, 8),
    isLoading,
    error,
    totalCount: newArrivals.length,
  };
}