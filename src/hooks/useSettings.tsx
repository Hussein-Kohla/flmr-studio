import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/translations';

interface SettingsContextType {
  theme: 'default' | 'emerald';
  setTheme: (theme: 'default' | 'emerald') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'default' | 'emerald'>(() => {
    return (localStorage.getItem('flmr-theme') as 'default' | 'emerald') || 'default';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('flmr-lang') as Language) || 'en';
  });

  const setTheme = (newTheme: 'default' | 'emerald') => {
    setThemeState(newTheme);
    localStorage.setItem('flmr-theme', newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('flmr-lang', newLang);
  };

  // Sync theme classes on document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'emerald') {
      root.classList.add('theme-emerald');
    } else {
      root.classList.remove('theme-emerald');
    }
  }, [theme]);

  // Sync direction and lang attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    if (language === 'ar') {
      // Do NOT set dir="rtl" on root to maintain LTR layout,
      // just set the font-cairo class for Arabic typography
      root.classList.add('font-cairo');
    } else {
      root.classList.remove('font-cairo');
    }
  }, [language]);

  const t = (key: TranslationKey): string => {
    const section = translations[language] || translations.en;
    return section[key] || translations.en[key] || String(key);
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t, dir }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
