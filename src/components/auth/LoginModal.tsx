import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { ShieldCheck, Lock, KeyRound, X } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const { language } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin.trim()) {
      setError(language === 'ta' ? 'PIN குறியீட்டை உள்ளிடவும்' : 'Please enter your PIN');
      return;
    }
    const success = login(pin);
    if (success) {
      setPin('');
    } else {
      setError(language === 'ta' ? 'தவறான PIN குறியீடு. மீண்டும் முயல்க.' : 'Incorrect PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeLoginModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 z-10">
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-4">
            <Lock className="h-7 w-7" />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
            {language === 'ta' ? 'கடை உரிமையாளர் உள்நுழைவு' : 'Shop Owner Login'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans">
            {language === 'ta'
              ? 'விலைகளைத் திருத்தவும், பொருட்களை நிர்வகிக்கவும் உங்கள் 4-இலக்க PIN குறியீட்டை உள்ளிடவும்.'
              : 'Enter your 4-digit Owner PIN to edit prices, manage products, and update store settings.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-sans">
              {language === 'ta' ? 'உரிமையாளர் PIN' : 'Owner PIN'}
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-center text-xl font-bold tracking-widest text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
            {error && <p className="text-xs font-medium text-rose-600 mt-1.5">{error}</p>}
          </div>

          <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
            <span>{language === 'ta' ? 'இயல்புநிலை PIN:' : 'Default PIN:'}</span>
            <span className="font-mono font-bold bg-amber-100 px-2 py-0.5 rounded text-amber-900">1234</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeLoginModal}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors font-sans"
            >
              {language === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 font-sans"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{language === 'ta' ? 'திறக்கவும்' : 'Unlock Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
