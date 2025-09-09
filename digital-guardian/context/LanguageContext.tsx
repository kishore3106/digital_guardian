import React, { createContext, useState, useContext, ReactNode } from 'react';
import translations from './translations';

type Language = 'en' | 'ta' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is missing
        let fallbackResult = translations.en;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if(fallbackResult === undefined) return key;
        }
        result = fallbackResult;
        break;
      }
    }
    
    let strResult = String(result);

    if (options) {
        Object.keys(options).forEach(optKey => {
            strResult = strResult.replace(`{{${optKey}}}`, String(options[optKey]));
        });
    }

    return strResult;
  };
  

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    {/* FIX: Corrected closing tag for LanguageContext.Provider. It was incorrectly written as </Language-Provider>. */}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};