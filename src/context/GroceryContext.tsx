import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Product, PriceHistory, ShopSettings } from '../types';
import { groceryService, subscribeToDataChanges, getLocalSettings, setLocalSettings, SyncStatus } from '../services/groceryService';
import { useToast } from './ToastContext';
import { formatCurrency } from '../utils/formatters';

interface GroceryContextType {
  categories: Category[];
  products: Product[];
  priceHistory: PriceHistory[];
  settings: ShopSettings;
  isLoading: boolean;
  syncStatus: SyncStatus;
  // Category operations
  addCategory: (name: string, displayOrder?: number) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  // Product operations
  addProduct: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'last_price_changed_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  updateProductPrice: (id: string, newPrice: number) => Promise<{ product: Product; changed: boolean }>;
  deleteProduct: (id: string) => Promise<void>;
  // Settings operations
  updateSettings: (updates: Partial<ShopSettings>) => Promise<void>;
  resetToSampleData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getLocalSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('Connected');

  const toast = useToast();

  const loadAllData = useCallback(async () => {
    try {
      const [cats, prods, hist] = await Promise.all([
        groceryService.getCategories(),
        groceryService.getProducts(),
        groceryService.getPriceHistory(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setPriceHistory(hist);
      const cloudSettings = await groceryService.getSettings();
      setSettings(cloudSettings);
    } catch (err: any) {
      console.error('Failed to load grocery data:', err);
      toast.error('Data Loading Error', err?.message || 'Failed to sync grocery database');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial load and cross-tab sync subscription
  useEffect(() => {
    loadAllData();

    // Listen for changes from other tabs or local operations
    const unsubscribe = subscribeToDataChanges(() => {
      loadAllData();
    }, (status) => {
      setSyncStatus(navigator.onLine ? status : 'Offline');
    });

    const handleOnline = () => setSyncStatus('Connected');
    const handleOffline = () => setSyncStatus('Offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadAllData]);

  // CATEGORY OPERATIONS
  const addCategory = async (name: string, displayOrder?: number): Promise<Category> => {
    try {
      const newCat = await groceryService.addCategory(name, displayOrder);
      await loadAllData();
      toast.success('Category Added', `Category "${newCat.name}" was successfully created.`);
      return newCat;
    } catch (err: any) {
      toast.error('Failed to Add Category', err.message);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
    try {
      const updated = await groceryService.updateCategory(id, updates);
      await loadAllData();
      toast.success('Category Updated', `Category "${updated.name}" has been updated.`);
      return updated;
    } catch (err: any) {
      toast.error('Failed to Update Category', err.message);
      throw err;
    }
  };

  const deleteCategory = async (id: string, reassignToCategoryId?: string): Promise<void> => {
    try {
      const cat = categories.find((c) => c.id === id);
      await groceryService.deleteCategory(id, reassignToCategoryId);
      await loadAllData();
      toast.success('Category Deleted', `Category "${cat?.name || ''}" removed successfully.`);
    } catch (err: any) {
      toast.error('Failed to Delete Category', err.message);
      throw err;
    }
  };

  const reorderCategories = async (orderedIds: string[]): Promise<void> => {
    try {
      await groceryService.reorderCategories(orderedIds);
      await loadAllData();
      toast.success('Category Order Saved', 'Category display order updated successfully.');
    } catch (err: any) {
      toast.error('Failed to Reorder Categories', err.message);
      throw err;
    }
  };

  // PRODUCT OPERATIONS
  const addProduct = async (
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'last_price_changed_at'>
  ): Promise<Product> => {
    try {
      const newProd = await groceryService.addProduct(productData);
      await loadAllData();
      toast.success('Product Added', `"${newProd.name} (${newProd.brand})" added at ${formatCurrency(newProd.price, settings.currency_symbol)}.`);
      return newProd;
    } catch (err: any) {
      toast.error('Failed to Add Product', err.message);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    try {
      const updated = await groceryService.updateProduct(id, updates);
      await loadAllData();
      toast.success('Product Updated', `Details for "${updated.name}" saved successfully.`);
      return updated;
    } catch (err: any) {
      toast.error('Failed to Update Product', err.message);
      throw err;
    }
  };

  /**
   * Authoritative price update function:
   * Updates price, records price history only when price actually changes,
   * updates last_price_changed_at timestamp, and synchronizes across all pages.
   */
  const updateProductPrice = async (id: string, newPrice: number): Promise<{ product: Product; changed: boolean }> => {
    try {
      const current = products.find((p) => p.id === id);
      const oldPrice = current?.price ?? 0;
      const res = await groceryService.updateProductPrice(id, newPrice);

      await loadAllData();

      if (res.changed) {
        const diff = newPrice - oldPrice;
        const diffText = diff > 0 ? `+${formatCurrency(diff, settings.currency_symbol)}` : `-${formatCurrency(Math.abs(diff), settings.currency_symbol)}`;
        toast.success(
          'Price Updated Successfully',
          `${res.product.name} changed from ${formatCurrency(oldPrice, settings.currency_symbol)} to ${formatCurrency(newPrice, settings.currency_symbol)} (${diffText})`
        );
      } else {
        toast.info('Price Unchanged', `The price for "${res.product.name}" remains ${formatCurrency(newPrice, settings.currency_symbol)}.`);
      }

      return res;
    } catch (err: any) {
      toast.error('Failed to Update Price', err.message);
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      const p = products.find((item) => item.id === id);
      await groceryService.deleteProduct(id);
      await loadAllData();
      toast.success('Product Deleted', `"${p?.name || 'Product'}" has been removed.`);
    } catch (err: any) {
      toast.error('Failed to Delete Product', err.message);
      throw err;
    }
  };

  // SETTINGS OPERATIONS
  const updateSettings = async (updates: Partial<ShopSettings>) => {
    const updated = { ...settings, ...updates };
    setLocalSettings(updated);
    await groceryService.updateSettings(updated);
    setSettings(updated);
    toast.success('Settings Saved', 'Shop configuration has been updated.');
  };

  const resetToSampleData = async () => {
    try {
      await groceryService.resetToSampleData();
      await loadAllData();
      toast.success('Sample Data Loaded', 'Sample grocery products, categories, and price history restored.');
    } catch (err: any) {
      toast.error('Reset Failed', err.message);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadAllData();
    toast.info('Data Refreshed', 'Latest grocery prices loaded.');
  };

  return (
    <GroceryContext.Provider
      value={{
        categories,
        products,
        priceHistory,
        settings,
        isLoading,
        syncStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addProduct,
        updateProduct,
        updateProductPrice,
        deleteProduct,
        updateSettings,
        resetToSampleData,
        refreshData,
      }}
    >
      {children}
    </GroceryContext.Provider>
  );
};

export function useGrocery() {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGrocery must be used within a GroceryProvider');
  }
  return context;
}
