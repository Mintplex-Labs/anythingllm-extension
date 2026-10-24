import React, { useEffect } from "react";
import { CaretDown, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_SETTING_KEY } from "@/i18n";
import useLocalSetting from "@/hooks/useLocalSetting";
import { resources } from "@/locales/resources";

const LANGUAGES = Object.keys(resources);
const languageNames = new Intl.DisplayNames(LANGUAGES, { type: "language" });

/**
 * Covers the panel with the extension's local preferences.
 * @param {Object} props
 * @param {() => void} props.onClose
 */
export default function Settings({ onClose }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useLocalSetting(LANGUAGE_SETTING_KEY, "");

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-zinc-900 light:bg-white animate-in fade-in-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 light:border-slate-200">
        <p className="text-sm font-semibold text-white light:text-slate-900">
          {t("settings.title")}
        </p>
        <button
          onClick={onClose}
          aria-label={t("settings.close")}
          className="border-none bg-transparent flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 light:text-slate-500 hover:bg-zinc-800 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-2">
        <label
          htmlFor="settings-language"
          className="text-sm font-medium text-white light:text-slate-900"
        >
          {t("settings.language.title")}
        </label>
        <p className="text-xs text-zinc-400 light:text-slate-500">
          {t("settings.language.description")}
        </p>
        <div className="relative">
          <select
            id="settings-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none w-full h-[34px] pl-3 pr-9 text-sm rounded-lg outline-none cursor-pointer bg-zinc-800 border border-zinc-800 text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-900 focus:border-sky-500 light:focus:border-sky-500"
          >
            <option value="">{t("settings.language.browser")}</option>
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {languageNames.of(code)}
              </option>
            ))}
          </select>
          <CaretDown
            size={14}
            weight="bold"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 light:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
