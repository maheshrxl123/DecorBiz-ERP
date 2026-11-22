/**
 * DecorBiz Bilingual i18n Utility (English & Hindi)
 * Supports reactive React updates via useI18n() hook per PRD Section 5.1 & Section 22.
 */

import { useSyncExternalStore } from 'react';
import enDict from './en.json';
import hiDict from './hi.json';

export type Language = 'en' | 'hi';

class I18nManager {
  private currentLanguage: Language = 'en';
  private listeners = new Set<(lang: Language) => void>();

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('decorbiz_language');
      if (saved === 'hi' || saved === 'en') {
        this.currentLanguage = saved;
      }
      this.applyDocumentLang(this.currentLanguage);
    }
  }

  private applyDocumentLang(lang: Language) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }

  get language(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('decorbiz_language', lang);
    }
    this.applyDocumentLang(lang);
    this.listeners.forEach((cb) => cb(lang));
  }

  subscribe = (cb: (lang: Language) => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getSnapshot = (): Language => this.currentLanguage;

  t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    const dict = this.currentLanguage === 'hi' ? hiDict : enDict;

    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        let engFallback: any = enDict;
        for (const k of keys) {
          if (engFallback && typeof engFallback === 'object' && k in engFallback) {
            engFallback = engFallback[k];
          } else {
            return fallback || path;
          }
        }
        return typeof engFallback === 'string' ? engFallback : fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };
}

export const i18n = new I18nManager();
export const t = (path: string, fallback?: string) => i18n.t(path, fallback);

/**
 * Reactive React hook — re-renders subscribing components immediately on English/Hindi switch.
 */
export function useI18n() {
  const lang = useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, () => 'en' as Language);
  return {
    lang,
    isHindi: lang === 'hi',
    t: i18n.t,
    setLanguage: (next: Language) => i18n.setLanguage(next),
    toggleLanguage: () => i18n.setLanguage(lang === 'en' ? 'hi' : 'en'),
  };
}
