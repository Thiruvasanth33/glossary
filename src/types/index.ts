export type QuantityUnit = 
  | 'g'
  | 'kg'
  | 'ml'
  | 'L'
  | 'Piece'
  | 'Packet'
  | 'Box'
  | 'Bottle'
  | 'Dozen'
  | 'Bundle'
  | 'Tin'
  | string;

export interface Category {
  id: string;
  name: string;
  name_ta?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  name_ta?: string;
  brand: string;
  brand_ta?: string;
  quantity_value: number;
  quantity_unit: QuantityUnit;
  price: number;
  sku?: string;
  description?: string;
  description_ta?: string;
  created_at: string;
  updated_at: string;
  last_price_changed_at: string;
}

export interface PriceHistory {
  id: string;
  product_id?: string;
  product_name_snapshot: string;
  product_name_snapshot_ta?: string;
  brand_snapshot: string;
  quantity_snapshot: string;
  previous_price: number;
  new_price: number;
  price_difference: number;
  changed_at: string;
  changed_by?: string;
}

export interface ShopSettings {
  shop_name: string;
  currency_symbol: string;
  currency_code: string;
  default_voice_language: 'en-IN' | 'ta-IN' | 'en-US';
  db_mode: 'supabase' | 'local';
  supabase_url?: string;
  supabase_anon_key?: string;
  user_role: 'owner' | 'viewer';
  language?: 'en' | 'ta';
}

export interface VoiceSearchResult {
  product: Product;
  categoryName: string;
  categoryName_ta?: string;
  matchScore: number;
  matchReason?: string;
}

export type SortField = 'name' | 'price' | 'last_price_changed_at' | 'created_at';
export type SortDirection = 'asc' | 'desc';
export type AppLanguage = 'en' | 'ta';
