import { Product, Category } from "@/types/product";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Eletronicos", acronym: "EL", color: "#3b82f6", sort_order: 1 },
  { id: "2", name: "Perfumes", acronym: "PE", color: "#10b981", sort_order: 2 },
  { id: "3", name: "Acessorios", acronym: "AC", color: "#fbbf24", sort_order: 3 },
  { id: "4", name: "Vestuarios", acronym: "VE", color: "#ef4444", sort_order: 4 },
];

export const PRODUCTS: Product[] = [
  { id: "1", name: "iPhone 15 Pro Max", brand: "Apple", category_id: "1", price: 8500, stock: 12, rating: 5, is_out_of_stock: false, is_active: true, created_at: new Date().toISOString() },
  { id: "2", name: "MacBook Air M2", brand: "Apple", category_id: "1", price: 7200, stock: 0, rating: 4.8, is_out_of_stock: true, is_active: true, created_at: new Date().toISOString() },
  { id: "3", name: "Sauvage Elixir", brand: "Dior", category_id: "2", price: 850, stock: 6, rating: 4.6, is_out_of_stock: false, is_active: true, created_at: new Date().toISOString() },
  { id: "4", name: "Bleu de Chanel", brand: "Chanel", category_id: "2", price: 780, stock: 4, rating: 4.7, is_out_of_stock: false, is_active: true, created_at: new Date().toISOString() },
  { id: "5", name: "Apple Watch Series 9", brand: "Apple", category_id: "3", price: 3200, stock: 2, rating: 4.5, is_out_of_stock: false, is_active: true, created_at: new Date().toISOString() },
  { id: "6", name: "AirPods Pro 2", brand: "Apple", category_id: "3", price: 1800, stock: 0, rating: 4.4, is_out_of_stock: true, is_active: true, created_at: new Date().toISOString() },
  { id: "7", name: "Camiseta Oversized", brand: "Nike", category_id: "4", price: 150, stock: 15, rating: 4.2, is_out_of_stock: false, is_active: true, created_at: new Date().toISOString() },
];
