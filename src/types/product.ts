export interface Product {
  id: string;
  nome: string;
  marca: string;
  categoriaId: string;
  preco: number;
  emFalta: boolean;
}

export interface Category {
  id: string;
  nome: string;
  acronimo: string;
  cor: string;
  ordem: number;
}

export interface CategoryWithStats extends Category {
  totalMarcas: number;
  totalEmFalta: number;
  produtos: Product[];
}