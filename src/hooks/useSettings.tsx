import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/translations';

export const APP_ZOOM_MIN = 0.5;
export const APP_ZOOM_MAX = 1.25;
const ZOOM_STEP = 0.05;
const ZOOM_DEFAULT = 1;

function clampZoom(value: number) {
  return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, Math.round(value * 100) / 100));
}

function readStoredZoom(): number {
  const stored = localStorage.getItem('flmr-zoom');
  if (!stored) return ZOOM_DEFAULT;
  const parsed = parseFloat(stored);
  return Number.isNaN(parsed) ? ZOOM_DEFAULT : clampZoom(parsed);
}

interface SettingsContextType {
  theme: 'default' | 'emerald';
  setTheme: (theme: 'default' | 'emerald') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
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

  const [zoom, setZoomState] = useState(readStoredZoom);

  const zoomIn = () => {
    setZoomState((prev) => {
      const next = clampZoom(prev + ZOOM_STEP);
      localStorage.setItem('flmr-zoom', String(next));
      return next;
    });
  };

  const zoomOut = () => {
    setZoomState((prev) => {
      const next = clampZoom(prev - ZOOM_STEP);
      localStorage.setItem('flmr-zoom', String(next));
      return next;
    });
  };

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
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, zoom, zoomIn, zoomOut, t, dir }}>
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
