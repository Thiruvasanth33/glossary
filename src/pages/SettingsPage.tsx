import React, { useState } from 'react';
import { useGrocery } from '../context/GroceryContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/LanguageContext';
import { testSupabaseConnection, resetSupabaseClient } from '../lib/supabase';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Settings,
  Store,
  Database,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  Languages,
  Globe,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToSampleData } = useGrocery();
  const { language, setLanguage, t } = useTranslation();
  const toast = useToast();

  // Settings form states
  const [shopName, setShopName] = useState(settings.shop_name);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [voiceLang, setVoiceLang] = useState(settings.default_voice_language);
  const [userRole, setUserRole] = useState(settings.user_role);

  // Supabase connection configuration states
  const [supabaseUrl, setSupabaseUrl] = useState(
    (typeof localStorage !== 'undefined' && localStorage.getItem('freshprice_supabase_url')) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    (typeof localStorage !== 'undefined' && localStorage.getItem('freshprice_supabase_anon_key')) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || ''
  );
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shop_name: shopName.trim() || 'Grocery Store',
      currency_symbol: currencySymbol.trim() || '₹',
      default_voice_language: voiceLang,
      user_role: userRole,
    });
  };

  const handleTestAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = supabaseUrl.trim();
    const key = supabaseKey.trim();

    if (!url || !key) {
      // Revert to local mode
      localStorage.removeItem('freshprice_supabase_url');
      localStorage.removeItem('freshprice_supabase_anon_key');
      resetSupabaseClient();
      updateSettings({ db_mode: 'local' });
      setConnResult({
        success: true,
        message: language === 'ta' ? 'சான்றுகள் நீக்கப்பட்டன. உள்ளக உலாவி சேமிப்பு முறைக்கு மாறியது.' : 'Credentials removed. Switched to Persistent Local Storage Mode.',
      });
      toast.info(language === 'ta' ? 'உள்ளக முறைக்கு மாறியது' : 'Switched to Local Mode', language === 'ta' ? 'நிரந்தர உலாவி சேமிப்பைப் பயன்படுத்துகிறது.' : 'Now using persistent browser storage.');
      return;
    }

    setIsTestingConn(true);
    setConnResult(null);

    const testRes = await testSupabaseConnection(url, key);
    setIsTestingConn(false);
    setConnResult(testRes);

    if (testRes.success) {
      localStorage.setItem('freshprice_supabase_url', url);
      localStorage.setItem('freshprice_supabase_anon_key', key);
      resetSupabaseClient();
      updateSettings({
        db_mode: 'supabase',
        supabase_url: url,
        supabase_anon_key: key,
      });
      toast.success(language === 'ta' ? 'Supabase இணைக்கப்பட்டது' : 'Supabase Connected', language === 'ta' ? 'தரவுத்தள சான்றுகள் சேமிக்கப்பட்டு சரிபார்க்கப்பட்டன.' : 'Database credentials saved and verified.');
    } else {
      toast.error(language === 'ta' ? 'இணைப்பு தோல்வியடைந்தது' : 'Connection Failed', testRes.message);
    }
  };

  const handleResetSampleData = async () => {
    await resetToSampleData();
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Settings className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Selection Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">{t('header.language')} (Website Language)</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 border font-semibold text-sm transition-all ${
              language === 'en'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="font-bold">English</span>
            {language === 'en' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 border font-semibold text-sm transition-all font-sans ${
              language === 'ta'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="font-bold">தமிழ் (Tamil)</span>
            {language === 'ta' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {language === 'ta'
            ? 'இணையதளம் முழுவதும் தூய தமிழில் மொழிபெயர்க்கப்பட்டு உடனடியாகக் காண்பிக்கப்படுகிறது.'
            : 'Instantly changes the entire interface to English or Tamil with persistent storage.'}
        </p>
      </div>

      {/* Grid: General Settings & Voice Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Store Preferences */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">{t('settings.shopIdentity')}</h3>
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('settings.shopName')}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sri Murugan Grocery Store"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('settings.currencySymbol')}
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="₹"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('settings.accessMode')}
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
                >
                  <option value="owner">{t('settings.owner')}</option>
                  <option value="viewer">{t('settings.viewer')}</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{t('settings.savePreferences')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Voice Recognition Settings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">{t('settings.voiceConfig')}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('settings.defaultVoiceLang')}
              </label>
              <select
                value={voiceLang}
                onChange={(e) => {
                  setVoiceLang(e.target.value as any);
                  updateSettings({ default_voice_language: e.target.value as any });
                }}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
              >
                <option value="ta-IN">Tamil (India) - ta-IN (தமிழ்)</option>
                <option value="en-IN">English (India) - en-IN</option>
                <option value="en-US">English (US) - en-US</option>
              </select>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-emerald-600" />
                <span>{t('settings.bilingualSupport')}</span>
              </p>
              <p className="leading-relaxed">
                {t('settings.bilingualHint')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection & Multi-Device Synchronization */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('settings.databaseSync')}</h3>
              <p className="text-xs text-slate-500">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              settings.db_mode === 'supabase'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                settings.db_mode === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <span>{settings.db_mode === 'supabase' ? t('settings.supabaseActive') : t('settings.localActive')}</span>
          </span>
        </div>

        {/* Informative description banner */}
        <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-800">{t('settings.howStorageWorks')}</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
            <li>{t('settings.localModeDesc')}</li>
            <li>{t('settings.supabaseModeDesc')}</li>
          </ul>
        </div>

        {/* Supabase Connection Form */}
        <form onSubmit={handleTestAndSaveSupabase} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('settings.supabaseUrl')}
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('settings.supabaseAnonKey')}
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('settings.keyWarning')}
            </p>
          </div>

          {/* Connection Result Message */}
          {connResult && (
            <div
              className={`rounded-xl p-3 text-xs border flex items-start gap-2 ${
                connResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {connResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{connResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isTestingConn}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isTestingConn ? (
                t('settings.testingConn')
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('settings.testAndSave')}</span>
                </>
              )}
            </button>

            {supabaseUrl && (
              <button
                type="button"
                onClick={() => {
                  setSupabaseUrl('');
                  setSupabaseKey('');
                }}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t('settings.clearCreds')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Database Maintenance & Catalog Reset */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">{t('settings.catalogMaintenance')}</h3>
        <p className="text-xs text-slate-500 mb-4">
          {t('settings.catalogMaintenanceDesc')}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>{t('settings.loadSampleData')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSampleData}
        title={t('settings.loadSampleModalTitle')}
        message={t('settings.loadSampleModalDesc')}
        confirmText={t('settings.loadSampleData')}
        cancelText={t('common.cancel')}
        variant="primary"
      />
    </div>
  );
};
