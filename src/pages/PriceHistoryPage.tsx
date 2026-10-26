import React, { useState, useMemo } from 'react';
import { useGrocery } from '../context/GroceryContext';
import { useTranslation } from '../i18n/LanguageContext';
import { PriceChangeBadge } from '../components/dashboard/PriceChangeBadge';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  History,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  User,
  Clock,
} from 'lucide-react';

export const PriceHistoryPage: React.FC = () => {
  const { priceHistory, settings } = useGrocery();
  const { language, t } = useTranslation();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'INCREASED' | 'DECREASED'>('ALL');
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');

  // Filtered History (searches both English & Tamil snapshots)
  const filteredHistory = useMemo(() => {
    const now = new Date();

    return priceHistory.filter((item) => {
      // Direction filter
      if (filterDirection === 'INCREASED' && item.price_difference <= 0) return false;
      if (filterDirection === 'DECREASED' && item.price_difference >= 0) return false;

      // Date range filter
      if (filterDateRange !== 'ALL') {
        const itemDate = new Date(item.changed_at);
        const diffMs = now.getTime() - itemDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (filterDateRange === 'TODAY' && diffDays > 1) return false;
        if (filterDateRange === '7DAYS' && diffDays > 7) return false;
        if (filterDateRange === '30DAYS' && diffDays > 30) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNameEn = item.product_name_snapshot.toLowerCase().includes(q);
        const matchNameTa = (item.product_name_snapshot_ta || '').toLowerCase().includes(q);
        const matchBrand = item.brand_snapshot.toLowerCase().includes(q);
        const matchQty = item.quantity_snapshot.toLowerCase().includes(q);
        if (!matchNameEn && !matchNameTa && !matchBrand && !matchQty) return false;
      }

      return true;
    });
  }, [priceHistory, searchQuery, filterDirection, filterDateRange]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalChanges = priceHistory.length;
    const increases = priceHistory.filter((h) => h.price_difference > 0).length;
    const decreases = priceHistory.filter((h) => h.price_difference < 0).length;
    return { totalChanges, increases, decreases };
  }, [priceHistory]);

  const handleExportCSV = () => {
    const headers = [
      'History ID',
      language === 'ta' ? 'தயாரிப்பு snapshot' : 'Product Name Snapshot',
      language === 'ta' ? 'பிராண்ட்' : 'Brand Snapshot',
      language === 'ta' ? 'பொட்டல அளவு' : 'Quantity Snapshot',
      language === 'ta' ? 'முந்தைய விலை (INR)' : 'Previous Price (INR)',
      language === 'ta' ? 'புதிய விலை (INR)' : 'New Price (INR)',
      language === 'ta' ? 'வித்தியாசம் (INR)' : 'Price Difference (INR)',
      language === 'ta' ? 'மாற்றப்பட்ட தேதி & நேரம்' : 'Change Date & Time',
      language === 'ta' ? 'மாற்றியவர்' : 'Changed By',
    ];

    const rows = filteredHistory.map((item) => {
      const displayName = language === 'ta' && item.product_name_snapshot_ta
        ? item.product_name_snapshot_ta
        : item.product_name_snapshot;

      return [
        `"${item.id}"`,
        `"${displayName}"`,
        `"${item.brand_snapshot}"`,
        `"${item.quantity_snapshot}"`,
        item.previous_price,
        item.new_price,
        item.price_difference,
        `"${formatDateTime(item.changed_at)}"`,
        `"${item.changed_by || (language === 'ta' ? 'கடை உரிமையாளர்' : 'Shop Owner')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grocery_price_change_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <History className="h-4 w-4" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('history.title')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('history.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredHistory.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>{t('history.exportCSV')}</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('history.totalChanges')}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalChanges}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <History className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('history.priceIncreases')}</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{stats.increases}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('history.priceDecreases')}</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">-{stats.decreases}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>

        <div>
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value as any)}
            className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm text-slate-800 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          >
            <option value="ALL">{t('history.allChanges')} ({priceHistory.length})</option>
            <option value="INCREASED">{t('history.priceIncreases')} (+)</option>
            <option value="DECREASED">{t('history.priceDecreases')} (-)</option>
          </select>
        </div>

        <div>
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value as any)}
            className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm text-slate-800 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          >
            <option value="ALL">{t('history.allTime')}</option>
            <option value="TODAY">{t('history.last24Hours')}</option>
            <option value="7DAYS">{t('history.last7Days')}</option>
            <option value="30DAYS">{t('history.last30Days')}</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-800">{t('history.noHistory')}</h4>
            <p className="text-xs text-slate-400 mt-1">
              {t('history.noHistoryHint')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5">{t('history.productSnapshot')}</th>
                  <th scope="col" className="px-6 py-3.5">{t('history.brandAndQuantity')}</th>
                  <th scope="col" className="px-6 py-3.5 text-right">{t('history.previousPrice')}</th>
                  <th scope="col" className="px-6 py-3.5 text-right">{t('history.newPrice')}</th>
                  <th scope="col" className="px-6 py-3.5 text-center">{t('history.difference')}</th>
                  <th scope="col" className="px-6 py-3.5">{t('history.changedDateTime')}</th>
                  <th scope="col" className="px-6 py-3.5">{t('history.user')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredHistory.map((item) => {
                  const displayName = language === 'ta' && item.product_name_snapshot_ta
                    ? item.product_name_snapshot_ta
                    : item.product_name_snapshot;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name */}
                      <td className="px-6 py-3.5 font-bold text-slate-900 font-sans">
                        {displayName}
                        {language === 'ta' && item.product_name_snapshot !== displayName && (
                          <div className="text-[11px] text-slate-400 font-normal">{item.product_name_snapshot}</div>
                        )}
                      </td>

                      {/* Brand & Quantity */}
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <span className="font-semibold">{item.brand_snapshot || '—'}</span>
                        <span className="text-slate-400"> • </span>
                        <span>{item.quantity_snapshot}</span>
                      </td>

                      {/* Previous Price */}
                      <td className="px-6 py-3.5 text-right font-medium text-slate-400 line-through">
                        {formatCurrency(item.previous_price, settings.currency_symbol)}
                      </td>

                      {/* New Price */}
                      <td className="px-6 py-3.5 text-right font-extrabold text-slate-900 text-base">
                        {formatCurrency(item.new_price, settings.currency_symbol)}
                      </td>

                      {/* Difference */}
                      <td className="px-6 py-3.5 text-center">
                        <PriceChangeBadge
                          difference={item.price_difference}
                          currencySymbol={settings.currency_symbol}
                          size="md"
                        />
                      </td>

                      {/* Changed Date & Time */}
                      <td className="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(item.changed_at)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium font-sans">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.changed_by || (language === 'ta' ? 'கடை உரிமையாளர்' : 'Shop Owner')}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
