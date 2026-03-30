export interface Product {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  price: number;
  old_price?: number;
  stock: number;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  usage_mode?: string;
  contraindications?: string;
  active_ingredient?: string;
  rating: number;
  is_out_of_stock: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  acronym: string;
  color: string;
  sort_order: number;
}

export interface CategoryWithStats extends Category {
  totalMarcas: number;
  totalEmFalta: number;
  produtos: Product[];
}