import browser from "webextension-polyfill";

window.addEventListener("message", (event) => {
  if (event.data.type === "NEW_BROWSER_EXTENSION_CONNECTION") {
    browser.runtime.sendMessage({
      action: "newApiKey",
      connectionString: event.data.apiKey,
    });
  }
});

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "getPageContent") {
    return Promise.resolve({content: document.body.innerText});
  }
});

