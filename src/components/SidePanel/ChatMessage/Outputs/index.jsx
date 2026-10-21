import React, { useEffect, useState } from "react";
import { DownloadSimple, FileArrowDown } from "@phosphor-icons/react";
import BrowserExtension from "@/models/browserExtension";

/**
 * Images and files an agent generated while answering.
 * @param {Object} props
 * @param {{type: "image"|"file", filename: string, storageFilename: string, fileSize?: number, prompt?: string}[]} props.outputs
 * @param {{apiBase: string, apiKey: string}} props.connection
 */
export default function Outputs({ outputs, connection }) {
  if (outputs.length === 0) return null;
  return (
    <div className="flex flex-col gap-y-2">
      {outputs.map((output) => {
        const Card = output.type === "image" ? GeneratedImage : GeneratedFile;
        return (
          <Card
            key={output.storageFilename}
            output={output}
            connection={connection}
          />
        );
      })}
    </div>
  );
}

function GeneratedImage({ output, connection }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    BrowserExtension.generatedFile(connection, output).then((result) => {
      if (!active) return;
      setUrl(result.url);
      setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [output.storageFilename]);

  if (error)
    return (
      <p className="text-xs text-zinc-500 light:text-slate-500">
        Could not load image.
      </p>
    );
  if (!url)
    return (
      <div className="h-[160px] w-full rounded-lg bg-zinc-800 light:bg-slate-100 animate-pulse" />
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="w-fit">
      <img
        src={url}
        alt={output.prompt || output.filename}
        className="rounded-lg max-w-full max-h-[320px]"
      />
    </a>
  );
}

function GeneratedFile({ output, connection }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const { url } = await BrowserExtension.generatedFile(connection, output);
    setBusy(false);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = output.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-x-2 rounded-lg bg-zinc-800 light:bg-slate-100 px-3 py-2">
      <FileArrowDown
        size={20}
        className="shrink-0 text-zinc-300 light:text-slate-600"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs font-semibold text-white light:text-slate-900 truncate">
          {output.filename}
        </p>
        {!!output.fileSize && (
          <p className="text-[10px] leading-[14px] text-zinc-400 light:text-slate-500">
            {formatBytes(output.fileSize)}
          </p>
        )}
      </div>
      <button
        onClick={download}
        disabled={busy}
        title="Download"
        aria-label={`Download ${output.filename}`}
        className="border-none flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-zinc-300 light:text-slate-600 hover:bg-zinc-700 light:hover:bg-slate-200 hover:text-white light:hover:text-slate-900 disabled:opacity-50"
      >
        <DownloadSimple size={16} />
      </button>
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
