window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "NEW_BROWSER_EXTENSION_CONNECTION") return;
  chrome.runtime.sendMessage({
    action: "newApiKey",
    connectionString: event.data.apiKey,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    sendResponse({ content: document.body.innerText });
  }
});
