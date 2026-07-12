import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationES from './locales/es/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

const savedLanguage = localStorage.getItem('motogp_language') || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // idioma recuperado o por defecto Castellano
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already protects from xss
    }
  });

export default i18n;
