import React, { useEffect, useState } from "react";
import { ArrowSquareOut, CaretDown, X } from "@phosphor-icons/react";
import { hostnameOf } from "@/utils/tabs";
import SourceCircle from "../SourceCircle";

/**
 * Covers the panel with the reply's sources; each card expands to its chunks.
 * @param {Object} props
 * @param {import("@/utils/sources").SourceGroup[]} props.sources
 * @param {() => void} props.onClose
 */
export default function SourcesOverlay({ sources, onClose }) {
  const [expandedTitle, setExpandedTitle] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-zinc-900 light:bg-white animate-in fade-in-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 light:border-slate-200">
        <p className="text-sm font-semibold text-white light:text-slate-900">
          Sources
        </p>
        <button
          onClick={onClose}
          aria-label="Close sources"
          className="border-none bg-transparent flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 light:text-slate-500 hover:bg-zinc-800 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-2">
        {sources.map((source) => (
          <SourceCard
            key={source.title}
            source={source}
            expanded={expandedTitle === source.title}
            onToggle={() =>
              setExpandedTitle((prev) =>
                prev === source.title ? null : source.title
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function SourceCard({ source, expanded, onToggle }) {
  const references = source.chunks.length;
  return (
    <div className="rounded-xl bg-zinc-800 light:bg-slate-100">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="border-none bg-transparent w-full flex items-center gap-x-2.5 text-left px-3 py-2.5"
      >
        <SourceCircle source={source} className="w-[22px] h-[22px]" />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-semibold text-white light:text-slate-900 truncate">
            {source.title}
          </p>
          <p className="text-[10px] leading-[14px] text-zinc-400 light:text-slate-500 truncate">
            {source.url ? hostnameOf(source.url) : "Document"}
            {references > 0 &&
              ` · ${references} ${references === 1 ? "reference" : "references"}`}
          </p>
        </div>
        {!!source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open"
            className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
          >
            <ArrowSquareOut size={14} />
          </a>
        )}
        <CaretDown
          size={12}
          weight="bold"
          className={`shrink-0 text-zinc-400 light:text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="flex flex-col gap-y-3 px-3 pb-3">
          {source.chunks.map((chunk, i) => (
            <div
              key={i}
              className="flex flex-col gap-y-1 pt-3 border-t border-zinc-700 light:border-slate-200"
            >
              <p className="text-xs text-zinc-300 light:text-slate-700 whitespace-pre-line break-words">
                {chunk.text}
              </p>
              {chunk.score !== null && (
                <p className="text-[10px] text-zinc-500 light:text-slate-400">
                  {Math.round(chunk.score * 100)}% match
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
