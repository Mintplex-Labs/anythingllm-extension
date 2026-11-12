import React from "react";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const NAV_BUTTON_CLASS =
  "border-none bg-transparent p-0 flex items-center justify-center text-white/70 light:text-slate-700 hover:text-white light:hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed";

/**
 * Question text on the left, pagination and a close-and-skip button on the right.
 * Pagination is hidden for single-question surveys.
 */
export default function Header({
  question,
  index,
  total,
  isSingle,
  onPrev,
  onNext,
  onClose,
  isFirst,
  isLast,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[18px] w-full">
      <p className="flex-1 min-w-0 text-white light:text-slate-900 text-sm font-medium leading-5 break-words">
        {question}
      </p>
      {!isSingle && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrev}
            disabled={isFirst}
            aria-label={t("clarify.previousQuestion")}
            className={NAV_BUTTON_CLASS}
          >
            <CaretLeft size={16} />
          </button>
          <span className="text-xs text-zinc-400 leading-4 whitespace-nowrap select-none">
            {t("clarify.position", { index: index + 1, total })}
          </span>
          <button
            onClick={onNext}
            disabled={isLast}
            aria-label={t("clarify.nextQuestion")}
            className={NAV_BUTTON_CLASS}
          >
            <CaretRight size={16} />
          </button>
        </div>
      )}
      <button
        onClick={onClose}
        aria-label={t("clarify.closeAndSkip")}
        className={`${NAV_BUTTON_CLASS} shrink-0`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
