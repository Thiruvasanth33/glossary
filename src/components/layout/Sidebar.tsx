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
  Store,
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
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/prices', label: t('nav.viewPrices'), icon: Tag },
    { to: '/products', label: t('nav.manageProducts'), icon: PackageCheck, badge: products.length },
    { to: '/categories', label: t('nav.categories'), icon: FolderTree },
    { to: '/voice-search', label: t('nav.voiceSearch'), icon: Mic, highlight: true },
    { to: '/history', label: t('nav.priceHistory'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
          <Store className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-extrabold text-base text-slate-900 tracking-tight truncate">
            {settings.shop_name}
          </h1>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('nav.priceManager')}</span>
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Database Mode Card Footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  settings.db_mode === 'supabase' ? 'bg-emerald-500' : 'bg-blue-500'
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
