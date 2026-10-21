import React, { useEffect, useRef, useState } from "react";
import { NotePencil } from "@phosphor-icons/react";
import BrowserExtension from "@/models/browserExtension";
import ChatComposer from "./ChatComposer";
import ChatMessage from "./ChatMessage";

const WORKSPACE_STORAGE_KEY = "chatWorkspaceId";

export default function SidePanel() {
  const [status, setStatus] = useState("loading");
  const [connection, setConnection] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const abortController = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadWorkspaces();
    const onStorageChanged = (changes, area) => {
      if (area === "sync" && (changes.apiBase || changes.apiKey))
        loadWorkspaces();
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function loadWorkspaces() {
    const { apiBase, apiKey } = await chrome.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) return setStatus("notConnected");

    const [{ workspaces, error }, stored] = await Promise.all([
      BrowserExtension.workspaces(apiBase, apiKey),
      chrome.storage.local.get(WORKSPACE_STORAGE_KEY),
    ]);
    if (error) return setStatus("offline");

    const savedId = stored[WORKSPACE_STORAGE_KEY];
    setConnection({ apiBase, apiKey });
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
    setMessages([]);
    setSessionId(crypto.randomUUID());
  }

  function selectWorkspace(id) {
    setWorkspaceId(id);
    chrome.storage.local.set({ [WORKSPACE_STORAGE_KEY]: id });
    startNewChat();
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

    setStreaming(true);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        context: pages.map((p) => p.title),
        attachments,
      },
      {
        id: replyId,
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
      },
    ]);

    try {
      await BrowserExtension.streamChat({
        ...connection,
        signal: controller.signal,
        body: {
          workspaceId,
          message,
          sessionId,
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
      if (error.name !== "AbortError")
        updateReply({ type: "abort", error: error.message });
    }
    updateReply({ type: "done" });
    if (abortController.current === controller) setStreaming(false);
  }

  if (status === "loading") return null;
  if (status === "notConnected")
    return (
      <PanelMessage text="Connect the extension to AnythingLLM from the toolbar popup to start chatting." />
    );
  if (status === "offline")
    return (
      <PanelMessage text="Could not reach AnythingLLM. Make sure your instance is running and the extension is connected." />
    );
  if (workspaces.length === 0)
    return (
      <PanelMessage text="Create a workspace in AnythingLLM to start chatting." />
    );

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-900 light:bg-white text-white light:text-slate-900">
      <div className="flex items-center gap-x-2 px-3 py-2.5 border-b border-zinc-800 light:border-slate-200">
        <select
          value={workspaceId ?? ""}
          onChange={(e) => selectWorkspace(Number(e.target.value))}
          className="flex-1 min-w-0 h-[34px] px-2.5 text-sm rounded-lg outline-none bg-zinc-800 border border-zinc-800 text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-900 focus:border-sky-500 light:focus:border-sky-500"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <button
          onClick={startNewChat}
          title="New chat"
          aria-label="New chat"
          className="border-none flex items-center justify-center w-[34px] h-[34px] rounded-lg bg-transparent text-zinc-300 light:text-slate-600 hover:bg-zinc-800 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
        >
          <NotePencil size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-y-5">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400 light:text-slate-500 text-center mt-8">
            Ask about this page or your workspace documents. Type @ to add other
            tabs.
          </p>
        )}
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
        key={sessionId}
        streaming={streaming}
        onSend={sendMessage}
        onStop={() => abortController.current?.abort()}
      />
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
    return { ...reply, content: reply.content + (chunk.textResponse ?? "") };
  if (chunk.type === "textResponse")
    return { ...reply, content: textOf(chunk) ?? "" };
  if (chunk.type === "finalizeResponseStream")
    return addOutputs(
      {
        ...reply,
        content: textOf(chunk) || reply.content,
        sources: chunk.sources ?? reply.sources,
        metrics: chunk.metrics ?? reply.metrics,
      },
      chunk.outputs ?? []
    );
  if (chunk.type === "agentThought")
    return { ...reply, thoughts: [...reply.thoughts, chunk.thought] };
  if (chunk.type === "toolApprovalRequest")
    return { ...reply, approvals: [...reply.approvals, chunk.content] };
  if (chunk.type === "clarificationRequest")
    return { ...reply, questions: [...reply.questions, chunk.content] };
  if (chunk.type === "rechartVisualize")
    return { ...reply, charts: [...reply.charts, chunk.content] };
  if (chunk.type === "scheduledJobCreated")
    return { ...reply, jobs: [...reply.jobs, chunk.content] };
  if (chunk.type === "imageGenerationPending")
    return { ...reply, imagePending: true };
  if (chunk.type === "modelRouteNotification")
    return { ...reply, routedTo: chunk.routedTo };
  if (chunk.type === "fileDownload")
    return addOutputs(reply, [chunk.fileDownload]);
  if (chunk.type === "usageMetrics")
    return { ...reply, metrics: chunk.metrics };
  if (chunk.type === "abort") return { ...reply, error: chunk.error };
  if (chunk.type === "done") return { ...reply, done: true };
  return reply;
}

function textOf(chunk) {
  return typeof chunk.textResponse === "string" ? chunk.textResponse : null;
}

/**
 * Files stream in as they are made and again in the final outputs list.
 * @param {object} reply
 * @param {object[]} outputs
 */
function addOutputs(reply, outputs) {
  const known = new Set(reply.outputs.map((o) => o.storageFilename));
  const added = outputs
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

function PanelMessage({ text }) {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-zinc-900 light:bg-white p-6">
      <p className="text-zinc-400 light:text-slate-600 text-sm text-center">
        {text}
      </p>
    </div>
  );
}
