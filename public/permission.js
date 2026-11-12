// Chrome will not show the microphone prompt inside a side panel, so the
// panel opens this page in a tab to ask once. The grant is shared by the extension.
const status = document.getElementById("status");

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    stream.getTracks().forEach((track) => track.stop());
    status.textContent =
      "Microphone enabled. You can close this tab and use the mic in the side panel.";
    setTimeout(() => window.close(), 1500);
  })
  .catch(() => {
    status.textContent =
      "Microphone access was blocked. Allow it for this extension in Chrome's site settings and try again.";
  });
