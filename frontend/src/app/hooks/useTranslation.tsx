"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import en from "../locales/en.json";
import pt from "../locales/pt.json";
import it from "../locales/it.json";

type Messages = typeof en;
type Locale = "en" | "pt" | "it";

const messagesMap: Record<Locale, Messages> = { en, pt, it };

interface TranslationContextValue {
  locale: Locale;
  t: (key: keyof Messages) => string;
  setLocale: (locale: Locale) => void;
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: "en",
  t: (key) => key,
  setLocale: () => {},
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>(en);

  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith("lang="))?.split("=")[1] as Locale | undefined;
    const detected = stored || (navigator.language.split("-")[0] as Locale);
    const finalLocale: Locale = ["en", "pt", "it"].includes(detected)
      ? detected
      : "en";
    setLocaleState(finalLocale);
    setMessages(messagesMap[finalLocale]);
  }, []);

  function changeLocale(loc: Locale) {
    setLocaleState(loc);
    setMessages(messagesMap[loc]);
    document.cookie = `lang=${loc}; path=/; max-age=31536000`;
  }

  const t = (key: keyof Messages) => messages[key] || key;

  return (
    <TranslationContext.Provider value={{ locale, t, setLocale: changeLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
