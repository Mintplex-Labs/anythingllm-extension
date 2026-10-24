import React, { useEffect, useRef, useState } from "react";
import {
  CaretDown,
  DotsThreeVertical,
  FolderSimplePlus,
  GearSix,
  NotePencil,
  SidebarSimple,
  SignOut,
  WifiSlash,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import BrowserExtension, { RevokedKeyError } from "@/models/browserExtension";
import { isServerOutdated, updateUrl } from "@/utils/serverVersion";
import ChatComposer from "./ChatComposer";
import ChatMessage from "./ChatMessage";
import ConnectScreen from "./ConnectScreen";
import PendingConnectionScreen from "./PendingConnectionScreen";
import Screen, { PRIMARY_BUTTON, TEXT_BUTTON } from "./Screen";
import Settings from "./Settings";
import ThreadDrawer from "./ThreadDrawer";
import UpdateRequired from "./UpdateRequired";

const WORKSPACE_STORAGE_KEY = "chatWorkspaceId";

export default function SidePanel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("loading");
  const [connection, setConnection] = useState(null);
  // Why the last connection ended, shown on the connect screen.
  const [notice, setNotice] = useState(null);
  // A connection string an AnythingLLM page handed over, waiting for approval.
  const [pendingConnection, setPendingConnection] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  // Thread the chat is saved to; made on the first message so empty chats leave nothing behind.
  const [threadId, setThreadId] = useState(null);
  const [chatKey, setChatKey] = useState(0);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // null, "loading" or "error" while a saved thread is being opened.
  const [historyStatus, setHistoryStatus] = useState(null);
  // Bumped on every chat switch so a slow history load can tell it is stale.
  const chatGeneration = useRef(0);
  const abortController = useRef(null);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  // Follow the stream only while the user is already at the bottom.
  const stickToBottom = useRef(true);

  useEffect(() => {
    loadWorkspaces();
    chrome.storage.session
      .get("pendingConnection")
      .then((stored) => setPendingConnection(stored.pendingConnection ?? null));
    const onStorageChanged = (changes, area) => {
      if (area === "session" && changes.pendingConnection)
        return setPendingConnection(changes.pendingConnection.newValue ?? null);
      if (area !== "sync" || !(changes.apiBase || changes.apiKey)) return;
      // A chat belongs to the instance it was started on.
      startNewChat();
      loadWorkspaces();
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  useEffect(() => {
    if (stickToBottom.current)
      bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function trackScroll() {
    const list = listRef.current;
    stickToBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  async function loadWorkspaces() {
    const { apiBase, apiKey } = await chrome.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) {
      setConnection(null);
      return setStatus("notConnected");
    }
    setConnection({ apiBase, apiKey });

    const [{ workspaces, revoked, error }, { version }, stored] =
      await Promise.all([
        BrowserExtension.workspaces(apiBase, apiKey),
        BrowserExtension.serverVersion(apiBase),
        chrome.storage.local.get(WORKSPACE_STORAGE_KEY),
      ]);
    if (revoked) return forgetConnection(t("connect.revoked"));
    if (error) return setStatus("offline");
    if (isServerOutdated(version)) return setStatus("outdated");

    const savedId = stored[WORKSPACE_STORAGE_KEY];
    setWorkspaces(workspaces);
    setWorkspaceId(
      workspaces.some((workspace) => workspace.id === savedId)
        ? savedId
        : (workspaces[0]?.id ?? null)
    );
    setStatus("ready");
  }

  function startNewChat() {
    abortController.current?.abort();
    chatGeneration.current += 1;
    setMessages([]);
    setThreadId(null);
    setHistoryStatus(null);
    setChatKey((prev) => prev + 1);
  }

  async function openThread(id) {
    setDrawerOpen(false);
    if (id === threadId && historyStatus !== "error") return;
    startNewChat();
    setThreadId(id);
    setHistoryStatus("loading");
    const generation = chatGeneration.current;
    try {
      const { history, error } = await BrowserExtension.threadHistory(
        connection,
        id
      );
      if (generation !== chatGeneration.current) return;
      setHistoryStatus(error ? "error" : null);
      // Anything sent while the history loaded goes after it.
      setMessages((prev) => [...historyToMessages(history), ...prev]);
    } catch (error) {
      if (error instanceof RevokedKeyError)
        forgetConnection(t("connect.revoked"));
    }
  }

  function handleDrawerError(error) {
    setDrawerOpen(false);
    if (error instanceof RevokedKeyError)
      forgetConnection(t("connect.revoked"));
  }

  function selectWorkspace(id) {
    setWorkspaceId(id);
    chrome.storage.local.set({ [WORKSPACE_STORAGE_KEY]: id });
    startNewChat();
  }

  /**
   * Saves a connection once AnythingLLM accepts it; the storage change reloads the panel.
   * @param {string} connectionString - `apiBase|apiKey`
   * @returns {Promise<string|null>} an error message, or null once saved
   */
  async function connect(connectionString) {
    const [apiBase, apiKey] = connectionString.split("|");
    if (!apiBase || !apiKey) return t("connect.invalid");
    const { online } = await BrowserExtension.checkOnline(apiBase);
    if (!online) return t("connect.unreachable");
    const { response } = await BrowserExtension.checkApiKey(apiBase, apiKey);
    if (!response.ok) return t("connect.rejected");
    setNotice(null);
    await chrome.storage.sync.set({ apiBase, apiKey });
    chrome.runtime.sendMessage({ action: "connectionUpdated" });
    return null;
  }

  // Clears the saved connection; the storage change reloads the panel.
  async function forgetConnection(reason = null) {
    setNotice(reason);
    await chrome.storage.sync.remove(["apiBase", "apiKey"]);
    chrome.runtime.sendMessage({ action: "connectionUpdated" });
  }

  // The key is revoked best-effort; the local connection is always cleared so
  // an already revoked key cannot leave the panel stuck.
  async function disconnect() {
    abortController.current?.abort();
    await BrowserExtension.disconnect(connection.apiBase, connection.apiKey);
    await forgetConnection();
  }

  function clearPendingConnection() {
    return chrome.storage.session.remove("pendingConnection");
  }

  // The request stays until it connects so a failure can be shown and retried.
  async function approvePendingConnection() {
    const { apiBase, apiKey } = pendingConnection;
    const failure = await connect(`${apiBase}|${apiKey}`);
    if (!failure) await clearPendingConnection();
    return failure;
  }

  async function createThread(signal) {
    const { threadId, error } = await BrowserExtension.newThread(
      connection,
      workspaceId
    );
    if (error) throw new Error(error);
    // New chat or a workspace switch happened while the thread was being made.
    signal.throwIfAborted();
    setThreadId(threadId);
    return threadId;
  }

  async function sendMessage(message, pages, attachments) {
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    const replyId = crypto.randomUUID();
    const updateReply = (chunk) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? applyChunk(m, chunk) : m))
      );

    stickToBottom.current = true;
    setStreaming(true);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        attachments,
      },
      emptyReply(replyId),
    ]);

    try {
      const thread = threadId ?? (await createThread(controller.signal));
      await BrowserExtension.streamChat({
        ...connection,
        signal: controller.signal,
        body: {
          workspaceId,
          threadId: thread,
          message,
          context: pages,
          attachments: attachments.map(({ name, mime, contentString }) => ({
            name,
            mime,
            contentString,
          })),
        },
        onChunk: updateReply,
      });
    } catch (error) {
      if (error instanceof RevokedKeyError)
        forgetConnection(t("connect.revoked"));
      else if (error.name !== "AbortError")
        updateReply({ type: "abort", error: error.message });
    }
    updateReply({ type: "done" });
    if (abortController.current === controller) setStreaming(false);
  }

  if (pendingConnection)
    return (
      <PendingConnectionScreen
        request={pendingConnection}
        connected={!!connection}
        onApprove={approvePendingConnection}
        onReject={clearPendingConnection}
      />
    );
  if (status === "loading") return null;
  if (status === "notConnected")
    return <ConnectScreen onConnect={connect} notice={notice} />;
  if (status === "offline")
    return (
      <Screen
        icon={<WifiSlash size={36} weight="fill" />}
        title={t("offline.title")}
        description={t("offline.description")}
      >
        <button onClick={loadWorkspaces} className={PRIMARY_BUTTON}>
          {t("offline.retry")}
        </button>
        <button onClick={disconnect} className={TEXT_BUTTON}>
          {t("common.disconnect")}
        </button>
      </Screen>
    );
  if (status === "outdated")
    return (
      <UpdateRequired
        updateUrl={updateUrl(connection.apiBase)}
        onRetry={loadWorkspaces}
        onDisconnect={disconnect}
      />
    );
  if (workspaces.length === 0)
    return (
      <Screen
        icon={<FolderSimplePlus size={36} weight="fill" />}
        title={t("noWorkspaces.title")}
        description={t("noWorkspaces.description")}
      >
        <button onClick={loadWorkspaces} className={PRIMARY_BUTTON}>
          {t("noWorkspaces.refresh")}
        </button>
        <button onClick={disconnect} className={TEXT_BUTTON}>
          {t("common.disconnect")}
        </button>
      </Screen>
    );

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-900 light:bg-white text-white light:text-slate-900">
      <div className="flex items-center gap-x-2 px-3 py-2.5 border-b border-zinc-800 light:border-slate-200">
        <HeaderButton
          label={t("header.threads")}
          onClick={() => setDrawerOpen(true)}
        >
          <SidebarSimple size={18} />
        </HeaderButton>
        <div className="relative flex-1 min-w-0">
          <select
            value={workspaceId ?? ""}
            onChange={(e) => selectWorkspace(Number(e.target.value))}
            className="appearance-none w-full h-[34px] pl-3 pr-9 text-sm rounded-lg outline-none cursor-pointer bg-zinc-800 border border-zinc-800 text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-900 focus:border-sky-500 light:focus:border-sky-500"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <CaretDown
            size={14}
            weight="bold"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 light:text-slate-500"
          />
        </div>
        <HeaderButton label={t("header.newChat")} onClick={startNewChat}>
          <NotePencil size={18} />
        </HeaderButton>
        <HeaderMenu
          onSettings={() => setSettingsOpen(true)}
          onDisconnect={disconnect}
        />
      </div>

      <div
        ref={listRef}
        onScroll={trackScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-y-5"
      >
        {messages.length === 0 && <EmptyChat historyStatus={historyStatus} />}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            connection={connection}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        key={chatKey}
        streaming={streaming}
        onSend={sendMessage}
        onStop={() => abortController.current?.abort()}
      />
      <ThreadDrawer
        open={drawerOpen}
        connection={connection}
        workspaceId={workspaceId}
        workspaceName={
          workspaces.find((workspace) => workspace.id === workspaceId)?.name
        }
        activeThreadId={threadId}
        onSelect={openThread}
        onClose={() => setDrawerOpen(false)}
        onError={handleDrawerError}
      />
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

/**
 * Applies a streamed server event to the assistant reply being built.
 * @param {object} reply
 * @param {object} chunk
 */
function applyChunk(reply, chunk) {
  if (chunk.type === "textResponseChunk")
    return { ...reply, content: reply.content + (textOf(chunk) ?? "") };
  if (chunk.type === "textResponse")
    return { ...reply, content: textOf(chunk) ?? "" };
  if (chunk.type === "finalizeResponseStream")
    return addOutputs(
      {
        ...reply,
        content: textOf(chunk) || reply.content,
        sources: Array.isArray(chunk.sources) ? chunk.sources : reply.sources,
        metrics: chunk.metrics ?? reply.metrics,
      },
      Array.isArray(chunk.outputs) ? chunk.outputs : []
    );
  if (chunk.type === "agentThought" && typeof chunk.thought === "string")
    return { ...reply, thoughts: [...reply.thoughts, chunk.thought] };
  if (chunk.type === "toolApprovalRequest" && isObject(chunk.content))
    return { ...reply, approvals: [...reply.approvals, chunk.content] };
  if (chunk.type === "clarificationRequest" && isObject(chunk.content))
    return { ...reply, questions: [...reply.questions, chunk.content] };
  if (chunk.type === "rechartVisualize" && isObject(chunk.content))
    return { ...reply, charts: [...reply.charts, chunk.content] };
  if (chunk.type === "scheduledJobCreated" && isObject(chunk.content))
    return { ...reply, jobs: [...reply.jobs, chunk.content] };
  if (chunk.type === "imageGenerationPending")
    return { ...reply, imagePending: true };
  if (chunk.type === "modelRouteNotification" && isObject(chunk.routedTo))
    return { ...reply, routedTo: chunk.routedTo };
  if (chunk.type === "fileDownload")
    return addOutputs(reply, [chunk.fileDownload]);
  if (chunk.type === "abort") return { ...reply, error: chunk.error };
  if (chunk.type === "done") return { ...reply, done: true };
  return reply;
}

function textOf(chunk) {
  return typeof chunk.textResponse === "string" ? chunk.textResponse : null;
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Files stream in as they are made and again in the final outputs list.
 * @param {object} reply
 * @param {object[]} outputs
 */
function addOutputs(reply, outputs) {
  const known = new Set(reply.outputs.map((o) => o.storageFilename));
  const added = outputs
    .filter(isObject)
    .map(normalizeOutput)
    .filter((o) => o.storageFilename && !known.has(o.storageFilename));
  if (added.length === 0) return reply;
  return {
    ...reply,
    outputs: [...reply.outputs, ...added],
    imagePending: reply.imagePending && !added.some((o) => o.type === "image"),
  };
}

function normalizeOutput(output) {
  if (output.type === "imageGenerationCard")
    return { type: "image", ...output.payload };
  return { type: "file", ...(output.payload ?? output) };
}

/**
 * A fresh assistant reply before any of its stream has arrived.
 * @param {string} id
 */
function emptyReply(id) {
  return {
    id,
    role: "assistant",
    content: "",
    thoughts: [],
    approvals: [],
    questions: [],
    charts: [],
    jobs: [],
    imagePending: false,
    routedTo: null,
    sources: [],
    outputs: [],
    metrics: null,
    error: null,
    done: false,
  };
}

/**
 * Turns a saved thread's history into panel messages.
 * @param {object[]} history - as returned by AnythingLLM's chat history
 */
function historyToMessages(history) {
  return history.map((entry) => {
    if (entry.role === "user")
      return {
        id: crypto.randomUUID(),
        role: "user",
        content: entry.content,
        attachments: (entry.attachments ?? []).map((attachment) => ({
          ...attachment,
          id: crypto.randomUUID(),
        })),
      };
    return addOutputs(
      {
        ...emptyReply(crypto.randomUUID()),
        content: entry.content,
        sources: entry.sources ?? [],
        metrics: entry.metrics ?? null,
        done: true,
      },
      Array.isArray(entry.outputs) ? entry.outputs : []
    );
  });
}

function EmptyChat({ historyStatus }) {
  const { t } = useTranslation();
  if (historyStatus === "loading") return <ChatNote text={t("chat.loading")} />;
  if (historyStatus === "error")
    return <ChatNote text={t("chat.loadFailed")} />;
  return <ChatNote text={t("chat.intro")} />;
}

function ChatNote({ text }) {
  return (
    <p className="text-sm text-zinc-400 light:text-slate-500 text-center mt-8">
      {text}
    </p>
  );
}

function HeaderButton({ label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="border-none flex items-center justify-center w-[34px] h-[34px] shrink-0 rounded-lg bg-transparent text-zinc-300 light:text-slate-600 hover:bg-zinc-800 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
    >
      {children}
    </button>
  );
}

function HeaderMenu({ onSettings, onDisconnect }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
      <HeaderButton
        label={t("header.moreOptions")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <DotsThreeVertical size={18} weight="bold" />
      </HeaderButton>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 min-w-[150px] p-1 rounded-lg bg-zinc-800 light:bg-white border border-zinc-700 light:border-slate-300 shadow-lg">
          <MenuItem
            icon={GearSix}
            label={t("settings.title")}
            onClick={() => {
              setOpen(false);
              onSettings();
            }}
          />
          <MenuItem
            icon={SignOut}
            label={t("common.disconnect")}
            onClick={onDisconnect}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border-none w-full flex items-center gap-x-2 px-2.5 py-2 rounded-md text-sm bg-transparent text-zinc-200 light:text-slate-700 hover:bg-zinc-700 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
