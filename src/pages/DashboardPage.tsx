import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { StatCard } from '../components/dashboard/StatCard';
import { PriceChangeBadge } from '../components/dashboard/PriceChangeBadge';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatters';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { QuickPriceModal } from '../components/products/QuickPriceModal';
import { VoiceSearchModal } from '../components/voice/VoiceSearchModal';
import { Product } from '../types';
import {
  FolderTree,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  History,
  Plus,
  Mic,
  ArrowRight,
  Search,
  Sparkles,
  Clock,
  Edit3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, products, priceHistory, settings } = useGrocery();
  const { language, t, getProductName, getCategoryName } = useTranslation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Real database metrics calculation
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = products.length;

    // Price change metrics derived from price_history
    const increasedCount = priceHistory.filter((h) => h.price_difference > 0).length;
    const decreasedCount = priceHistory.filter((h) => h.price_difference < 0).length;

    // Recently changed products (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChanges = priceHistory.filter(
      (h) => new Date(h.changed_at) >= sevenDaysAgo
    ).length;

    return {
      totalCategories,
      totalProducts,
      increasedCount,
      decreasedCount,
      recentChanges,
    };
  }, [categories, products, priceHistory]);

  // Categories map for lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filtered products for quick search widget (searches both English and Tamil names)
  const quickFilteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter((p) => {
        const cat = categoryMap.get(p.category_id);
        const catNameEn = cat?.name.toLowerCase() || '';
        const catNameTa = cat?.name_ta?.toLowerCase() || '';
        const prodNameEn = p.name.toLowerCase();
        const prodNameTa = (p.name_ta || '').toLowerCase();
        const brandEn = (p.brand || '').toLowerCase();
        const qtyStr = `${p.quantity_value} ${p.quantity_unit}`.toLowerCase();

        return (
          prodNameEn.includes(q) ||
          prodNameTa.includes(q) ||
          brandEn.includes(q) ||
          catNameEn.includes(q) ||
          catNameTa.includes(q) ||
          qtyStr.includes(q)
        );
      })
      .slice(0, 6);
  }, [searchQuery, products, categoryMap]);

  // 5 Most recently updated price items
  const recentPriceHistory = useMemo(() => {
    return priceHistory.slice(0, 5);
  }, [priceHistory]);

  // 5 Most recently added products
  const recentlyAddedProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 md:p-8 text-white shadow-xl shadow-emerald-950/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
            <span>{t('dashboard.badge')}</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings.shop_name}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-xl">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur transition-all"
          >
            <Mic className="h-4 w-4 text-emerald-300 animate-pulse" />
            <span>{t('header.voiceSearch')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition-all"
          >
            <Plus className="h-4 w-4 text-emerald-700" />
            <span>{t('header.addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t('dashboard.totalCategories')}
          value={stats.totalCategories}
          subtitle={t('dashboard.managedInStore')}
          icon={FolderTree}
          colorScheme="blue"
        />
        <StatCard
          title={t('dashboard.totalProducts')}
          value={stats.totalProducts}
          subtitle={t('dashboard.inventoryItems')}
          icon={PackageCheck}
          colorScheme="emerald"
        />
        <StatCard
          title={t('dashboard.recentChanges')}
          value={stats.recentChanges}
          subtitle={t('dashboard.last7Days')}
          icon={History}
          colorScheme="purple"
        />
        <StatCard
          title={t('dashboard.priceIncreases')}
          value={stats.increasedCount}
          trend={{ value: `+${stats.increasedCount}`, isPositive: true }}
          icon={TrendingUp}
          colorScheme="amber"
        />
        <StatCard
          title={t('dashboard.priceDecreases')}
          value={stats.decreasedCount}
          trend={{ value: `-${stats.decreasedCount}`, isPositive: false }}
          icon={TrendingDown}
          colorScheme="rose"
        />
      </div>

      {/* Quick Search Widget */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('dashboard.instantPriceChecker')}</h3>
            <p className="text-xs text-slate-500">{t('dashboard.instantPriceSubtitle')}</p>
          </div>
          <button
            onClick={() => navigate('/prices')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 self-start"
          >
            <span>{t('dashboard.viewFullPriceList')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.quickSearchPlaceholder')}
            className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="absolute right-2 top-2 p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            title={t('header.voiceTitle')}
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        {/* Live Search Quick Results */}
        {searchQuery.trim() && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            {quickFilteredProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">
                {t('dashboard.noSearchResults', { query: searchQuery })}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {quickFilteredProducts.map((p) => {
                  const displayProdName = getProductName(p);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{displayProdName}</h5>
                        {language === 'ta' && p.name !== displayProdName && (
                          <p className="text-[10px] text-slate-400">{p.name}</p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {p.brand} • {p.quantity_value} {p.quantity_unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600">
                          {formatCurrency(p.price, settings.currency_symbol)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductForPrice(p)}
                          className="block text-[10px] text-emerald-700 hover:underline font-semibold mt-0.5"
                        >
                          {t('dashboard.editPrice')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two Column Layout: Recently Changed Prices vs Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Changed Product Prices */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('dashboard.recentlyUpdatedPrices')}</h3>
                  <p className="text-xs text-slate-500">{t('dashboard.priceAuditRecords')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentPriceHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                {t('dashboard.noPriceChanges')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPriceHistory.map((item) => {
                  const displayName = language === 'ta' && item.product_name_snapshot_ta
                    ? item.product_name_snapshot_ta
                    : item.product_name_snapshot;

                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {displayName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {item.brand_snapshot ? `${item.brand_snapshot} • ` : ''}
                          {item.quantity_snapshot}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(item.changed_at)}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.previous_price, settings.currency_symbol)}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(item.new_price, settings.currency_symbol)}
                        </div>
                        <div className="mt-0.5">
                          <PriceChangeBadge
                            difference={item.price_difference}
                            currencySymbol={settings.currency_symbol}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Products */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('dashboard.recentlyAddedProducts')}</h3>
                  <p className="text-xs text-slate-500">{t('dashboard.inventoryCatalogEntries')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>{t('dashboard.manage')}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentlyAddedProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                {t('dashboard.noProducts')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentlyAddedProducts.map((p) => {
                  const cat = categoryMap.get(p.category_id);
                  const displayCatName = cat ? getCategoryName(cat) : 'General';
                  const displayProdName = getProductName(p);

                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {displayCatName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{displayProdName}</h4>
                        <p className="text-xs text-slate-500">
                          {p.brand} • {p.quantity_value} {p.quantity_unit}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 flex items-center gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-emerald-600">
                            {formatCurrency(p.price, settings.currency_symbol)}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(p.created_at)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProductForPrice(p)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title={t('dashboard.editPrice')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Shortcuts */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">{t('dashboard.categoryShortcuts')}</h3>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>{t('dashboard.manageCategories')}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const displayCatName = getCategoryName(cat);
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/prices?category=${encodeURIComponent(cat.id)}`)}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all text-left group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate w-full font-sans">
                  {displayCatName}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {t('dashboard.productsCount', { count })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <QuickPriceModal
        product={selectedProductForPrice}
        isOpen={Boolean(selectedProductForPrice)}
        onClose={() => setSelectedProductForPrice(null)}
      />

      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};
