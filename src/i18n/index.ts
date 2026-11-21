/**
 * DecorBiz Bilingual i18n Utility
 * Supports English and Hindi as per PRD Section 5.1 & Section 22
 */

import enDict from './en.json';
import hiDict from './hi.json';

export type Language = 'en' | 'hi';

class I18nManager {
  private currentLanguage: Language = 'en';
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    const saved = localStorage.getItem('decorbiz_language');
    if (saved === 'hi' || saved === 'en') {
      this.currentLanguage = saved;
    }
  }

  get language(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('decorbiz_language', lang);
    this.listeners.forEach((cb) => cb(lang));
  }

  subscribe(cb: (lang: Language) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  t(path: string, fallback?: string): string {
    const keys = path.split('.');
    const dict = this.currentLanguage === 'hi' ? hiDict : enDict;
    
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary if not found in Hindi
        let engFallback: any = enDict;
        for (const k of keys) {
          if (engFallback && typeof engFallback === 'object' && k in engFallback) {
            engFallback = engFallback[k];
          } else {
            return fallback || path;
          }
        }
        return typeof engFallback === 'string' ? engFallback : (fallback || path);
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  }
}

export const i18n = new I18nManager();
export const t = (path: string, fallback?: string) => i18n.t(path, fallback);
