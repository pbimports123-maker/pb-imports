import { Product, Category } from "@/types/product";

export const CATEGORIES: Category[] = [
  { id: "1", nome: "Eletrônicos", acronimo: "EL", cor: "#3b82f6", ordem: 1 },
  { id: "2", nome: "Perfumes", acronimo: "PE", cor: "#10b981", ordem: 2 },
  { id: "3", nome: "Acessórios", acronimo: "AC", cor: "#fbbf24", ordem: 3 },
  { id: "4", nome: "Vestuário", acronimo: "VE", cor: "#ef4444", ordem: 4 },
];

export const PRODUCTS: Product[] = [
  { id: "1", nome: "iPhone 15 Pro Max", marca: "Apple", categoriaId: "1", preco: 8500, emFalta: false },
  { id: "2", nome: "MacBook Air M2", marca: "Apple", categoriaId: "1", preco: 7200, emFalta: true },
  { id: "3", nome: "Sauvage Elixir", marca: "Dior", categoriaId: "2", preco: 850, emFalta: false },
  { id: "4", nome: "Bleu de Chanel", marca: "Chanel", categoriaId: "2", preco: 780, emFalta: false },
  { id: "5", nome: "Apple Watch Series 9", marca: "Apple", categoriaId: "3", preco: 3200, emFalta: true },
  { id: "6", nome: "AirPods Pro 2", marca: "Apple", categoriaId: "3", preco: 1800, emFalta: false },
  { id: "7", nome: "Camiseta Oversized", marca: "Nike", categoriaId: "4", preco: 150, emFalta: false },
];