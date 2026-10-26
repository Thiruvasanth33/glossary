import React, { useState, useMemo } from 'react';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Product } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { QuickPriceModal } from '../components/products/QuickPriceModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  PackageCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
} from 'lucide-react';

export const ManageProductsPage: React.FC = () => {
  const { products, categories, settings, deleteProduct } = useGrocery();
  const { language, t, getProductName, getCategoryName, getUnitName } = useTranslation();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productForPriceEdit, setProductForPriceEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category map
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filtered Products (searches both English & Tamil names)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category_id !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = categoryMap.get(p.category_id);
        const matchNameEn = p.name.toLowerCase().includes(q);
        const matchNameTa = (p.name_ta || '').toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchCatEn = (cat?.name || '').toLowerCase().includes(q);
        const matchCatTa = (cat?.name_ta || '').toLowerCase().includes(q);
        const matchQty = `${p.quantity_value} ${p.quantity_unit}`.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q) || false;
        if (!matchNameEn && !matchNameTa && !matchBrand && !matchCatEn && !matchCatTa && !matchQty && !matchSku) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, categoryMap]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch {
      // error handled in context toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <PackageCheck className="h-4 w-4" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('manage.title')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('manage.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('manage.addProduct')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('manage.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm text-slate-800 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          >
            <option value="ALL">{t('prices.allCategories')} ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getCategoryName(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Desktop / Cards Mobile */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-800">{t('manage.noMatching')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('manage.noMatchingHint')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">{t('manage.category')}</th>
                    <th scope="col" className="px-6 py-3.5">{t('manage.product')}</th>
                    <th scope="col" className="px-6 py-3.5">{t('manage.brand')}</th>
                    <th scope="col" className="px-6 py-3.5">{t('manage.packageSize')}</th>
                    <th scope="col" className="px-6 py-3.5 text-right">{t('manage.sellingPrice')}</th>
                    <th scope="col" className="px-6 py-3.5">{t('manage.lastPriceChanged')}</th>
                    <th scope="col" className="px-6 py-3.5 text-right">{t('manage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredProducts.map((p) => {
                    const cat = categoryMap.get(p.category_id);
                    const displayCatName = cat ? getCategoryName(cat) : 'General';
                    const displayProdName = getProductName(p);
                    const displayUnit = getUnitName(p.quantity_unit);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Category */}
                        <td className="px-6 py-3.5">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 font-sans">
                            {displayCatName}
                          </span>
                        </td>

                        {/* Name & SKU */}
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-900 font-sans">{displayProdName}</div>
                          {language === 'ta' && p.name !== displayProdName && (
                            <div className="text-[11px] text-slate-400">{p.name}</div>
                          )}
                          {p.sku && <div className="text-[10px] text-slate-400">SKU: {p.sku}</div>}
                        </td>

                        {/* Brand */}
                        <td className="px-6 py-3.5 font-medium text-slate-600">
                          {p.brand || '—'}
                        </td>

                        {/* Package Quantity */}
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {p.quantity_value} {displayUnit}
                        </td>

                        {/* Selling Price */}
                        <td className="px-6 py-3.5 text-right font-extrabold text-emerald-600 text-base">
                          {formatCurrency(p.price, settings.currency_symbol)}
                        </td>

                        {/* Last Changed */}
                        <td className="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(p.last_price_changed_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setProductForPriceEdit(p)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 shadow-2xs transition-colors"
                              title={t('prices.updatePrice')}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>{t('manage.price')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToEdit(p)}
                              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title={t('manage.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className="rounded-xl border border-rose-200 p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title={t('manage.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block lg:hidden divide-y divide-slate-100 p-4">
              {filteredProducts.map((p) => {
                const cat = categoryMap.get(p.category_id);
                const displayCatName = cat ? getCategoryName(cat) : 'General';
                const displayProdName = getProductName(p);
                const displayUnit = getUnitName(p.quantity_unit);

                return (
                  <div key={p.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-sans">
                          {displayCatName}
                        </span>
                        <h4 className="mt-1 font-bold text-slate-900 text-sm font-sans">{displayProdName}</h4>
                        {language === 'ta' && p.name !== displayProdName && (
                          <p className="text-[10px] text-slate-400">{p.name}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p.brand ? `${p.brand} • ` : ''}
                          <span className="font-semibold text-slate-700">
                            {p.quantity_value} {displayUnit}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-600">
                          {formatCurrency(p.price, settings.currency_symbol)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>{t('manage.updated')} {formatDateTime(p.last_price_changed_at)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => setProductForPriceEdit(p)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{t('manage.price')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToEdit(p)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t('manage.edit')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(p)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('manage.delete')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ProductFormModal
        isOpen={Boolean(productToEdit)}
        productToEdit={productToEdit}
        onClose={() => setProductToEdit(null)}
      />

      <QuickPriceModal
        product={productForPriceEdit}
        isOpen={Boolean(productForPriceEdit)}
        onClose={() => setProductForPriceEdit(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('manage.deleteConfirmTitle')}
        message={t('manage.deleteConfirmMessage', {
          name: productToDelete ? `${getProductName(productToDelete)} (${productToDelete.brand}, ${productToDelete.quantity_value} ${productToDelete.quantity_unit})` : '',
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={isDeleting}
      />
    </div>
  );
};
