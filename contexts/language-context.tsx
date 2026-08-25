"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  APP_LANGUAGES,
  isLanguage,
  isRtlLanguage,
  translate,
  type Language,
} from "@/lib/i18n";

export type { Language } from "@/lib/i18n";
export { APP_LANGUAGES } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function applyDocumentLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtlLanguage(lang) ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("youneon_language");
      if (stored && isLanguage(stored)) {
        setLanguageState(stored);
        applyDocumentLang(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    applyDocumentLang(lang);
    try {
      localStorage.setItem("youneon_language", lang);
    } catch {
      /* ignore */
    }
    try {
      const raw =
        localStorage.getItem("youneon_pi_session_lite") ||
        localStorage.getItem("youneon_pi_current_user");
      const parsed = raw ? (JSON.parse(raw) as { username?: string }) : null;
      const username = parsed?.username;
      if (username) {
        void import("@/lib/user-settings").then(({ saveLocale }) => saveLocale(username, lang));
      }
    } catch {
      /* ignore */
    }
  };

  const t = (key: string): string => translate(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => translate("en", key),
    };
  }
  return context;
}
