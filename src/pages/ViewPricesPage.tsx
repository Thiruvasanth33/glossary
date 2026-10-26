import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Product, SortField, SortDirection } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { QuickPriceModal } from '../components/products/QuickPriceModal';
import { ProductFormModal } from '../components/products/ProductFormModal';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Edit3,
  SlidersHorizontal,
  Printer,
  Download,
  Plus,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

export const ViewPricesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { categories, products, settings } = useGrocery();
  const { language, t, getProductName, getCategoryName, getUnitName } = useTranslation();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Accordion collapsed state for category sections
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync search query from URL query params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  // Unique brands list for filter
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) {
        brands.add(p.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Category map
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filtered and Sorted Products (matches English & Tamil names)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category_id !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) {
        return false;
      }
      // Text search query
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
  }, [products, selectedCategory, selectedBrand, searchQuery, categoryMap]);

  // Group filtered products by Category ordered by category.display_order
  const groupedProducts = useMemo(() => {
    const groups: Array<{ category: { id: string; name: string; name_ta?: string; display_order: number }; products: Product[] }> = [];

    // Sort categories by display_order
    const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

    sortedCategories.forEach((cat) => {
      let prodsInCat = filteredProducts.filter((p) => p.category_id === cat.id);

      // Apply sorting within each category
      prodsInCat.sort((a, b) => {
        if (sortField === 'name') {
          const nameA = language === 'ta' && a.name_ta ? a.name_ta : a.name;
          const nameB = language === 'ta' && b.name_ta ? b.name_ta : b.name;
          return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (sortField === 'price') {
          return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
        }
        if (sortField === 'last_price_changed_at') {
          const timeA = new Date(a.last_price_changed_at).getTime();
          const timeB = new Date(b.last_price_changed_at).getTime();
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
        return 0;
      });

      if (prodsInCat.length > 0 || (selectedCategory === 'ALL' && !searchQuery.trim() && selectedBrand === 'ALL')) {
        groups.push({
          category: cat,
          products: prodsInCat,
        });
      }
    });

    return groups;
  }, [categories, filteredProducts, sortField, sortDirection, selectedCategory, searchQuery, selectedBrand, language]);

  // Expand all by default on first load
  useEffect(() => {
    if (categories.length > 0 && Object.keys(expandedCategories).length === 0) {
      const initial: Record<string, boolean> = {};
      categories.forEach((c) => {
        initial[c.id] = true;
      });
      setExpandedCategories(initial);
    }
  }, [categories]);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const updated: Record<string, boolean> = {};
    categories.forEach((c) => (updated[c.id] = true));
    setExpandedCategories(updated);
  };

  const handleCollapseAll = () => {
    const updated: Record<string, boolean> = {};
    categories.forEach((c) => (updated[c.id] = false));
    setExpandedCategories(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      language === 'ta' ? 'வகை' : 'Category',
      language === 'ta' ? 'தயாரிப்பு பெயர்' : 'Product Name',
      language === 'ta' ? 'பிராண்ட்' : 'Brand',
      language === 'ta' ? 'பொட்டல அளவு' : 'Quantity',
      language === 'ta' ? 'விற்பனை விலை (INR)' : 'Selling Price (INR)',
      language === 'ta' ? 'கடைசி விலை மாற்றம்' : 'Last Price Changed',
    ];

    const rows = filteredProducts.map((p) => {
      const cat = categoryMap.get(p.category_id);
      const catName = cat ? getCategoryName(cat) : 'General';
      const prodName = getProductName(p);
      return [
        `"${catName}"`,
        `"${prodName}"`,
        `"${p.brand}"`,
        `"${p.quantity_value} ${p.quantity_unit}"`,
        p.price,
        `"${formatDateTime(p.last_price_changed_at)}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grocery_price_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Tag className="h-4 w-4" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('prices.title')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('prices.subtitle')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            {t('prices.expandAll')}
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            {t('prices.collapseAll')}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title={t('prices.printTitle')}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t('prices.print')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title={t('prices.exportCSV')}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t('prices.exportCSV')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('header.addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Field */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('prices.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Category Filter */}
          <div>
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

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm text-slate-800 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            >
              <option value="ALL">{t('prices.allBrands')} ({allBrands.length})</option>
              {allBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm text-slate-800 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
            >
              <option value="name">{t('prices.sortName')}</option>
              <option value="price">{t('prices.sortPrice')}</option>
              <option value="last_price_changed_at">{t('prices.sortDate')}</option>
            </select>

            <button
              type="button"
              onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="rounded-xl border border-slate-300 p-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title={`Direction: ${sortDirection.toUpperCase()}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Summary Tags if active */}
        {(searchQuery || selectedCategory !== 'ALL' || selectedBrand !== 'ALL') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">{t('prices.activeFilters')}</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">×</button>
              </span>
            )}
            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                {categoryMap.get(selectedCategory) ? getCategoryName(categoryMap.get(selectedCategory)!) : selectedCategory}
                <button onClick={() => setSelectedCategory('ALL')} className="hover:text-rose-600">×</button>
              </span>
            )}
            {selectedBrand !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200">
                {selectedBrand}
                <button onClick={() => setSelectedBrand('ALL')} className="hover:text-rose-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedBrand('ALL');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline ml-1"
            >
              {t('prices.resetAll')}
            </button>
          </div>
        )}
      </div>

      {/* Category Grouped Sections */}
      {groupedProducts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <p className="text-base font-bold text-slate-700">{t('prices.noProductsFound')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('prices.noProductsHint')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedProducts.map(({ category, products: catProducts }) => {
            const isExpanded = expandedCategories[category.id] ?? true;
            const displayCatName = getCategoryName(category);

            return (
              <div
                key={category.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all"
              >
                {/* Category Header Accordion Bar */}
                <div
                  onClick={() => toggleCategoryExpand(category.id)}
                  className="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 hover:bg-slate-100/70 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label="Toggle section"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 font-sans">
                        <span>{displayCatName}</span>
                        {language === 'ta' && category.name !== displayCatName && (
                          <span className="text-xs text-slate-400 font-normal">({category.name})</span>
                        )}
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700">
                          {catProducts.length}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700 hover:underline">
                    {isExpanded ? t('prices.collapse') : t('prices.expand')}
                  </span>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div>
                    {catProducts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {t('prices.noProductsInCategory')}
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                              <tr>
                                <th scope="col" className="px-6 py-3.5">
                                  {t('prices.productName')}
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                  {t('prices.brand')}
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                  {t('prices.packageQuantity')}
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-right">
                                  {t('prices.sellingPrice')}
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                  {t('prices.lastPriceChanged')}
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-right">
                                  {t('prices.actions')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              {catProducts.map((p) => {
                                const displayProdName = getProductName(p);
                                const displayUnit = getUnitName(p.quantity_unit);

                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                                    {/* Product Name */}
                                    <td className="px-6 py-3.5 font-bold text-slate-900 font-sans">
                                      {displayProdName}
                                      {language === 'ta' && p.name !== displayProdName && (
                                        <span className="block text-[11px] font-normal text-slate-400">
                                          {p.name}
                                        </span>
                                      )}
                                      {p.sku && (
                                        <span className="block text-[10px] font-normal text-slate-400">
                                          SKU: {p.sku}
                                        </span>
                                      )}
                                    </td>

                                    {/* Brand */}
                                    <td className="px-6 py-3.5 font-medium text-slate-600">
                                      {p.brand || '—'}
                                    </td>

                                    {/* Quantity */}
                                    <td className="px-6 py-3.5 font-semibold text-slate-700">
                                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                                        {p.quantity_value} {displayUnit}
                                      </span>
                                    </td>

                                    {/* Price */}
                                    <td className="px-6 py-3.5 text-right">
                                      <span className="text-base font-extrabold text-emerald-600">
                                        {formatCurrency(p.price, settings.currency_symbol)}
                                      </span>
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
                                          onClick={() => setSelectedProductForPrice(p)}
                                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                                          title={t('prices.updatePrice')}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>{t('prices.updatePrice')}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setProductToEdit(p)}
                                          className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                          title={t('prices.editDetails')}
                                        >
                                          <SlidersHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="block md:hidden divide-y divide-slate-100 p-3">
                          {catProducts.map((p) => {
                            const displayProdName = getProductName(p);
                            const displayUnit = getUnitName(p.quantity_unit);

                            return (
                              <div key={p.id} className="py-3 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm font-sans">{displayProdName}</h4>
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
                                    <span className="text-base font-extrabold text-emerald-600">
                                      {formatCurrency(p.price, settings.currency_symbol)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[11px] text-slate-400">
                                    {formatDateTime(p.last_price_changed_at)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProductForPrice(p)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>{t('prices.updatePrice')}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setProductToEdit(p)}
                                      className="rounded-lg border border-slate-200 p-1 text-slate-400"
                                      title={t('prices.editDetails')}
                                    >
                                      <SlidersHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QuickPriceModal
        product={selectedProductForPrice}
        isOpen={Boolean(selectedProductForPrice)}
        onClose={() => setSelectedProductForPrice(null)}
      />

      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ProductFormModal
        isOpen={Boolean(productToEdit)}
        productToEdit={productToEdit}
        onClose={() => setProductToEdit(null)}
      />
    </div>
  );
};
