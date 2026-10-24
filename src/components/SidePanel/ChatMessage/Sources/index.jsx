import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { groupSources } from "@/utils/sources";
import SourceCircle from "./SourceCircle";
import SourcesOverlay from "./SourcesOverlay";

const PREVIEW_COUNT = 3;

/**
 * Citations for a reply: a compact row of source badges that opens the full list.
 * @param {Object} props
 * @param {object[]} props.sources
 */
export default function Sources({ sources }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const grouped = groupSources(sources);
  if (grouped.length === 0) return null;

  const preview = grouped.slice(0, PREVIEW_COUNT);
  const rest = grouped.length - preview.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-none bg-transparent w-fit flex items-center gap-x-1.5 -ml-2.5 px-2.5 py-1 rounded-full text-xs text-white light:text-slate-800 hover:bg-white/5 light:hover:bg-black/5"
      >
        {t("sources.title")}
        <div className="flex">
          {preview.map((source) => (
            <SourceCircle
              key={source.title}
              source={source}
              className="w-[20px] h-[20px] border-2 border-zinc-900 light:border-white -ml-1.5 first:ml-0"
            />
          ))}
        </div>
        {rest > 0 && <span>+{rest}</span>}
      </button>
      {open && (
        <SourcesOverlay sources={grouped} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
