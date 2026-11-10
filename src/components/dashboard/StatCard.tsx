import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  colorScheme?: 'emerald' | 'blue' | 'rose' | 'amber' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'emerald',
}) => {
  const schemeStyles = {
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconShadow: 'shadow-emerald-500/30',
      border: 'hover:border-emerald-200',
      accent: 'bg-emerald-50',
    },
    blue: {
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
      iconShadow: 'shadow-sky-500/30',
      border: 'hover:border-sky-200',
      accent: 'bg-sky-50',
    },
    rose: {
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      iconShadow: 'shadow-rose-500/30',
      border: 'hover:border-rose-200',
      accent: 'bg-rose-50',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconShadow: 'shadow-amber-500/30',
      border: 'hover:border-amber-200',
      accent: 'bg-amber-50',
    },
    purple: {
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      iconShadow: 'shadow-violet-500/30',
      border: 'hover:border-violet-200',
      accent: 'bg-violet-50',
    },
  }[colorScheme];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${schemeStyles.border}`}
    >
      {/* Subtle top gradient strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${schemeStyles.iconBg} opacity-60`} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl ${schemeStyles.iconBg} text-white shadow-lg ${schemeStyles.iconShadow}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2.5">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold ${
                trend.isNeutral
                  ? 'text-slate-600'
                  : trend.isPositive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
