/**
 * @returns {Promise<chrome.tabs.Tab|null>} active tab in the window this page is in
 */
export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

/**
 * Reads the visible text of a tab. Returns an empty string for pages
 * extensions cannot script, like chrome:// pages or unloaded tabs.
 * @param {number} tabId
 * @returns {Promise<string>}
 */
export async function readTabText(tabId) {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.body?.innerText ?? "",
    });
    return injection?.result ?? "";
  } catch {
    return "";
  }
}
