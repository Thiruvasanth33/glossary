import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Tag,
  PackageCheck,
  FolderTree,
  Mic,
  History,
  Settings,
  ShoppingBasket,
  Zap,
} from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';
import { useTranslation } from '../../i18n/LanguageContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { settings, products } = useGrocery();
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, color: 'text-violet-400' },
    { to: '/prices', label: t('nav.viewPrices'), icon: Tag, color: 'text-sky-400' },
    { to: '/products', label: t('nav.manageProducts'), icon: PackageCheck, badge: products.length, color: 'text-emerald-400' },
    { to: '/categories', label: t('nav.categories'), icon: FolderTree, color: 'text-amber-400' },
    { to: '/voice-search', label: t('nav.voiceSearch'), icon: Mic, highlight: true, color: 'text-rose-400' },
    { to: '/history', label: t('nav.priceHistory'), icon: History, color: 'text-purple-400' },
    { to: '/settings', label: t('nav.settings'), icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <aside className="flex flex-col h-full bg-slate-900 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/30">
          <ShoppingBasket className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-extrabold text-base text-white tracking-tight truncate">
            {settings.shop_name}
          </h1>
          <p className="text-[11px] font-semibold text-violet-400 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>{t('nav.priceManager')}</span>
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {t('nav.storeOperations')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : item.highlight ? 'text-rose-400' : item.color
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Database Mode Card Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Zap
                className={`h-3.5 w-3.5 ${
                  settings.db_mode === 'supabase' ? 'text-violet-400' : 'text-sky-400'
                }`}
              />
              <span>{settings.db_mode === 'supabase' ? t('nav.supabaseSync') : t('nav.localStorageMode')}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            {settings.db_mode === 'supabase'
              ? t('nav.supabaseDesc')
              : t('nav.localStorageDesc')}
          </p>
        </div>
      </div>
    </aside>
  );
};
