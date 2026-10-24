import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { defaultNS, resources } from "./locales/resources";

// Extension storage key for the language picked in Settings; empty follows the browser.
export const LANGUAGE_SETTING_KEY = "language";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    debug: import.meta.env.DEV,
    defaultNS,
    resources,
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false,
    },
    // A language picked in Settings is kept in extension storage below, so
    // detection only reads the browser's language and never caches it.
    detection: {
      order: ["navigator"],
      caches: [],
    },
  });

function applyLanguageSetting(language) {
  i18next.changeLanguage(language || undefined);
}

chrome.storage.local
  .get(LANGUAGE_SETTING_KEY)
  .then(
    (stored) =>
      stored[LANGUAGE_SETTING_KEY] &&
      applyLanguageSetting(stored[LANGUAGE_SETTING_KEY])
  );
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && LANGUAGE_SETTING_KEY in changes)
    applyLanguageSetting(changes[LANGUAGE_SETTING_KEY].newValue);
});

export default i18next;
