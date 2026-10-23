import { isLightMode } from "@/utils/theme";

// AnythingLLM answered 403: the API key was deleted there.
export class RevokedKeyError extends Error {
  constructor() {
    super("This connection was removed in AnythingLLM.");
    this.name = "RevokedKeyError";
  }
}

const BrowserExtension = {
  checkApiKey: async function (apiBase, apiKey) {
    return await fetch(`${apiBase}/browser-extension/check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Bad response to /check");
        return res.json();
      })
      .then((data) => ({ response: { ok: true }, data, error: null }))
      .catch((e) => {
        console.error(e);
        return { response: { ok: false }, data: null, error: e.message };
      });
  },

  checkOnline: async function (apiBase) {
    return await fetch(`${apiBase}/ping`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response to /ping");
        return res.json();
      })
      .then((data) => ({ online: true, data, error: null }))
      .catch((e) => {
        return { online: false, data: null, error: e.message };
      });
  },

  /**
   * Reads the version the connected AnythingLLM reports.
   * @param {string} apiBase
   * @returns {Promise<{version: string|null, error: string|null}>} error only when unreachable
   */
  serverVersion: async function (apiBase) {
    return await fetch(`${apiBase}/utils/metrics`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => ({ version: data.appVersion ?? null, error: null }))
      .catch((e) => ({ version: null, error: e.message }));
  },

  fetchLogo: async function (apiBase) {
    try {
      const theme = isLightMode() ? "light" : "dark";
      const response = await fetch(`${apiBase}/system/logo?theme=${theme}`, {
        method: "GET",
        cache: "no-cache",
      });

      if (response.ok && response.status !== 204) {
        const blob = await response.blob();
        const logoURL = URL.createObjectURL(blob);
        return { success: true, error: null, logoURL };
      } else {
        return { success: false, error: "Logo not available", logoURL: null };
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
      return { success: false, error: error.message, logoURL: null };
    }
  },

  /**
   * Lists the workspaces the connected API key can access. Uses /check so the
   * key is validated the same way on every AnythingLLM version.
   * @param {string} apiBase
   * @param {string} apiKey
   * @returns {Promise<{workspaces: {id: number, name: string}[], revoked: boolean, error: string|null}>} revoked when the key no longer exists in AnythingLLM
   */
  workspaces: async function (apiBase, apiKey) {
    return await fetch(`${apiBase}/browser-extension/check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (res.status === 403) return { revoked: true };
        if (!res.ok) throw new Error("Bad response to /check");
        return res.json();
      })
      .then((data) => ({
        workspaces: data.workspaces ?? [],
        revoked: !!data.revoked,
        error: null,
      }))
      .catch((e) => ({ workspaces: [], revoked: false, error: e.message }));
  },

  /**
   * Starts a thread in the workspace; the chat shows up under it in the app.
   * @param {{apiBase: string, apiKey: string}} connection
   * @param {number} workspaceId
   * @returns {Promise<{threadId: number|null, error: string|null}>}
   * @throws {RevokedKeyError} when the key no longer exists in AnythingLLM
   */
  newThread: async function ({ apiBase, apiKey }, workspaceId) {
    return await fetch(`${apiBase}/browser-extension/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ workspaceId }),
    })
      .then((res) => {
        if (res.status === 403) throw new RevokedKeyError();
        if (!res.ok) throw new Error("Could not start a thread");
        return res.json();
      })
      .then((data) => ({ threadId: data.thread.id, error: null }))
      .catch((e) => {
        if (e instanceof RevokedKeyError) throw e;
        return { threadId: null, error: e.message };
      });
  },

  /**
   * Sends a chat message and calls onChunk with every streamed event.
   * @param {{
   *  apiBase: string,
   *  apiKey: string,
   *  body: {workspaceId: number, threadId: number, message: string, context: {title: string, url: string, content: string}[], attachments: {name: string, mime: string, contentString: string}[]},
   *  signal: AbortSignal,
   *  onChunk: (chunk: object) => void,
   * }} params
   * @returns {Promise<void>}
   * @throws {RevokedKeyError} when the key no longer exists in AnythingLLM
   */
  streamChat: async function ({ apiBase, apiKey, body, signal, onChunk }) {
    const response = await fetch(`${apiBase}/browser-extension/stream-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (response.status === 403) throw new RevokedKeyError();
    if (!response.ok) {
      const { error } = await response.json().catch(() => ({}));
      throw new Error(error || "Failed to send message");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop();
      for (const event of events) {
        if (!event.startsWith("data: ")) continue;
        try {
          onChunk(JSON.parse(event.slice(6)));
        } catch {}
      }
    }
  },

  /**
   * Fetches an image or file an agent generated during a chat.
   * @param {{apiBase: string, apiKey: string}} connection
   * @param {{type: "image"|"file", storageFilename: string}} output
   * @returns {Promise<{url: string|null, error: string|null}>} url is an object URL the caller owns
   */
  generatedFile: async function ({ apiBase, apiKey }, output) {
    const route =
      output.type === "image" ? "generated-images" : "generated-files";
    const filename = encodeURIComponent(output.storageFilename);
    return await fetch(`${apiBase}/browser-extension/${route}/${filename}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load file");
        return res.blob();
      })
      .then((blob) => ({ url: URL.createObjectURL(blob), error: null }))
      .catch((e) => ({ url: null, error: e.message }));
  },

  /**
   * Answers a question the agent asked mid-stream: a tool approval
   * ({approved}), a clarifying question ({skipped, answers}) or a hold.
   * @param {{apiBase: string, apiKey: string}} connection
   * @param {string} requestId
   * @param {object} reply
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  agentReply: async function ({ apiBase, apiKey }, requestId, reply) {
    return await fetch(`${apiBase}/browser-extension/agent-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ requestId, reply }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request not found");
        return { success: true, error: null };
      })
      .catch((e) => ({ success: false, error: e.message }));
  },

  /**
   * Lets a skill run without asking again ("Always allow").
   * @param {{apiBase: string, apiKey: string}} connection
   * @param {string} skillName
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  whitelistSkill: async function ({ apiBase, apiKey }, skillName) {
    return await fetch(`${apiBase}/browser-extension/agent-skills/whitelist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ skillName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not update whitelist");
        return { success: true, error: null };
      })
      .catch((e) => ({ success: false, error: e.message }));
  },

  disconnect: async function (apiBase, apiKey) {
    try {
      await fetch(`${apiBase}/browser-extension/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!!data.error)
            throw new Error(data.error || "Failed to disconnect");
          return;
        });
      return { success: true, error: null };
    } catch (error) {
      console.error("Disconnect error:", error);
      return { success: false, error: error.message };
    }
  },
};

export default BrowserExtension;
