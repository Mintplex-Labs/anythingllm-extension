import React from "react";
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  Check,
  SkipForward,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const PRIMARY_CLASS =
  "border-none transition-all duration-300 bg-white text-black hover:opacity-60 h-[38px] px-4 rounded-lg text-sm flex items-center gap-1";
const NAV_BUTTON_CLASS =
  "border-none bg-transparent p-0 flex items-center justify-center text-white/70 light:text-slate-700 hover:text-white light:hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed";

/**
 * Pagination on the left for multi-question surveys, and on the right the
 * actions for explicit-submit flows (input questions, multi-select, or
 * single-select with "Other" active). Skip rides along here for input
 * questions since they have no inline skip.
 */
export default function Footer({
  isSingle,
  isLast,
  allowSkip,
  showActions,
  index,
  total,
  onPrev,
  onSkipThis,
  onNext,
  onSubmitAll,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 mt-1">
      {!isSingle && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrev}
            disabled={index === 0}
            aria-label={t("clarify.previousQuestion")}
            className={NAV_BUTTON_CLASS}
          >
            <CaretLeft size={16} />
          </button>
          <span className="text-xs text-zinc-400 light:text-slate-500 leading-4 whitespace-nowrap select-none">
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
      {showActions && (
        <div className="flex items-center gap-2 ml-auto">
          {allowSkip && (
            <button
              onClick={onSkipThis}
              className="border-none bg-transparent text-white light:text-slate-900 text-sm font-medium h-[38px] px-3 rounded-lg hover:bg-white/5 light:hover:bg-slate-300 flex items-center gap-1"
            >
              <SkipForward size={14} />
              {isSingle ? t("clarify.letAgentDecide") : t("common.skip")}
            </button>
          )}
          {isLast ? (
            <button onClick={onSubmitAll} className={PRIMARY_CLASS}>
              <Check size={14} weight="bold" />
              {isSingle ? t("clarify.submit") : t("clarify.submitAll")}
            </button>
          ) : (
            <button onClick={onNext} className={PRIMARY_CLASS}>
              {t("common.next")}
              <ArrowRight size={14} weight="bold" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
