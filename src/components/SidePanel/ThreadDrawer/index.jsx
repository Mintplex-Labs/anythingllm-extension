import React, { useEffect, useRef, useState } from "react";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import BrowserExtension from "@/models/browserExtension";

/**
 * Slide-over list of the workspace's threads, like the desktop assistant's.
 * Threads are fetched on every open so names given after a first message show up.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {{apiBase: string, apiKey: string}} props.connection
 * @param {number} props.workspaceId
 * @param {string} props.workspaceName
 * @param {number|null} props.activeThreadId
 * @param {(threadId: number) => void} props.onSelect
 * @param {() => void} props.onClose
 * @param {(error: Error) => void} props.onError - gets a RevokedKeyError when the key was deleted
 */
export default function ThreadDrawer({
  open,
  connection,
  workspaceId,
  workspaceName,
  activeThreadId,
  onSelect,
  onClose,
  onError,
}) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return setSearch("");
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchRef.current?.focus();
    BrowserExtension.threads(connection, workspaceId)
      .then((result) => {
        if (cancelled) return;
        setThreads(result.threads);
        setError(result.error);
      })
      .catch((e) => !cancelled && onError(e))
      .finally(() => !cancelled && setLoading(false));

    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, workspaceId]);

  const query = search.trim().toLowerCase();
  const shown = threads.filter((thread) =>
    threadName(thread).toLowerCase().includes(query)
  );

  return (
    <>
      <div
        onClick={onClose}
        className={
          open
            ? "fixed inset-0 z-30 bg-black/50 light:bg-slate-900/20"
            : "hidden"
        }
      />
      <div
        aria-hidden={!open}
        className={`fixed z-30 top-0 left-0 h-full w-[242px] flex flex-col bg-zinc-900 light:bg-white light:border-r light:border-slate-200 transform transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col gap-y-3 p-3">
          <div className="flex flex-col px-1.5 pt-1">
            <p className="text-sm font-semibold text-white light:text-slate-900">
              Threads
            </p>
            <p className="text-xs text-zinc-400 light:text-slate-500 truncate">
              Saved chats in {workspaceName}
            </p>
          </div>
          <div className="h-[32px] flex items-center gap-x-2.5 bg-zinc-800 light:bg-slate-100 rounded-lg px-2.5">
            <MagnifyingGlass
              size={16}
              className="shrink-0 text-white/40 light:text-slate-400"
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads"
              tabIndex={open ? 0 : -1}
              className="flex-1 min-w-0 p-0 bg-transparent border-none outline-none text-sm text-white light:text-slate-900 placeholder:text-white/40 light:placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-y-1.5">
          <ThreadList
            threads={shown}
            loading={loading}
            error={error}
            searching={!!query}
            activeThreadId={activeThreadId}
            onSelect={onSelect}
          />
        </div>
      </div>
    </>
  );
}

function ThreadList({
  threads,
  loading,
  error,
  searching,
  activeThreadId,
  onSelect,
}) {
  if (loading)
    return (
      <div className="flex items-center gap-x-2 px-1.5 py-2 text-sm text-white/40 light:text-slate-400">
        <CircleNotch size={16} className="animate-spin" />
        Loading threads...
      </div>
    );
  if (error) return <DrawerNote text={error} />;
  if (threads.length === 0)
    return (
      <DrawerNote text={searching ? "No threads found" : "No threads yet"} />
    );

  return threads.map((thread) => {
    const active = thread.id === activeThreadId;
    return (
      <button
        key={thread.id}
        ref={active ? scrollToCenter : null}
        onClick={() => onSelect(thread.id)}
        className={`border-none w-full h-[32px] shrink-0 flex items-center rounded-lg px-1.5 text-left text-sm cursor-pointer ${
          active
            ? "bg-white/10 light:bg-slate-200 text-white light:text-slate-900 font-medium"
            : "bg-transparent text-white/70 light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
        }`}
      >
        <span className="truncate">{threadName(thread)}</span>
      </button>
    );
  });
}

function DrawerNote({ text }) {
  return (
    <p className="px-1.5 py-2 text-sm text-white/40 light:text-slate-400">
      {text}
    </p>
  );
}

function threadName(thread) {
  return thread.name || `Thread ${thread.id}`;
}

function scrollToCenter(element) {
  element?.scrollIntoView({ block: "center" });
}
