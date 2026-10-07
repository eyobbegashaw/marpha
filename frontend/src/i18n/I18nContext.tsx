import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface I18nContextType {
  language: Language;
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  isAmharic: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  lang: 'en',
  setLanguage: () => {},
  t: (key, defaultText) => defaultText || key,
  isAmharic: false,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return saved === 'am' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('app_language', newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'am') {
      document.body.classList.add('font-amharic');
    } else {
      document.body.classList.remove('font-amharic');
    }
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key]['en'] || defaultText || key;
    }
    return defaultText || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        lang: language,
        setLanguage,
        t,
        isAmharic: language === 'am',
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
export const useI18n = () => useContext(I18nContext);
