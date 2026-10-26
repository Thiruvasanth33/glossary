import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface PriceChangeBadgeProps {
  difference: number;
  currencySymbol?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const PriceChangeBadge: React.FC<PriceChangeBadgeProps> = ({
  difference,
  currencySymbol = '₹',
  showIcon = true,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;
  const isZero = difference === 0;

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs font-semibold';

  if (isZero) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
        {showIcon && <Minus className="h-3 w-3" />}
        <span>{t('common.noChange')}</span>
      </span>
    );
  }

  if (isIncrease) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        {showIcon && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
        <span>+{formatCurrency(difference, currencySymbol)}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
      {showIcon && <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
      <span>-{formatCurrency(Math.abs(difference), currencySymbol)}</span>
    </span>
  );
};
