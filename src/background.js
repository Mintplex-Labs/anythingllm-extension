import browser from "webextension-polyfill";

const ContextMenuModel = {
  async create(workspaces) {
    await browser.contextMenus.removeAll();

    if (workspaces && workspaces.length > 0) {
      browser.contextMenus.create({
        id: "saveToAnythingLLM",
        title: "Save selected to AnythingLLM",
        contexts: ["selection"],
      });

      browser.contextMenus.create({
        id: "embedToWorkspace",
        title: "Embed selected content to workspace",
        contexts: ["selection"],
      });

      browser.contextMenus.create({
        id: "saveEntirePageToAnythingLLM",
        title: "Save entire page to AnythingLLM",
        contexts: ["page"],
      });

      browser.contextMenus.create({
        id: "embedEntirePageToWorkspace",
        title: "Embed entire page to workspace",
        contexts: ["page"],
      });

      workspaces.forEach((workspace) => {
        browser.contextMenus.create({
          id: `workspace-selected-${workspace.id}`,
          parentId: "embedToWorkspace",
          title: workspace.name,
          contexts: ["selection"],
        });
        browser.contextMenus.create({
          id: `workspace-page-${workspace.id}`,
          parentId: "embedEntirePageToWorkspace",
          title: workspace.name,
          contexts: ["page"],
        });
      });
    } else {
      browser.contextMenus.create({
        id: "saveToAnythingLLM",
        title: "Save selected to AnythingLLM",
        contexts: ["selection"],
      });
      browser.contextMenus.create({
        id: "saveEntirePageToAnythingLLM",
        title: "Save entire page to AnythingLLM",
        contexts: ["page"],
      });
    }
  },

  async remove() {
    await browser.contextMenus.removeAll();
  },
};

const ExtensionModel = {
  async checkApiKeyValidity() {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);

    if (!apiBase || !apiKey) {
      await ContextMenuModel.remove();
      return false;
    }

    const data = await fetch(`${apiBase}/browser-extension/check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Response not ok.')
        return res.json();
      })
      .catch(() => null);

    if (data === null) {
      await browser.storage.sync.remove(["apiBase", "apiKey"]);
      await ContextMenuModel.remove();
      return false;
    }

    await ContextMenuModel.create(data.workspaces);
    return true;
  },

  async updateWorkspaces() {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);

    if (!apiBase || !apiKey) return await ContextMenuModel.remove();

    const data = await fetch(`${apiBase}/browser-extension/check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Response not ok.')
        return res.json();
      })
      .catch(() => null);

    if (data === null) return await ContextMenuModel.remove();
    await ContextMenuModel.create(data.workspaces);
    return;
  },

  async saveToAnythingLLM(selectedText, pageTitle, pageUrl) {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) return;

    this.showNotification(
      'loading',
      "Uploading entire page into available documents. Please wait."
    );
    const response = await fetch(
      `${apiBase}/browser-extension/upload-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          textContent: selectedText,
          metadata: { title: pageTitle, url: pageUrl },
        }),
      }
    );

    this.handleResponse(response, "save content");
  },

  async embedToWorkspace(workspaceId, selectedText, pageTitle, pageUrl) {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) return;

    this.showNotification(
      'loading',
      "Uploading selected text into workspace. Please wait."
    );
    const response = await fetch(`${apiBase}/browser-extension/embed-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workspaceId,
        textContent: selectedText,
        metadata: { title: pageTitle, url: pageUrl },
      }),
    });

    this.handleResponse(response, "embed content");
  },

  async saveEntirePageToAnythingLLM(pageContent, pageTitle, pageUrl) {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) return;

    this.showNotification(
      'loading',
      "Uploading entire page text into available documents. Please wait."
    );
    const response = await fetch(
      `${apiBase}/browser-extension/upload-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          textContent: pageContent,
          metadata: { title: pageTitle, url: pageUrl },
        }),
      }
    );

    this.handleResponse(response, "save entire page");
  },

  async embedEntirePageToWorkspace(
    workspaceId,
    pageContent,
    pageTitle,
    pageUrl
  ) {
    const { apiBase, apiKey } = await browser.storage.sync.get([
      "apiBase",
      "apiKey",
    ]);
    if (!apiBase || !apiKey) return;

    this.showNotification(
      'loading',
      "Embedding entire page into workspace. Please wait."
    );
    const response = await fetch(`${apiBase}/browser-extension/embed-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workspaceId,
        textContent: pageContent,
        metadata: { title: pageTitle, url: pageUrl },
      }),
    });

    this.handleResponse(response, "embed entire page");
  },

  async handleResponse(response, action) {
    if (response.status === 401 || response.status === 403) {
      await browser.storage.sync.remove(["apiBase", "apiKey"]);
      await ContextMenuModel.remove();
      this.showNotification(
        'error',
        "Authentication failed. Please reconnect the extension."
      );
    } else if (!response.ok) {
      await this.checkApiKeyValidity();
      this.showNotification("error", `Failed to ${action}. Please try again.`);
    } else {
      this.showNotification(
        "success",
        "Successfully saved content to AnythingLLM."
      );
    }
  },

  /**
   * Shows badge notification on extension icon
   * @param {"success"|"error"|"loading"} type 
   * @param {string} message 
   */
  showNotification(type, message) {
    const NOTIFICATION_MAP = {
      success: {
        title: "Success",
        icon: "✅",
      },
      error: {
        title: "Error",
        icon: "❌",
      },
      loading: {
        title: "Loading",
        icon: "⏳",
      }
    }
    if (!NOTIFICATION_MAP.hasOwnProperty(type)) return;
    const { icon, title } = NOTIFICATION_MAP[type];
    browser.action.setBadgeText({ text: icon })
    browser.action.setTitle({ title: `${title}: ${message}` });

    setTimeout(() => {
      browser.action.setBadgeText({ text: "" });
      browser.action.setTitle({ title: "AnythingLLM Extension" });
    }, 5000);
  },
};

// Event Listeners
browser.runtime.onInstalled.addListener(async () => {
  await ExtensionModel.checkApiKeyValidity();
});

browser.runtime.onMessage.addListener(async (message, _sender) => {
  if (message.action === "connectionUpdated") return ExtensionModel.checkApiKeyValidity();

  if (message.action === "newApiKey") {
    const [apiBase, apiKey] = message.connectionString.split("|");
    await browser.storage.sync.set({ apiBase, apiKey });
    await ExtensionModel.checkApiKeyValidity();
    await browser.action.openPopup();
    return;
  }
});

async function getPageContent(tabId) {
  try {
    const response = await browser.tabs.sendMessage(tabId, { action: "getPageContent" });
    if (response && response.content) {
      return response.content;
    } else {
      throw new Error("Failed to get page content");
    }
  } catch (error) {
    console.error("Error in getPageContent:", error);
    throw error;
  }
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToAnythingLLM") {
    ExtensionModel.saveToAnythingLLM(info.selectionText, tab.title, tab.url);
    return;
  }

  if (info.menuItemId.startsWith("workspace-selected-")) {
    const workspaceId = info.menuItemId.split("-")[2];
    ExtensionModel.embedToWorkspace(
      workspaceId,
      info.selectionText,
      tab.title,
      tab.url
    );
    return;
  }

  if (info.menuItemId === "saveEntirePageToAnythingLLM") {
    getPageContent(tab.id)
      .then((content) => {
        ExtensionModel.saveEntirePageToAnythingLLM(content, tab.title, tab.url);
      })
      .catch((error) => {
        console.error("Error getting page content:", error);
        ExtensionModel.showNotification(
          "error",
          "Failed to get page content. Please try again."
        );
      });
    return;
  }

  if (info.menuItemId.startsWith("workspace-page-")) {
    const workspaceId = info.menuItemId.split("-")[2];
    getPageContent(tab.id)
      .then((content) => {
        ExtensionModel.embedEntirePageToWorkspace(
          workspaceId,
          content,
          tab.title,
          tab.url
        );
      })
      .catch((error) => {
        console.error("Error getting page content:", error);
        ExtensionModel.showNotification(
          "error",
          "Failed to get page content. Please try again."
        );
      });
    return;
  }
});

// Remove context menu items when connection is lost
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && (changes.apiBase || changes.apiKey)) {
    if (!changes.apiBase?.newValue || !changes.apiKey?.newValue) {
      ContextMenuModel.remove();
    }
  }
});

// Update workspaces periodically
browser.alarms.create("updateWorkspaces", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateWorkspaces") {
    ExtensionModel.updateWorkspaces();
  }
});
