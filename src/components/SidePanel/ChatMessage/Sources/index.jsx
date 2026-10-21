import React, { useState } from "react";
import { ArrowSquareOut, CaretRight } from "@phosphor-icons/react";

/**
 * Citations for a reply, grouped by document title.
 * @param {Object} props
 * @param {object[]} props.sources
 */
export default function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  const grouped = groupByTitle(sources);
  if (grouped.length === 0) return null;

  return (
    <div className="flex flex-col gap-y-1.5">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="border-none bg-transparent flex items-center gap-x-1 w-fit text-xs text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
      >
        <CaretRight
          size={12}
          weight="bold"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        />
        {grouped.length} {grouped.length === 1 ? "source" : "sources"}
      </button>
      {open &&
        grouped.map((source) => (
          <SourceItem key={source.title} source={source} />
        ))}
    </div>
  );
}

/**
 * @param {object[]} sources
 * @returns {{title: string, url: string|null, texts: string[]}[]}
 */
function groupByTitle(sources = []) {
  const groups = new Map();
  for (const source of sources) {
    const title = source.title || "Untitled";
    if (!groups.has(title))
      groups.set(title, { title, url: urlOf(source), texts: [] });
    const text = omitChunkHeader(source.text);
    if (text) groups.get(title).texts.push(text);
  }
  return [...groups.values()];
}

function urlOf(source) {
  const url = source.url || source.chunkSource?.replace(/^link:\/\//, "");
  return /^https?:/.test(url ?? "") ? url : null;
}

/**
 * Strips the headers the model sees but the user should not: the metadata
 * block on embedded chunks and the Title/URL lines on pages sent from a tab.
 * @param {string} text
 */
function omitChunkHeader(text = "") {
  if (text.includes("<document_metadata>"))
    text = text.split("</document_metadata>")[1] ?? "";
  return text.replace(/^Title: .*\nURL: .*\n/, "").trim();
}

function SourceItem({ source }) {
  return (
    <div className="flex flex-col gap-y-1 rounded-lg bg-zinc-800 light:bg-slate-100 px-3 py-2 min-w-0">
      <SourceTitle title={source.title} url={source.url} />
      {source.texts.length > 0 && (
        <p className="text-xs text-zinc-400 light:text-slate-500 line-clamp-3 break-words">
          {source.texts[0]}
        </p>
      )}
    </div>
  );
}

function SourceTitle({ title, url }) {
  if (!url)
    return (
      <p className="text-xs font-semibold text-white light:text-slate-900 truncate">
        {title}
      </p>
    );

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-x-1 text-xs font-semibold text-white light:text-slate-900 hover:underline min-w-0"
    >
      <span className="truncate">{title}</span>
      <ArrowSquareOut size={12} className="shrink-0" />
    </a>
  );
}
