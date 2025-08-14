import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationEN from './locales/en/translation.json';
import translationKO from './locales/ko/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  ko: {
    translation: translationKO
  }
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language if detected language is not available
    debug: true, // Set to false in production
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
