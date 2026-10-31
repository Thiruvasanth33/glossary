import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Mic,
  Calendar,
  Menu,
  Plus,
  RefreshCw,
  Globe,
  Wifi,
  WifiOff,
  CloudCog,
} from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { VoiceSearchModal } from '../voice/VoiceSearchModal';
import { ProductFormModal } from '../products/ProductFormModal';
import { LoginModal } from '../auth/LoginModal';
import { ShieldCheck, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { settings, refreshData, isLoading, syncStatus } = useGrocery();
  const { language, setLanguage, t } = useTranslation();
  const { isOwner, openLoginModal, logout } = useAuth();
  
  const [globalQuery, setGlobalQuery] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const syncStyles: Record<typeof syncStatus, string> = {
    Connected: 'bg-sky-50 text-sky-700 border-sky-200',
    Synchronizing: 'bg-amber-50 text-amber-700 border-amber-200',
    Synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Offline: 'bg-slate-100 text-slate-600 border-slate-200',
    'Connection Error': 'bg-red-50 text-red-700 border-red-200',
  };
  const SyncIcon = syncStatus === 'Offline'
    ? WifiOff
    : syncStatus === 'Synchronizing'
      ? CloudCog
      : Wifi;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = language === 'ta' ? 'ta-IN' : 'en-IN';
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      setCurrentDateFormatted(now.toLocaleDateString(locale, options));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [language]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalQuery.trim()) {
      navigate(`/prices?q=${encodeURIComponent(globalQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 backdrop-blur">
        {/* Left: Mobile hamburger & Global Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Global Search Bar with Microphone */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="relative">
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

              {/* Voice button inside search bar */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                title={t('header.voiceTitle')}
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Actions: Language Switcher, Date, Refresh, Add Product */}
        <div className="flex items-center gap-1.5 sm:gap-3 pl-2 sm:pl-3 flex-shrink-0">
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold ${syncStyles[syncStatus]}`}
            role="status"
            aria-live="polite"
            title={`Database synchronization: ${syncStatus}`}
          >
            <SyncIcon className={`h-3.5 w-3.5 ${syncStatus === 'Synchronizing' ? 'animate-pulse' : ''}`} />
            <span>{syncStatus}</span>
          </div>
          {/* Visible Language Switcher Pill */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`rounded-lg px-2.5 py-1 transition-all font-sans ${
                language === 'ta'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="தமிழுக்கு மாறுக (Switch to Tamil)"
            >
              தமிழ்
            </button>
          </div>

          {/* Auth Role Pill: Owner vs Viewer */}
          {isOwner ? (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs hover:bg-emerald-100 transition-colors"
                title={language === 'ta' ? 'உரிமையாளர் முறை செயலில் உள்ளது' : 'Owner Mode Active'}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{language === 'ta' ? 'உரிமையாளர்' : 'Owner'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-40 bg-white rounded-xl shadow-lg border border-slate-200 p-1 min-w-[130px]">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{language === 'ta' ? 'வெளியேறு' : 'Lock / Logout'}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors shadow-2xs"
              title={language === 'ta' ? 'உரிமையாளராக உள்நுழைய கிளிக் செய்யவும்' : 'Click to Login as Shop Owner'}
            >
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">{language === 'ta' ? 'பார்வையாளர்' : 'Viewer'}</span>
            </button>
          )}

          {/* Current Date Badge */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{currentDateFormatted}</span>
          </div>

          {/* Refresh data button */}
          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title={t('header.refreshTitle')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Quick Voice Search Pill */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/80 shadow-2xs"
          >
            <Mic className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>{t('header.voiceSearch')}</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={() => {
              if (isOwner) {
                setIsAddModalOpen(true);
              } else {
                openLoginModal();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('header.addProduct')}</span>
            <span className="sm:hidden">{t('header.add')}</span>
          </button>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialQuery={globalQuery}
      />

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
};
