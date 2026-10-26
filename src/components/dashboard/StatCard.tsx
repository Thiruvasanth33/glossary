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
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      ring: 'group-hover:border-emerald-300',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      ring: 'group-hover:border-blue-300',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      ring: 'group-hover:border-rose-300',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      ring: 'group-hover:border-amber-300',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      ring: 'group-hover:border-purple-300',
    },
  }[colorScheme];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${schemeStyles.ring}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${schemeStyles.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2.5">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
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
