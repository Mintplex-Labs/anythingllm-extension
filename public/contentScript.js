window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "NEW_BROWSER_EXTENSION_CONNECTION") return;
  chrome.runtime.sendMessage({
    action: "newApiKey",
    connectionString: event.data.apiKey,
  });
});

const MAX_PAGE_CONTENT_LENGTH = 1_000_000;

function sanitizePageContent(rawText) {
  if (typeof rawText !== "string") return "";
  // Strip control characters (except common whitespace) that could be used to
  // smuggle hidden instructions, then bound the size of what we forward on.
  return rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, MAX_PAGE_CONTENT_LENGTH);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    sendResponse({ content: sanitizePageContent(document.body.innerText) });
  }
});
