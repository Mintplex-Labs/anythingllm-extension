import React, { useState, useEffect } from "react";
import BrowserExtension from "../models/browserExtension";

const BUTTON_BASE =
  "flex items-center justify-center h-[34px] px-4 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
const PRIMARY_BUTTON = `${BUTTON_BASE} border-none bg-zinc-50 light:bg-slate-900 text-zinc-950 light:text-white hover:opacity-80`;
const SECONDARY_BUTTON = `${BUTTON_BASE} bg-transparent border border-zinc-700 light:border-slate-600 text-slate-50 light:text-slate-700 hover:bg-zinc-800 light:hover:bg-slate-100`;
const DANGER_BUTTON = `${BUTTON_BASE} border-none bg-red-500 light:bg-red-600 text-white hover:opacity-80`;

export default function Config({
  status,
  onStatusChange,
  pendingConnection,
  onPendingConnectionHandled,
}) {
  const [connectionString, setConnectionString] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Disconnects & de-registers the current extension from the set API key.
  async function disconnectFromExtension() {
    await chrome.storage.sync.remove(["apiBase", "apiKey"]);
    onStatusChange();
    setSaveStatus("Successfully disconnected from AnythingLLM");
    chrome.runtime.sendMessage({ action: "connectionUpdated" });
  }

  const handleConnect = async (connectionString) => {
    try {
      const [apiBase, apiKey] = connectionString.split("|");
      if (!apiBase || !apiKey) {
        setSaveStatus("Invalid connection string format.");
        return;
      }

      const { online } = await BrowserExtension.checkOnline(apiBase);
      if (!online) {
        setSaveStatus(
          "AnythingLLM is currently offline. Please try again later.",
        );
        return;
      }

      const { response } = await BrowserExtension.checkApiKey(apiBase, apiKey);
      if (!response.ok)
        return setSaveStatus("Failed to connect: Invalid API key");

      // Saves the apiBase and apiKey to storage sync.
      await chrome.storage.sync.set({ apiBase, apiKey });
      onStatusChange();
      setSaveStatus("Successfully connected to AnythingLLM");
      chrome.runtime.sendMessage({ action: "connectionUpdated" });
    } catch (error) {
      setSaveStatus(`An error occurred during connection: ${error.message}`);
    }
  };

  const approvePendingConnection = async () => {
    const { apiBase, apiKey } = pendingConnection;
    await onPendingConnectionHandled();
    await handleConnect(`${apiBase}|${apiKey}`);
  };

  const handleDisconnect = async () => {
    try {
      const { apiBase, apiKey } = await chrome.storage.sync.get([
        "apiBase",
        "apiKey",
      ]);
      if (!apiBase || !apiKey) throw new Error("No connection found");
      const { success, error } = await BrowserExtension.disconnect(
        apiBase,
        apiKey,
      );
      if (!success)
        throw new Error(error || "Failed to disconnect from the server");
      await disconnectFromExtension();
    } catch (error) {
      setSaveStatus(`An error occurred during disconnection: ${error.message}`);
    }
  };

  if (pendingConnection) {
    return (
      <div className="w-full flex flex-col gap-y-4">
        <div className="bg-zinc-800 light:bg-slate-100 p-2.5 rounded-lg text-white light:text-slate-900 text-sm flex flex-col gap-y-2">
          <p>
            <span className="font-semibold">
              {pendingConnection.requestedBy}
            </span>{" "}
            wants to connect this extension to:
          </p>
          <p className="font-mono break-all text-sky-400 light:text-sky-600">
            {pendingConnection.apiBase}
          </p>
          {status === "connected" && (
            <p className="text-yellow-400 light:text-yellow-600">
              This will replace your current connection.
            </p>
          )}
          <p className="text-zinc-400 light:text-slate-600">
            Only approve if you just requested this from your own AnythingLLM
            instance.
          </p>
        </div>
        <button onClick={approvePendingConnection} className={PRIMARY_BUTTON}>
          Approve
        </button>
        <button
          onClick={onPendingConnectionHandled}
          className={SECONDARY_BUTTON}
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-y-4">
      {status === "notConnected" && (
        <div className="w-full flex flex-col gap-y-4">
          <div className="flex flex-col w-full">
            <label className="text-white light:text-slate-900 text-sm font-medium block mb-2">
              AnythingLLM Connection String
            </label>
            <input
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="Paste connection string here"
              className="w-full h-[34px] px-3.5 text-sm rounded-lg outline-none bg-zinc-800 border border-zinc-800 text-zinc-100 placeholder:text-zinc-400 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder:text-slate-400 focus:border-sky-500 light:focus:border-sky-500"
            />
          </div>
          <button
            onClick={() => handleConnect(connectionString)}
            className={PRIMARY_BUTTON}
          >
            Connect
          </button>
        </div>
      )}

      {status === "connected" && (
        <div className="w-full flex flex-col gap-y-4">
          <div className="flex items-center justify-center gap-x-2 bg-zinc-800 light:bg-slate-100 p-2.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-green-400 light:text-green-600 text-sm font-medium">
              Connected to AnythingLLM
            </p>
          </div>
          <OpenChatButton />
          <button onClick={handleDisconnect} className={DANGER_BUTTON}>
            Disconnect
          </button>
        </div>
      )}

      {status === "offline" && (
        <div className="w-full flex flex-col gap-y-4">
          <button onClick={disconnectFromExtension} className={DANGER_BUTTON}>
            Disconnect
          </button>
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 light:text-red-600 text-sm p-2.5 rounded-lg">
            AnythingLLM is currently offline. Please try again later.
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 light:text-red-600 text-sm p-2.5 rounded-lg">
          An error occurred. Please try again later.
        </div>
      )}

      {saveStatus && (
        <div
          className={`text-sm p-2.5 rounded-lg ${
            saveStatus.includes("Successfully")
              ? "bg-green-500/10 border border-green-500/50 text-green-400 light:text-green-600"
              : "bg-red-500/10 border border-red-500/50 text-red-400 light:text-red-600"
          }`}
        >
          {saveStatus}
        </div>
      )}
    </div>
  );
}

function OpenChatButton() {
  const [windowId, setWindowId] = useState(null);

  // sidePanel.open needs the user gesture, so the window id is fetched up front.
  useEffect(() => {
    chrome.windows.getCurrent().then((current) => setWindowId(current.id));
  }, []);

  const openChat = () => {
    chrome.sidePanel.open({ windowId }).then(() => window.close());
  };

  return (
    <button
      onClick={openChat}
      disabled={windowId === null}
      className={PRIMARY_BUTTON}
    >
      Open chat
    </button>
  );
}
