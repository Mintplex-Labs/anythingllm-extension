import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, At, Globe, Plus, TextAa } from "@phosphor-icons/react";
import { getActiveTab, readTabText } from "@/utils/tabs";
import { attachmentProblem, fileToAttachment } from "@/utils/attachments";
import useFileDrop from "@/hooks/useFileDrop";
import ContextCard from "../ContextCard";
import AttachmentCard from "../AttachmentCard";
import MicButton from "./MicButton";

const MENTION_PATTERN = /(?:^|\s)@([^\s@]*)$/;
const MAX_PAGES = 5;

/**
 * Message input that gathers page context: the current page, tabs added
 * from the @ picker, text sent from the "Ask AnythingLLM about this" menu item,
 * and files dropped, pasted or picked.
 * @param {Object} props
 * @param {boolean} props.streaming
 * @param {(message: string, pages: {title: string, url: string, content: string}[], attachments: import("@/utils/attachments").Attachment[]) => void} props.onSend
 * @param {() => void} props.onStop
 */
export default function ChatComposer({ streaming, onSend, onStop }) {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [removedActiveTabId, setRemovedActiveTabId] = useState(null);
  const [mentionedTabs, setMentionedTabs] = useState([]);
  const [selection, setSelection] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [notice, setNotice] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragging = useFileDrop(addFiles);

  const mention = text.match(MENTION_PATTERN);
  const showPicker = pickerOpen || !!mention;
  const query = (mention?.[1] ?? "").toLowerCase();

  // A selection stands in for the page it came from.
  const includeActiveTab =
    !!activeTab && activeTab.id !== removedActiveTabId && !selection;
  const attachedTabs = includeActiveTab
    ? [activeTab, ...mentionedTabs.filter((t) => t.id !== activeTab.id)]
    : mentionedTabs;
  const pageCount = attachedTabs.length + (selection ? 1 : 0);
  const tabChoices = showPicker
    ? openTabs
        .filter((tab) => !attachedTabs.some((t) => t.id === tab.id))
        .filter((tab) =>
          `${tab.title} ${tab.url}`.toLowerCase().includes(query)
        )
    : [];
  const highlightedIndex = Math.min(highlighted, tabChoices.length - 1);

  useEffect(() => {
    const refreshActiveTab = () =>
      getActiveTab().then((tab) => setActiveTab(isReadable(tab) ? tab : null));
    refreshActiveTab();
    chrome.tabs.onActivated.addListener(refreshActiveTab);
    chrome.tabs.onUpdated.addListener(refreshActiveTab);
    return () => {
      chrome.tabs.onActivated.removeListener(refreshActiveTab);
      chrome.tabs.onUpdated.removeListener(refreshActiveTab);
    };
  }, []);

  useEffect(() => {
    const takeSelection = (pendingSelection) => {
      if (!pendingSelection) return;
      chrome.storage.session.remove("pendingSelection");
      // Quick actions from the context menu carry their own prompt and send right away.
      if (pendingSelection.prompt)
        return onSend(
          pendingSelection.prompt,
          [selectionPage(pendingSelection)],
          []
        );
      setSelection(pendingSelection);
    };
    chrome.storage.session
      .get("pendingSelection")
      .then(({ pendingSelection }) => takeSelection(pendingSelection));

    const onStorageChanged = (changes, area) => {
      if (area === "session" && changes.pendingSelection)
        takeSelection(changes.pendingSelection.newValue);
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setHighlighted(0);
    if (!showPicker) return;
    chrome.tabs
      .query({ currentWindow: true })
      .then((tabs) => setOpenTabs(tabs.filter(isReadable)));
  }, [showPicker, query]);

  function openPicker() {
    setPickerOpen(true);
    textareaRef.current?.focus();
  }

  function closePicker() {
    setPickerOpen(false);
    setText((prev) =>
      prev.replace(MENTION_PATTERN, (m) => (m.startsWith("@") ? "" : m[0]))
    );
  }

  function addTab(tab) {
    setMentionedTabs((prev) => [...prev, tab]);
    closePicker();
  }

  function removeTab(tab) {
    if (tab.id === activeTab?.id) setRemovedActiveTabId(tab.id);
    setMentionedTabs((prev) => prev.filter((t) => t.id !== tab.id));
  }

  async function addFiles(files) {
    const problems = files.map(attachmentProblem);
    setNotice(problems.find(Boolean) ?? null);
    const accepted = files.filter((_, i) => !problems[i]);
    const added = await Promise.all(accepted.map(fileToAttachment));
    setAttachments((prev) => [...prev, ...added]);
    textareaRef.current?.focus();
  }

  function appendText(phrase) {
    setText((prev) => (prev && !/\s$/.test(prev) ? `${prev} ` : prev) + phrase);
  }

  async function gatherPages() {
    const pages = await Promise.all(
      attachedTabs.map(async (tab) => ({
        title: tab.title,
        url: tab.url,
        content: await readTabText(tab.id),
      }))
    );
    if (selection) pages.push(selectionPage(selection));
    return pages.filter((page) => page.content);
  }

  async function submit() {
    const message = text.trim();
    if (!message || streaming) return;
    setText("");
    setAttachments([]);
    onSend(message, await gatherPages(), attachments);
  }

  function handleKeyDown(e) {
    if (showPicker) {
      if (e.key === "Escape") return closePicker();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (tabChoices.length === 0) return;
        const step = e.key === "ArrowDown" ? 1 : -1;
        return setHighlighted(
          (highlightedIndex + step + tabChoices.length) % tabChoices.length
        );
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (tabChoices.length === 0) return closePicker();
        return addTab(tabChoices[highlightedIndex]);
      }
    }
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    submit();
  }

  function handlePaste(e) {
    const files = [...e.clipboardData.files];
    if (files.length === 0) return;
    e.preventDefault();
    addFiles(files);
  }

  return (
    <div className="relative px-3 pb-3 pt-1">
      {dragging && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-900/90 light:bg-white/90 border-2 border-dashed border-zinc-500 light:border-slate-400 m-2 rounded-2xl pointer-events-none">
          <p className="text-sm text-white light:text-slate-900">
            Drop files to attach them
          </p>
        </div>
      )}

      {showPicker && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute bottom-full left-3 right-3 mb-2 max-h-[260px] overflow-y-auto bg-zinc-800 light:bg-white border border-zinc-700 light:border-slate-300 rounded-2xl shadow-lg p-2"
        >
          <TabPicker
            tabs={tabChoices}
            query={query}
            full={pageCount >= MAX_PAGES}
            highlightedIndex={highlightedIndex}
            onHighlight={setHighlighted}
            onPick={addTab}
          />
        </div>
      )}

      <div className="bg-zinc-800 light:bg-white light:border light:border-slate-300 rounded-[20px] flex flex-col px-4 overflow-hidden">
        <div className="flex flex-wrap gap-2 pt-3 empty:hidden">
          {attachedTabs.map((tab) => (
            <ContextCard
              key={tab.id}
              icon={<TabIcon tab={tab} />}
              title={tab.title}
              subtitle={
                tab.id === activeTab?.id ? "Current page" : hostnameOf(tab.url)
              }
              onRemove={() => removeTab(tab)}
            />
          ))}
          {selection && (
            <ContextCard
              icon={
                <TextAa size={18} className="text-white light:text-slate-700" />
              }
              title="Selected text"
              subtitle={selection.title}
              hint={selection.text}
              onRemove={() => setSelection(null)}
            />
          )}
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onRemove={() =>
                setAttachments((prev) =>
                  prev.filter((a) => a.id !== attachment.id)
                )
              }
            />
          ))}
        </div>
        {!!notice && (
          <p className="text-xs text-red-400 light:text-red-600 pt-2">
            {notice}
          </p>
        )}

        <textarea
          ref={textareaRef}
          autoFocus
          rows={2}
          value={text}
          onChange={(e) => {
            setPickerOpen(false);
            setText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={closePicker}
          placeholder="Ask anything, or type @ to add a tab"
          className="border-none w-full pt-3 max-h-[200px] leading-5 text-sm text-white light:text-slate-600 bg-transparent placeholder:text-white/60 light:placeholder:text-slate-400 resize-none outline-none"
        />

        <div className="flex justify-between items-center pt-2 pb-3">
          <div className="flex items-center gap-x-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                addFiles([...e.target.files]);
                e.target.value = "";
              }}
            />
            <ComposerButton
              icon={Plus}
              label="Attach a file"
              onClick={() => fileInputRef.current?.click()}
            />
            <ComposerButton
              icon={At}
              label="Add a tab"
              active={showPicker}
              onMouseDown={(e) => e.preventDefault()}
              onClick={showPicker ? closePicker : openPicker}
            />
          </div>
          <div className="flex items-center gap-x-1">
            <MicButton onTranscript={appendText} />
            <SendButton
              streaming={streaming}
              disabled={!text.trim()}
              onSend={submit}
              onStop={onStop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Only http(s) tabs can be read by the extension.
 * @param {chrome.tabs.Tab|null} tab
 */
function isReadable(tab) {
  return !!tab && /^https?:/.test(tab.url ?? "");
}

function selectionPage(selection) {
  return {
    title: `Selected text from ${selection.title}`,
    url: selection.url,
    content: selection.text,
  };
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function TabPicker({
  tabs,
  query,
  full,
  highlightedIndex,
  onHighlight,
  onPick,
}) {
  if (full)
    return <PickerNote text={`You can attach up to ${MAX_PAGES} pages.`} />;
  if (tabs.length === 0)
    return (
      <PickerNote text={query ? "No tabs match." : "No other tabs to add."} />
    );

  return tabs.map((tab, i) => (
    <button
      key={tab.id}
      onClick={() => onPick(tab)}
      onMouseEnter={() => onHighlight(i)}
      className={`border-none w-full flex items-center gap-x-2.5 text-left rounded-xl px-2 py-2 ${
        i === highlightedIndex
          ? "bg-zinc-700 light:bg-slate-100"
          : "bg-transparent"
      }`}
    >
      <TabIcon tab={tab} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-white light:text-slate-900 truncate">
          {tab.title}
        </span>
        <span className="text-xs text-zinc-400 light:text-slate-500 truncate">
          {hostnameOf(tab.url)}
        </span>
      </div>
    </button>
  ));
}

function PickerNote({ text }) {
  return (
    <p className="text-sm text-zinc-400 light:text-slate-500 px-2 py-2">
      {text}
    </p>
  );
}

function ComposerButton({ icon: Icon, label, active = false, ...props }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={`group border-none flex justify-center items-center w-6 h-6 rounded-full hover:bg-zinc-700 light:hover:bg-slate-200 ${
        active ? "bg-zinc-700 light:bg-slate-200" : "bg-transparent"
      }`}
      {...props}
    >
      <Icon
        size={18}
        className="text-zinc-300 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-800"
      />
    </button>
  );
}

function SendButton({ streaming, disabled, onSend, onStop }) {
  if (streaming)
    return (
      <button
        onClick={onStop}
        title="Stop"
        aria-label="Stop"
        className="border-none flex justify-center items-center rounded-full w-8 h-8 bg-white light:bg-slate-800 hover:opacity-80"
      >
        <div className="w-3.5 h-3.5 rounded-[4px] bg-zinc-800 light:bg-white" />
      </button>
    );

  return (
    <button
      onClick={onSend}
      disabled={disabled}
      title="Send"
      aria-label="Send"
      className="border-none flex justify-center items-center rounded-full w-8 h-8 bg-white hover:bg-zinc-200 light:bg-slate-800 light:hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-zinc-600 light:disabled:bg-slate-400"
    >
      <ArrowUp
        size={18}
        weight="bold"
        className="text-zinc-800 light:text-white"
      />
    </button>
  );
}

function TabIcon({ tab }) {
  if (!tab.favIconUrl)
    return (
      <Globe
        size={16}
        className="shrink-0 text-zinc-400 light:text-slate-500"
      />
    );
  return <img src={tab.favIconUrl} alt="" className="w-4 h-4 shrink-0" />;
}
