// src/api/cart.ts
import { get, post, put, del } from './index';
import type { Cart, CartSummary, CartItem } from './index';

export interface CartApiResponse {
  cart: Cart;
  summary: CartSummary;
  message?: string;
}

export const cartApi = {
  // Récupérer le panier
  get: () => get<CartApiResponse>('/cart'),

  // Ajouter un produit
  add: (productId: number, quantity: number, size?: string | null, color?: string | null) =>
    post<CartApiResponse>('/cart/add', {
      product_id: productId,
      quantity,
      size,
      color,
    }),

  // Mettre à jour la quantité
  updateItem: (itemId: number, quantity: number) =>
    put<CartApiResponse>(`/cart/item/${itemId}`, { quantity }),

  // Supprimer un article
  removeItem: (itemId: number) => del<CartApiResponse>(`/cart/item/${itemId}`),

  // Vider le panier
  clear: () => del<CartApiResponse>('/cart'),

  // Appliquer un coupon
  applyCoupon: (code: string) => post<CartApiResponse>('/cart/coupon/apply', { code }),

  // Retirer le coupon
  removeCoupon: () => del<CartApiResponse>('/cart/coupon'),
};