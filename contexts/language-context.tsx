"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar" | "es" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation & Tabs
    "nav.discover": "Discover",
    "nav.messages": "Messages",
    "nav.profile": "Profile",
    "nav.video": "Video",

    // Login Screen
    "login.title": "Log in or sign up",
    "login.subtitle": "Connect with random people from around the world instantly",
    "login.google": "Continue with Google",
    "login.apple": "Continue with Apple",
    "login.or": "or",
    "login.safe": "Safe",
    "login.private": "Private",
    "login.verified": "Verified",
    "login.terms": "By continuing, you accept our",
    "login.terms_link": "terms",

    // Discover Screen
    "discover.welcome": "Welcome back",
    "discover.tagline": "Meet new people – live video chat",
    "discover.online": "online right now",
    "discover.start_chat": "Start Random Video Chat",
    "discover.global": "Global",
    "discover.global_desc": "Around the world",
    "discover.instant": "Instant",
    "discover.instant_desc": "Instant match",
    "discover.safe": "Safe",
    "discover.safe_desc": "Verified users",
    "discover.active_users": "Active Users",
    "discover.live_support": "Live Support",

    // Profile Screen
    "profile.edit": "Edit Profile",
    "profile.settings": "Settings",
    "profile.logout": "Log Out",
    "profile.conversations": "Conversations",
    "profile.minutes": "Minutes",
    "profile.countries": "Countries",
    "profile.languages": "Languages",
    "profile.interests": "Interests",
    "profile.language_setting": "Language",

    // Settings
    "settings.select_language": "Select Language",
    "settings.english": "English",
    "settings.arabic": "العربية",
    "settings.spanish": "Español",
    "settings.french": "Français",

    // Bottom Nav
    "common.loading": "Loading",
  },
  ar: {
    // Navigation & Tabs
    "nav.discover": "اكتشف",
    "nav.messages": "الرسائل",
    "nav.profile": "الملف الشخصي",
    "nav.video": "فيديو",

    // Login Screen
    "login.title": "تسجيل الدخول أو التسجيل",
    "login.subtitle": "اتصل بأشخاص عشوائيين من جميع أنحاء العالم على الفور",
    "login.google": "المتابعة مع Google",
    "login.apple": "المتابعة مع Apple",
    "login.or": "أو",
    "login.safe": "آمن",
    "login.private": "خاص",
    "login.verified": "موثق",
    "login.terms": "بالمتابعة، فإنك توافق على",
    "login.terms_link": "الشروط",

    // Discover Screen
    "discover.welcome": "أهلا بعودتك",
    "discover.tagline": "التقابل بأشخاص جدد - دردشة فيديو مباشرة",
    "discover.online": "متصلون الآن",
    "discover.start_chat": "ابدأ دردشة فيديو عشوائية",
    "discover.global": "عالمي",
    "discover.global_desc": "حول العالم",
    "discover.instant": "فوري",
    "discover.instant_desc": "مطابقة فورية",
    "discover.safe": "آمن",
    "discover.safe_desc": "مستخدمون موثقون",
    "discover.active_users": "المستخدمون النشطون",
    "discover.live_support": "الدعم المباشر",

    // Profile Screen
    "profile.edit": "تعديل الملف الشخصي",
    "profile.settings": "الإعدادات",
    "profile.logout": "تسجيل الخروج",
    "profile.conversations": "المحادثات",
    "profile.minutes": "دقائق",
    "profile.countries": "الدول",
    "profile.languages": "اللغات",
    "profile.interests": "الاهتمامات",
    "profile.language_setting": "اللغة",

    // Settings
    "settings.select_language": "اختر اللغة",
    "settings.english": "English",
    "settings.arabic": "العربية",
    "settings.spanish": "Español",
    "settings.french": "Français",

    // Bottom Nav
    "common.loading": "جاري التحميل",
  },
  es: {
    // Navigation & Tabs
    "nav.discover": "Descubrir",
    "nav.messages": "Mensajes",
    "nav.profile": "Perfil",
    "nav.video": "Video",

    // Login Screen
    "login.title": "Inicia sesión o regístrate",
    "login.subtitle": "Conecta con personas aleatorias de todo el mundo al instante",
    "login.google": "Continuar con Google",
    "login.apple": "Continuar con Apple",
    "login.or": "o",
    "login.safe": "Seguro",
    "login.private": "Privado",
    "login.verified": "Verificado",
    "login.terms": "Al continuar, aceptas nuestros",
    "login.terms_link": "términos",

    // Discover Screen
    "discover.welcome": "Bienvenido de vuelta",
    "discover.tagline": "Conoce gente nueva – videochat en directo",
    "discover.online": "en línea ahora",
    "discover.start_chat": "Iniciar chat de video aleatorio",
    "discover.global": "Global",
    "discover.global_desc": "En todo el mundo",
    "discover.instant": "Instantáneo",
    "discover.instant_desc": "Coincidencia instantánea",
    "discover.safe": "Seguro",
    "discover.safe_desc": "Usuarios verificados",
    "discover.active_users": "Usuarios activos",
    "discover.live_support": "Soporte en vivo",

    // Profile Screen
    "profile.edit": "Editar perfil",
    "profile.settings": "Configuración",
    "profile.logout": "Cerrar sesión",
    "profile.conversations": "Conversaciones",
    "profile.minutes": "Minutos",
    "profile.countries": "Países",
    "profile.languages": "Idiomas",
    "profile.interests": "Intereses",
    "profile.language_setting": "Idioma",

    // Settings
    "settings.select_language": "Seleccionar idioma",
    "settings.english": "English",
    "settings.arabic": "العربية",
    "settings.spanish": "Español",
    "settings.french": "Français",

    // Bottom Nav
    "common.loading": "Cargando",
  },
  fr: {
    // Navigation & Tabs
    "nav.discover": "Découvrir",
    "nav.messages": "Messages",
    "nav.profile": "Profil",
    "nav.video": "Vidéo",

    // Login Screen
    "login.title": "Connectez-vous ou inscrivez-vous",
    "login.subtitle": "Connectez-vous avec des personnes aléatoires du monde entier instantanément",
    "login.google": "Continuer avec Google",
    "login.apple": "Continuer avec Apple",
    "login.or": "ou",
    "login.safe": "Sécurisé",
    "login.private": "Privé",
    "login.verified": "Vérifié",
    "login.terms": "En continuant, vous acceptez nos",
    "login.terms_link": "conditions",

    // Discover Screen
    "discover.welcome": "Bienvenue",
    "discover.tagline": "Rencontrez de nouvelles personnes – vidéo en direct",
    "discover.online": "en ligne maintenant",
    "discover.start_chat": "Démarrer un chat vidéo aléatoire",
    "discover.global": "Global",
    "discover.global_desc": "Dans le monde entier",
    "discover.instant": "Instantané",
    "discover.instant_desc": "Correspondance instantanée",
    "discover.safe": "Sécurisé",
    "discover.safe_desc": "Utilisateurs vérifiés",
    "discover.active_users": "Utilisateurs actifs",
    "discover.live_support": "Support en direct",

    // Profile Screen
    "profile.edit": "Modifier le profil",
    "profile.settings": "Paramètres",
    "profile.logout": "Déconnexion",
    "profile.conversations": "Conversations",
    "profile.minutes": "Minutes",
    "profile.countries": "Pays",
    "profile.languages": "Langues",
    "profile.interests": "Intérêts",
    "profile.language_setting": "Langue",

    // Settings
    "settings.select_language": "Sélectionner la langue",
    "settings.english": "English",
    "settings.arabic": "العربية",
    "settings.spanish": "Español",
    "settings.french": "Français",

    // Bottom Nav
    "common.loading": "Chargement",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        const stored = localStorage.getItem("youneon_language") as Language | null;
        if (stored && ["en", "ar", "es", "fr"].includes(stored)) {
          setLanguageState(stored);
        }
      }
    } catch (e) {
      // Silently fail - localStorage not available
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof window !== "undefined" && typeof Storage !== "undefined") {
        localStorage.setItem("youneon_language", lang);
      }
    } catch (e) {
      // Silently fail - localStorage not available
    }
  };

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)?.[key] || key;
  };

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
      t: (key: string) => key,
    };
  }
  return context;
}
