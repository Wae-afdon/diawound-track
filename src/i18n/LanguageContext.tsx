import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "../data/mockData";
import type { Language } from "../types";
import { translations, type TranslationKey } from "./translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function readInitialLanguage(): Language {
  if (typeof window === "undefined") return "th";
  const stored = window.localStorage.getItem(STORAGE_KEYS.language);
  return stored === "en" || stored === "th" ? stored : "th";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "th" ? "th" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language][key],
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
