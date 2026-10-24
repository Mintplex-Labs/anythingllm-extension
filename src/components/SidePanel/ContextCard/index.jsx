import React from "react";
import { X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

/**
 * Small card for something attached to a message: a tab, selected text or a file.
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} [props.hint] - tooltip, defaults to title
 * @param {() => void} [props.onRemove] - shows a remove button on hover when given
 * @param {string} [props.background] - Tailwind background classes, darker by default to sit inside the prompt box
 */
export default function ContextCard({
  icon,
  title,
  subtitle,
  hint = title,
  onRemove = null,
  background = "bg-zinc-900 light:bg-slate-100",
}) {
  const { t } = useTranslation();
  return (
    <div
      title={hint}
      className={`relative flex items-center gap-x-1 rounded-lg ${background} flex-1 min-w-[140px] group`}
    >
      {!!onRemove && (
        <div className="invisible group-hover:visible absolute -top-[5px] -right-[5px]">
          <button
            onClick={onRemove}
            title={t("common.remove")}
            aria-label={t("attachment.removeItem", { name: title })}
            className="border-none bg-white hover:bg-red-500 text-zinc-800 hover:text-white rounded-full p-1 flex items-center justify-center"
          >
            <X size={10} weight="bold" />
          </button>
        </div>
      )}
      <div className="rounded-md flex items-center justify-center shrink-0 h-[32px] w-[32px] m-1 bg-zinc-700 light:bg-white overflow-hidden">
        {icon}
      </div>
      <div className="flex flex-col min-w-0 pr-2">
        <p className="text-white light:text-slate-900 text-xs font-semibold truncate">
          {title}
        </p>
        <p className="text-zinc-400 light:text-slate-500 text-[10px] leading-[14px] font-medium truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
