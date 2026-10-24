import i18n from "@/i18n";

// Pages sent from a tab carry their title and address as the first two lines.
const PAGE_HEADER = /^Title: .*\nURL: (\S+)\n/;

/**
 * @typedef {Object} SourceGroup
 * @property {string} title
 * @property {string|null} url - http(s) address of the document, when it has one
 * @property {string|null} kind - connector the document came from, e.g. "youtube"
 * @property {{text: string, score: number|null}[]} chunks
 */

/**
 * Groups a reply's citations by document so each one lists every chunk it contributed.
 * @param {object[]} sources - as streamed from AnythingLLM
 * @returns {SourceGroup[]}
 */
export function groupSources(sources = []) {
  const groups = new Map();
  for (const source of sources) {
    const title = source.title || i18n.t("sources.untitled");
    if (!groups.has(title))
      groups.set(title, {
        title,
        url: urlOf(source),
        kind: kindOf(source),
        chunks: [],
      });
    const text = omitChunkHeader(source.text ?? "");
    if (text)
      groups.get(title).chunks.push({ text, score: source.score ?? null });
  }
  return [...groups.values()];
}

// Connector documents point at their origin as `<connector>://<address>`.
const CHUNK_SOURCE = /^([a-z-]+):\/\/(.*)$/;

function urlOf(source) {
  const url =
    source.url ||
    source.chunkSource?.match(CHUNK_SOURCE)?.[2] ||
    source.text?.match(PAGE_HEADER)?.[1];
  return /^https?:/.test(url ?? "") ? url : null;
}

function kindOf(source) {
  return source.chunkSource?.match(CHUNK_SOURCE)?.[1] ?? null;
}

/**
 * Strips the headers the model sees but the user should not: the metadata
 * block on embedded chunks and the Title/URL lines on pages sent from a tab.
 * @param {string} text
 */
function omitChunkHeader(text = "") {
  if (text.includes("<document_metadata>"))
    text = text.split("</document_metadata>")[1] ?? "";
  return text.replace(PAGE_HEADER, "").trim();
}
