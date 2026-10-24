import React from "react";
import { ArrowRight, Check, SkipForward } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const PRIMARY_CLASS =
  "border-none transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm flex items-center gap-1";

/**
 * Footer for explicit-submit flows (input questions, multi-select, or
 * single-select with "Other" active). Skip rides along here for input
 * questions since they have no inline skip.
 */
export default function Footer({
  isSingle,
  isLast,
  allowSkip,
  answeredCount,
  total,
  onSkipThis,
  onNext,
  onSubmitAll,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 mt-1">
      {!isSingle && (
        <div className="text-xs text-zinc-400 light:text-slate-500">
          {t("clarify.answeredCount", { answered: answeredCount, total })}
        </div>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {allowSkip && (
          <button
            onClick={onSkipThis}
            className="border-none bg-transparent text-white light:text-slate-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 light:hover:bg-slate-300 flex items-center gap-1"
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
    </div>
  );
}
