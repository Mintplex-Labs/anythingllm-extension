import React from "react";

export const PRIMARY_BUTTON =
  "flex items-center justify-center h-[34px] px-4 rounded-lg text-sm font-medium border-none bg-zinc-50 light:bg-slate-900 text-zinc-950 light:text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed";
export const SECONDARY_BUTTON =
  "flex items-center justify-center h-[34px] px-4 rounded-lg text-sm font-medium bg-transparent border border-zinc-700 light:border-slate-300 text-white light:text-slate-900 hover:bg-zinc-800 light:hover:bg-slate-100";
export const TEXT_BUTTON =
  "border-none h-[34px] px-4 rounded-lg text-sm font-medium bg-transparent text-zinc-400 light:text-slate-600 hover:text-white light:hover:text-slate-900";

/**
 * Full-panel message with an icon, a title, a description and actions below.
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {React.ReactNode} props.description
 * @param {React.ReactNode} [props.children] - actions
 */
export default function Screen({ icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-y-5 h-screen w-full bg-zinc-900 light:bg-white p-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 light:bg-slate-100 text-sky-400 light:text-sky-600">
        {icon}
      </div>
      <div className="flex flex-col gap-y-1.5">
        <h1 className="text-white light:text-slate-900 text-lg font-semibold">
          {title}
        </h1>
        <p className="text-zinc-400 light:text-slate-600 text-sm">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-y-2 w-full max-w-[280px]">
        {children}
      </div>
    </div>
  );
}
