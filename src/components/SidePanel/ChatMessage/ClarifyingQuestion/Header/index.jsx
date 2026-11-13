import React from "react";
import { X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

/**
 * Question text on the left, a close-and-skip button on the right.
 */
export default function Header({ question, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[18px] w-full">
      <p className="flex-1 min-w-0 text-white light:text-slate-900 text-sm font-medium leading-5 break-words">
        {question}
      </p>
      <button
        onClick={onClose}
        aria-label={t("clarify.closeAndSkip")}
        className="border-none bg-transparent p-0 flex items-center justify-center shrink-0 text-white/70 light:text-slate-700 hover:text-white light:hover:text-slate-900"
      >
        <X size={16} />
      </button>
    </div>
  );
}
