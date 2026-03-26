import { createContext, useContext, useState, type ReactNode } from 'react';
import { TRANSLATIONS } from './constants';

type Language = 'en' | 'hi';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('lang');
        return (saved as Language) || 'en';
    });

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    const t = (key: keyof typeof TRANSLATIONS.en) => {
        return TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || '';
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useTranslation must be used within I18nProvider');
    return context;
}
