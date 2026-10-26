import { Category, Product, PriceHistory, ShopSettings } from '../types/index.ts';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_PRICE_HISTORY, DEFAULT_SETTINGS } from '../lib/constants.ts';
import { generateUUID } from '../utils/formatters.ts';
import { getSupabase } from '../lib/supabase.ts';

const STORAGE_KEYS = {
  CATEGORIES: 'freshprice_categories',
  PRODUCTS: 'freshprice_products',
  PRICE_HISTORY: 'freshprice_price_history',
  SETTINGS: 'freshprice_settings',
};

// Cross-tab broadcast channel for immediate multi-tab sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('freshprice_sync_channel');
  }
} catch {
  // BroadcastChannel might be restricted in some iframe contexts
}

type SyncCallback = (event: { type: 'CATEGORIES' | 'PRODUCTS' | 'PRICE_HISTORY' | 'ALL' }) => void;
const syncListeners: Set<SyncCallback> = new Set();

export function subscribeToDataChanges(callback: SyncCallback): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}

function notifyDataChange(type: 'CATEGORIES' | 'PRODUCTS' | 'PRICE_HISTORY' | 'ALL') {
  syncListeners.forEach((cb) => {
    try {
      cb({ type });
    } catch (e) {
      console.error('Error in sync listener', e);
    }
  });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type });
    } catch {
      // ignore
    }
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const type = event.data?.type || 'ALL';
    syncListeners.forEach((cb) => cb({ type }));
  };
}

// Storage helpers with initial fallback seed data
function getLocalCategories(): Category[] {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    return SEED_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_CATEGORIES;
  }
}

function setLocalCategories(cats: Category[]) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
}

function getLocalProducts(): Product[] {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    return SEED_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_PRODUCTS;
  }
}

function setLocalProducts(prods: Product[]) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
}

function getLocalPriceHistory(): PriceHistory[] {
  const data = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(SEED_PRICE_HISTORY));
    return SEED_PRICE_HISTORY;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_PRICE_HISTORY;
  }
}

function setLocalPriceHistory(history: PriceHistory[]) {
  localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(history));
}

export function getLocalSettings(): ShopSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setLocalSettings(settings: ShopSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export const groceryService = {
  // -------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Category[];
        }
      } catch (err) {
        console.warn('Falling back to local categories:', err);
      }
    }
    return getLocalCategories().sort((a, b) => a.display_order - b.display_order);
  },

  async addCategory(name: string, displayOrder?: number): Promise<Category> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');

    const supabase = getSupabase();
    const categories = await this.getCategories();

    // Check duplicate
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Category "${trimmed}" already exists`);
    }

    const order = displayOrder !== undefined ? displayOrder : (categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 1);
    const now = new Date().toISOString();

    const newCategory: Category = {
      id: generateUUID(),
      name: trimmed,
      display_order: order,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('categories').insert(newCategory).select().single();
        if (!error && data) {
          notifyDataChange('CATEGORIES');
          return data as Category;
        }
      } catch (err) {
        console.warn('Supabase addCategory failed, saving locally:', err);
      }
    }

    const localList = getLocalCategories();
    localList.push(newCategory);
    setLocalCategories(localList);
    notifyDataChange('CATEGORIES');
    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          notifyDataChange('CATEGORIES');
          return data as Category;
        }
      } catch (err) {
        console.warn('Supabase updateCategory failed:', err);
      }
    }

    const list = getLocalCategories();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');

    const updated = { ...list[index], ...updates, updated_at: now };
    list[index] = updated;
    setLocalCategories(list);
    notifyDataChange('CATEGORIES');
    return updated;
  },

  async reorderCategories(orderedCategoryIds: string[]): Promise<void> {
    const list = getLocalCategories();
    const idToCat = new Map(list.map((c) => [c.id, c]));

    const reordered: Category[] = [];
    orderedCategoryIds.forEach((id, index) => {
      const cat = idToCat.get(id);
      if (cat) {
        cat.display_order = index + 1;
        cat.updated_at = new Date().toISOString();
        reordered.push(cat);
      }
    });

    setLocalCategories(reordered);

    const supabase = getSupabase();
    if (supabase) {
      try {
        for (const cat of reordered) {
          await supabase.from('categories').update({ display_order: cat.display_order }).eq('id', cat.id);
        }
      } catch (e) {
        console.warn('Failed to update category order in Supabase:', e);
      }
    }

    notifyDataChange('CATEGORIES');
  },

  async deleteCategory(id: string, reassignToCategoryId?: string): Promise<void> {
    const products = await this.getProducts();
    const productsInCategory = products.filter((p) => p.category_id === id);

    if (productsInCategory.length > 0 && !reassignToCategoryId) {
      throw new Error(`Cannot delete category with ${productsInCategory.length} products without reassigning them.`);
    }

    // Reassign products if necessary
    if (productsInCategory.length > 0 && reassignToCategoryId) {
      for (const prod of productsInCategory) {
        await this.updateProduct(prod.id, { category_id: reassignToCategoryId });
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteCategory error:', err);
      }
    }

    const list = getLocalCategories().filter((c) => c.id !== id);
    setLocalCategories(list);
    notifyDataChange('CATEGORIES');
  },

  // -------------------------------------------------------------
  // Products
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Product[];
        }
      } catch (err) {
        console.warn('Falling back to local products:', err);
      }
    }
    return getLocalProducts();
  },

  async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'last_price_changed_at'>): Promise<Product> {
    if (productData.price < 0) {
      throw new Error('Price cannot be negative');
    }
    if (!productData.name.trim()) {
      throw new Error('Product name is required');
    }
    if (!productData.category_id) {
      throw new Error('Category selection is required');
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
      last_price_changed_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').insert(newProduct).select().single();
        if (!error && data) {
          notifyDataChange('PRODUCTS');
          return data as Product;
        }
      } catch (err) {
        console.warn('Supabase addProduct failed, falling back to local:', err);
      }
    }

    const list = getLocalProducts();
    list.push(newProduct);
    setLocalProducts(list);
    notifyDataChange('PRODUCTS');
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>, changedBy = 'Shop Owner'): Promise<Product> {
    const products = getLocalProducts();
    const currentProduct = products.find((p) => p.id === id);
    if (!currentProduct) {
      throw new Error('Product not found');
    }

    const now = new Date().toISOString();
    const hasPriceChanged = updates.price !== undefined && updates.price !== currentProduct.price;

    // Build update object
    const updatedProduct: Product = {
      ...currentProduct,
      ...updates,
      updated_at: now,
      // CRITICAL REQUIREMENT: last_price_changed_at updates ONLY when the price actually changes!
      last_price_changed_at: hasPriceChanged ? now : currentProduct.last_price_changed_at,
    };

    if (hasPriceChanged) {
      const oldPrice = currentProduct.price;
      const newPrice = updates.price!;
      const diff = newPrice - oldPrice;
      const qtyStr = `${currentProduct.quantity_value} ${currentProduct.quantity_unit}`;

      // Create history record
      const historyItem: PriceHistory = {
        id: generateUUID(),
        product_id: currentProduct.id,
        product_name_snapshot: currentProduct.name,
        product_name_snapshot_ta: currentProduct.name_ta,
        brand_snapshot: currentProduct.brand || '',
        quantity_snapshot: qtyStr,
        previous_price: oldPrice,
        new_price: newPrice,
        price_difference: diff,
        changed_at: now,
        changed_by: changedBy,
      };

      const historyList = getLocalPriceHistory();
      historyList.unshift(historyItem);
      setLocalPriceHistory(historyList);
    }

    // Update in local array
    const idx = products.findIndex((p) => p.id === id);
    products[idx] = updatedProduct;
    setLocalProducts(products);

    // Try Supabase if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('products').update(updatedProduct).eq('id', id);
        if (hasPriceChanged) {
          const qtyStr = `${currentProduct.quantity_value} ${currentProduct.quantity_unit}`;
          await supabase.from('price_history').insert({
            product_id: currentProduct.id,
            product_name_snapshot: currentProduct.name,
            brand_snapshot: currentProduct.brand || '',
            quantity_snapshot: qtyStr,
            previous_price: currentProduct.price,
            new_price: updates.price,
            price_difference: updates.price! - currentProduct.price,
            changed_at: now,
            changed_by: changedBy,
          });
        }
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    notifyDataChange('PRODUCTS');
    if (hasPriceChanged) {
      notifyDataChange('PRICE_HISTORY');
    }

    return updatedProduct;
  },

  async updateProductPrice(id: string, newPrice: number, changedBy = 'Shop Owner'): Promise<{ product: Product; changed: boolean; historyItem?: PriceHistory }> {
    if (isNaN(newPrice) || newPrice < 0) {
      throw new Error('Valid non-negative price required');
    }

    const products = getLocalProducts();
    const current = products.find((p) => p.id === id);
    if (!current) {
      throw new Error('Product not found');
    }

    // If price hasn't changed, do NOT create history or update timestamp
    if (current.price === newPrice) {
      return { product: current, changed: false };
    }

    const updated = await this.updateProduct(id, { price: newPrice }, changedBy);
    const historyList = getLocalPriceHistory();
    const historyItem = historyList[0];

    return { product: updated, changed: true, historyItem };
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete product failed:', e);
      }
    }

    const list = getLocalProducts().filter((p) => p.id !== id);
    setLocalProducts(list);
    notifyDataChange('PRODUCTS');
  },

  // -------------------------------------------------------------
  // Price History
  // -------------------------------------------------------------
  async getPriceHistory(): Promise<PriceHistory[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .order('changed_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as PriceHistory[];
        }
      } catch (err) {
        console.warn('Falling back to local price history:', err);
      }
    }
    return getLocalPriceHistory().sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  },

  // -------------------------------------------------------------
  // Reset and Seed Functions
  // -------------------------------------------------------------
  async resetToSampleData(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(SEED_PRICE_HISTORY));
    notifyDataChange('ALL');
  },

  async clearAllData(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify([]));
    notifyDataChange('ALL');
  },
};
