import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { useGrocery } from '../../context/GroceryContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { PriceChangeBadge } from '../dashboard/PriceChangeBadge';
import { ArrowRight, Sparkles } from 'lucide-react';

interface QuickPriceModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { updateProductPrice, settings } = useGrocery();
  const { language, t, getProductName, getUnitName } = useTranslation();

  const [newPrice, setNewPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setNewPrice(product.price.toString());
      setError(null);
    }
  }, [product, isOpen]);

  if (!product) return null;

  const currentPrice = product.price;
  const parsedNewPrice = parseFloat(newPrice);
  const isValid = !isNaN(parsedNewPrice) && parsedNewPrice >= 0;
  const difference = isValid ? parsedNewPrice - currentPrice : 0;
  const isUnchanged = isValid && parsedNewPrice === currentPrice;

  const displayName = getProductName(product);
  const displayUnit = getUnitName(product.quantity_unit);

  const handleAdjust = (delta: number) => {
    const base = isNaN(parsedNewPrice) ? currentPrice : parsedNewPrice;
    const adjusted = Math.max(0, base + delta);
    setNewPrice(adjusted.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(
        language === 'ta'
          ? 'தயவுசெய்து சரியான விலையை உள்ளிடவும் (0 அல்லது அதற்கு மேல்).'
          : 'Please enter a valid price (greater than or equal to 0).'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await updateProductPrice(product.id, parsedNewPrice);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update price');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('quickPrice.title')}
      subtitle={`${displayName} • ${product.brand} (${product.quantity_value} ${displayUnit})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Comparison card */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('quickPrice.currentPrice')}</span>
            <div className="mt-1 text-2xl font-bold text-slate-700">
              {formatCurrency(currentPrice, settings.currency_symbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('quickPrice.currentlyActive')}</p>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <span>{t('quickPrice.newPrice')}</span>
              <Sparkles className="w-3 h-3 text-emerald-500" />
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-600">
              {isValid ? formatCurrency(parsedNewPrice, settings.currency_symbol) : '—'}
            </div>
            <div className="mt-1">
              {isValid && <PriceChangeBadge difference={difference} currencySymbol={settings.currency_symbol} size="sm" />}
            </div>
          </div>
        </div>

        {/* Input field */}
        <div>
          <label htmlFor="priceInput" className="block text-sm font-semibold text-slate-800">
            {t('quickPrice.enterNewPrice')} ({settings.currency_symbol})
          </label>
          <div className="relative mt-2 rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <span className="font-bold text-slate-600 text-lg">{settings.currency_symbol}</span>
            </div>
            <input
              id="priceInput"
              type="number"
              step="any"
              min="0"
              autoFocus
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value);
                if (error) setError(null);
              }}
              className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-slate-900 text-lg font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="0.00"
            />
          </div>
          {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
        </div>

        {/* Quick Stepper Buttons */}
        <div>
          <span className="text-xs font-medium text-slate-500 mb-2 block">{t('quickPrice.quickAdjustments')}</span>
          <div className="flex flex-wrap gap-2">
            {[-10, -5, -2, -1, 1, 2, 5, 10, 20].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => handleAdjust(delta)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  delta > 0
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
                    : 'border-slate-200 text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Audit trail notice */}
        <div className="rounded-xl bg-blue-50/80 p-3 text-xs text-blue-800 border border-blue-200/60 leading-relaxed font-sans">
          {isUnchanged ? (
            <span>{t('quickPrice.unchangedNotice')}</span>
          ) : (
            <span>{t('quickPrice.auditNotice')}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              t('common.saving')
            ) : (
              <>
                <span>{t('quickPrice.savePrice')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
