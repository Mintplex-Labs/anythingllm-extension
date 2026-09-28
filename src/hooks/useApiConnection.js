import { useState, useEffect } from "react";
import AnythingLLMLogo from "@/media/anything-llm.png";
import BrowserExtension from "@/models/browserExtension";

/**
 * Fetches connection information for API key provided
 * @returns {{
 * status: ("loading"|"notConnected"|"offline"|"connected"),
 * pendingConnection: {apiBase: string, apiKey: string, requestedBy: string} | null,
 * }}
 */
export default function useApiConnection() {
  const [status, setStatus] = useState("loading");
  const [logoUrl, setLogoUrl] = useState(AnythingLLMLogo);
  const [pendingConnection, setPendingConnection] = useState(null);

  useEffect(() => {
    checkApiKeyStatus();
    fetchLogo();
    chrome.storage.session
      .get(["pendingConnection"])
      .then(({ pendingConnection }) =>
        setPendingConnection(pendingConnection || null),
      );

    const onStorageChanged = (changes, area) => {
      if (area !== "session" || !changes.pendingConnection) return;
      setPendingConnection(changes.pendingConnection.newValue || null);
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  const clearPendingConnection = async () => {
    await chrome.storage.session.remove(["pendingConnection"]);
    setPendingConnection(null);
  };

  const checkApiKeyStatus = async () => {
    const { apiBase, apiKey } = await chrome.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) {
      setStatus("notConnected");
      return;
    }

    try {
      const { online } = await BrowserExtension.checkOnline(apiBase);
      if (!online) {
        setStatus("offline");
        return;
      }

      const { response } = await BrowserExtension.checkApiKey(apiBase, apiKey);
      if (response.ok) {
        setStatus("connected");
        chrome.runtime.sendMessage({ action: "connectionUpdated" });
      } else {
        await chrome.storage.sync.remove(["apiBase", "apiKey"]);
        setStatus("notConnected");
        chrome.runtime.sendMessage({ action: "connectionUpdated" });
      }
    } catch (error) {
      setStatus("error");
    }
  };

  const fetchLogo = async () => {
    const { apiBase } = await chrome.storage.sync.get(["apiBase"]);
    if (!apiBase) return;
    const { success, logoURL } = await BrowserExtension.fetchLogo(apiBase);
    setLogoUrl(success ? logoURL : AnythingLLMLogo);
  };

  const onConnectionChange = () => {
    checkApiKeyStatus();
    fetchLogo();
  };

  return {
    status,
    logoUrl,
    checkApiKeyStatus: onConnectionChange,
    pendingConnection,
    clearPendingConnection,
  };
}
