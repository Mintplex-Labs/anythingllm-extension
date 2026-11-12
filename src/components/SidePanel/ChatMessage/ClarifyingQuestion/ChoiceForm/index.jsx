import React from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const ROW_CLASS =
  "border-none w-full flex items-center gap-[9px] p-2 rounded-lg text-left transition-colors";
const ROW_SELECTED = "bg-zinc-800 light:bg-slate-200";
const ROW_IDLE =
  "bg-transparent hover:bg-zinc-800/60 light:hover:bg-slate-200/60";

/**
 * Numbered choice list. Single-select clicks auto-advance through
 * `onAutoAdvance`; multi-select toggles and the parent owns submit. An "Other"
 * row reveals a free-text input whose value is merged in by `answerForDraft`.
 */
export default function ChoiceForm({
  question,
  draft,
  onChange,
  onAutoAdvance,
  allowSkip,
  onSkip,
}) {
  const { t } = useTranslation();
  const showOther = question.allowOther !== false;

  function isChecked(option) {
    if (question.multiSelect)
      return Array.isArray(draft.selected) && draft.selected.includes(option);
    return draft.selected === option;
  }

  function select(option) {
    if (question.multiSelect) {
      const list = Array.isArray(draft.selected) ? draft.selected : [];
      const next = list.includes(option)
        ? list.filter((o) => o !== option)
        : [...list, option];
      return onChange({ selected: next, otherSelected: false });
    }
    const patch = { selected: option, otherSelected: false };
    onChange(patch);
    onAutoAdvance?.(patch);
  }

  function toggleOther() {
    if (question.multiSelect)
      return onChange({ otherSelected: !draft.otherSelected });
    onChange({ selected: null, otherSelected: !draft.otherSelected });
  }

  return (
    <div className="flex flex-col w-full">
      {question.options.map((option, idx) => (
        <button
          key={`${option}-${idx}`}
          aria-pressed={isChecked(option)}
          onClick={() => select(option)}
          className={`${ROW_CLASS} ${isChecked(option) ? ROW_SELECTED : ROW_IDLE}`}
        >
          <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-zinc-700 light:bg-slate-300 text-white light:text-slate-900 text-base font-medium leading-6">
            {idx + 1}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-white light:text-slate-900 text-sm leading-5">
              {option}
            </span>
            {!!question.optionDescriptions?.[idx] && (
              <span className="text-xs text-zinc-400 light:text-slate-500 leading-4">
                {question.optionDescriptions[idx]}
              </span>
            )}
          </span>
        </button>
      ))}
      {showOther && (
        <div className="flex items-center w-full">
          <button
            aria-pressed={!!draft.otherSelected}
            onClick={toggleOther}
            className={`${ROW_CLASS} flex-1 min-w-0 ${draft.otherSelected ? ROW_SELECTED : ROW_IDLE}`}
          >
            <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-zinc-700 light:bg-slate-300 text-white light:text-slate-900">
              <PencilSimple size={16} />
            </span>
            <span
              className={`text-sm leading-5 ${draft.otherSelected ? "text-white light:text-slate-900" : "text-zinc-400 light:text-slate-600"}`}
            >
              {t("clarify.other")}
            </span>
          </button>
          {allowSkip && (
            <button
              onClick={onSkip}
              className="border border-solid border-zinc-600 light:border-slate-300 bg-transparent rounded-lg h-7 px-3 flex items-center justify-center text-white light:text-slate-900 text-xs font-medium leading-4 shrink-0 hover:bg-zinc-700/40 light:hover:bg-slate-200/60"
            >
              {t("common.skip")}
            </button>
          )}
        </div>
      )}
      {showOther && draft.otherSelected && (
        <input
          autoFocus
          type="text"
          value={draft.otherText || ""}
          onChange={(e) => onChange({ otherText: e.target.value })}
          placeholder={t("clarify.answerPlaceholder")}
          className="mt-2 w-full border border-solid border-zinc-700 light:border-slate-500 bg-zinc-800 light:bg-white text-white light:text-slate-900 placeholder:text-zinc-500 light:placeholder:text-slate-500 text-sm rounded-lg focus:outline-white light:focus:outline-slate-400 outline-none p-2"
        />
      )}
    </div>
  );
}
