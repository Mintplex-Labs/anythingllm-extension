import React from "react";

const SHARED_CLASS =
  "w-full border border-solid border-zinc-700 light:border-slate-500 bg-zinc-800 light:bg-white text-white light:text-slate-900 placeholder:text-zinc-500 light:placeholder:text-slate-500 text-sm leading-5 rounded-lg focus:outline-white light:focus:outline-slate-400 outline-none px-[14px] py-[10px]";

/**
 * Free-form text/url/number/date/email/textarea input. The server already
 * constrained `inputType` to a known value.
 */
export default function InputForm({ question, draft, onChange, onSubmit }) {
  const inputType = question.inputType || "text";
  const value = draft.value || "";
  const placeholder = question.placeholder || "";

  if (inputType === "textarea")
    return (
      <textarea
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${SHARED_CLASS} min-h-[128px] resize-y`}
      />
    );

  return (
    <input
      autoFocus
      type={inputType}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        onSubmit?.();
      }}
      className={SHARED_CLASS}
    />
  );
}
