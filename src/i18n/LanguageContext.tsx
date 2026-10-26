import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppLanguage, Translations } from './types';
import { en } from './translations/en';
import { ta } from './translations/ta';
import { translateCategoryName, translateProductName, translateUnit } from './groceryGlossary';

const STORAGE_LANG_KEY = 'freshprice_lang';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  isTamil: boolean;
  t: (path: string, params?: Record<string, string | number>) => string;
  getCategoryName: (category: { name: string; name_ta?: string }) => string;
  getProductName: (product: { name: string; name_ta?: string }) => string;
  getUnitName: (unit: string) => string;
}

const dictionaries: Record<AppLanguage, Translations> = { en, ta };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    return saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: any = dictionaries[language];

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          // Fallback to English
          let fallback: any = dictionaries['en'];
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = path;
              break;
            }
          }
          current = fallback;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      let result = current;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }
      return result;
    },
    [language]
  );

  const getCategoryName = useCallback(
    (category: { name: string; name_ta?: string }) => {
      return translateCategoryName(category, language);
    },
    [language]
  );

  const getProductName = useCallback(
    (product: { name: string; name_ta?: string }) => {
      return translateProductName(product, language);
    },
    [language]
  );

  const getUnitName = useCallback(
    (unit: string) => {
      return translateUnit(unit, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isTamil: language === 'ta',
        t,
        getCategoryName,
        getProductName,
        getUnitName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
