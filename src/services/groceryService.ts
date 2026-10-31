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

export type SyncStatus = 'Connected' | 'Synchronizing' | 'Synced' | 'Offline' | 'Connection Error';
type SyncCallback = (event: { type: 'CATEGORIES' | 'PRODUCTS' | 'PRICE_HISTORY' | 'ALL' }) => void;
const syncListeners: Set<SyncCallback> = new Set();
let realtimeChannel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>['channel']> | null = null;
let realtimeSubscriberCount = 0;

export function resetRealtimeSubscription() {
  if (realtimeChannel) {
    try {
      getSupabase()?.removeChannel(realtimeChannel);
    } catch {
      // ignore
    }
    realtimeChannel = null;
    realtimeSubscriberCount = 0;
  }
}

export function subscribeToDataChanges(callback: SyncCallback, statusCallback?: (status: SyncStatus) => void): () => void {
  syncListeners.add(callback);
  realtimeSubscriberCount += 1;

  const initChannel = () => {
    const supabase = getSupabase();
    if (supabase && !realtimeChannel) {
      statusCallback?.('Synchronizing');
      realtimeChannel = supabase
        .channel('grocery-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          statusCallback?.('Synchronizing');
          callback({ type: 'CATEGORIES' });
          setTimeout(() => statusCallback?.('Synced'), 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          statusCallback?.('Synchronizing');
          callback({ type: 'PRODUCTS' });
          setTimeout(() => statusCallback?.('Synced'), 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'price_history' }, () => {
          statusCallback?.('Synchronizing');
          callback({ type: 'PRICE_HISTORY' });
          setTimeout(() => statusCallback?.('Synced'), 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          statusCallback?.('Synchronizing');
          callback({ type: 'ALL' });
          setTimeout(() => statusCallback?.('Synced'), 500);
        })
        .subscribe((channelStatus) => {
          if (channelStatus === 'SUBSCRIBED') {
            statusCallback?.('Synced');
          } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
            statusCallback?.('Connection Error');
          } else if (channelStatus === 'CLOSED') {
            statusCallback?.('Offline');
          } else {
            statusCallback?.('Connected');
          }
        });
    } else if (!supabase) {
      statusCallback?.('Offline');
    } else {
      statusCallback?.('Connected');
    }
  };

  initChannel();

  return () => {
    syncListeners.delete(callback);
    realtimeSubscriberCount -= 1;
    if (realtimeSubscriberCount <= 0 && realtimeChannel) {
      try {
        getSupabase()?.removeChannel(realtimeChannel);
      } catch {
        // ignore
      }
      realtimeChannel = null;
      realtimeSubscriberCount = 0;
    }
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
  async getSettings(): Promise<ShopSettings> {
    const supabase = getSupabase();
    if (!supabase) return getLocalSettings();
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'shop').single();
      if (error) return getLocalSettings();
      return data ? {
        shop_name: data.shop_name,
        currency_symbol: data.currency_symbol,
        currency_code: data.currency_code,
        default_voice_language: data.default_voice_language,
        db_mode: data.db_mode,
        user_role: data.user_role,
        language: data.language,
      } : getLocalSettings();
    } catch {
      return getLocalSettings();
    }
  },

  async updateSettings(settings: ShopSettings): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      setLocalSettings(settings);
      return;
    }
    const { error } = await supabase.from('settings').upsert({
      id: 'shop',
      ...settings,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },

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
        if (!error && data) {
          return data as Category[];
        }
        throw new Error(error?.message || 'Failed to load categories');
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to load categories from Supabase');
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
        throw new Error(error?.message || 'Supabase rejected the category insert');
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Supabase category insert failed');
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
        throw new Error(error?.message || 'Supabase rejected the category update');
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Supabase category update failed');
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
          const { error } = await supabase.from('categories').update({ display_order: cat.display_order }).eq('id', cat.id);
          if (error) throw new Error(error.message);
        }
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : 'Failed to save category order');
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
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Supabase category delete failed');
      }
      notifyDataChange('CATEGORIES');
      return;
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
        if (!error && data) {
          setLocalProducts(data as Product[]);
          return data as Product[];
        }
        throw new Error(error?.message || 'Failed to load products');
      } catch (err: any) {
        console.warn('Supabase getProducts failed, using local cache:', err);
        const cached = getLocalProducts();
        if (cached && cached.length > 0) return cached;
        throw new Error(err?.message || 'Failed to load products from Supabase');
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
        throw new Error(error?.message || 'Supabase rejected the product insert');
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Supabase product insert failed');
      }
    }

    const list = getLocalProducts();
    list.push(newProduct);
    setLocalProducts(list);
    notifyDataChange('PRODUCTS');
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>, changedBy = 'Shop Owner'): Promise<Product> {
    const supabase = getSupabase();
    let currentProduct: Product | undefined;

    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      currentProduct = data as Product;
    } else {
      currentProduct = getLocalProducts().find((p) => p.id === id);
    }
    if (!currentProduct) {
      throw new Error('Product not found');
    }

    const now = new Date().toISOString();
    const hasPriceChanged = updates.price !== undefined && updates.price !== currentProduct.price;

    // Build update object
    let updatedProduct: Product = {
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

    if (supabase) {
      const updatePayload: any = { ...updates, updated_at: now };
      if (hasPriceChanged) updatePayload.last_price_changed_at = now;

      const { data, error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      updatedProduct = data as Product;

      if (hasPriceChanged) {
        const qtyStr = `${currentProduct.quantity_value} ${currentProduct.quantity_unit}`;
        try {
          await supabase.from('price_history').insert({
            id: generateUUID(),
            product_id: currentProduct.id,
            product_name_snapshot: updatedProduct.name,
            product_name_snapshot_ta: updatedProduct.name_ta || null,
            brand_snapshot: updatedProduct.brand || '',
            quantity_snapshot: qtyStr,
            previous_price: currentProduct.price,
            new_price: updates.price!,
            price_difference: updates.price! - currentProduct.price,
            changed_at: now,
            changed_by: changedBy,
          });
        } catch (histErr) {
          console.warn('Supabase price_history insert warning:', histErr);
        }
      }
    }

    const products = getLocalProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) products[idx] = updatedProduct;
    setLocalProducts(products);

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

    const supabase = getSupabase();
    let current: Product | undefined;
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      current = data as Product;
    } else {
      current = getLocalProducts().find((p) => p.id === id);
    }
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
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : 'Supabase product delete failed');
      }
      notifyDataChange('PRODUCTS');
      return;
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
        if (!error && data) {
          return data as PriceHistory[];
        }
        throw new Error(error?.message || 'Failed to load price history');
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to load price history from Supabase');
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
