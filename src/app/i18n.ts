import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar/translation.json';
import en from './locales/en/translation.json';

export const defaultLanguage = 'ar';
export const languageStorageKey = 'finance_nouh_language';

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey);
  return storedLanguage === 'en' || storedLanguage === 'ar' ? storedLanguage : defaultLanguage;
}

void i18n.use(initReactI18next).init({
  resources: {
    ar: {
      translation: ar,
    },
    en: {
      translation: en,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
