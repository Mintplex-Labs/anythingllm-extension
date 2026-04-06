# AnythingLLM Browser Extension for Chrome and Firefox

<p align="center">
  <img src="src/media/anything-llm.png" alt="AnythingLLM Browser Extension logo" width="200">
</p>

<p align="center">
  Seamlessly integrate AnythingLLM into Google Chrome and Firefox.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

## Features

- 🔗 Connect to your AnythingLLM instance with a simple connection string or automatic browser extension registration
- 📑 Save selected text to AnythingLLM directly from any webpage
- 📄 Upload entire web pages to AnythingLLM for processing
- 🗂️ Embed content into specific workspaces
- 🔄 Automatic logo synchronization with your AnythingLLM instance

## Installation

### Chrome
<a href="https://chromewebstore.google.com/detail/anythingllm-browser-compa/pncmdlebcopjodenlllcomedphdmeogm">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" alt="Chrome Extension" width="200">
</a>

_or_

1. Clone this repository or download the latest release.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the `dist/chrome` folder from this project (after running `yarn build:chrome`).

### Firefox
1. Clone this repository or download the latest release.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on...".
4. Select the `manifest.json` file inside the `dist/firefox` folder (after running `yarn build:firefox`).

## Development

To set up the project for development:

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Run the development server (default build):

   ```bash
   yarn dev
   ```

3. To build the unpacked extension:

   ```bash
   yarn build:chrome
   ```
   ```bash
   yarn build:firefox
   ```

   The unpacked extension will be built in the `dist/chrome` or `dist/firefox` folder.

4. To package the unpacked extension:

   ```bash
   yarn package:chrome
   ```
   ```bash
   yarn package:firefox
   ```

   The packaged extension will be in `artifacts/{chrome,firefox}/anythingllm_browser_companion-*.zip`.

## Usage

1. Click on the AnythingLLM extension icon in your browser toolbar.
2. Enter your AnythingLLM browser extension API key to connect to your instance (or create the API key inside AnythingLLM and have it automatically register to the extension).
3. Right-click on selected text or anywhere on a webpage to see AnythingLLM options.
4. Choose to save selected text or the entire page to AnythingLLM.

## Contributing

Contributions are welcome! Feel free to submit a PR.

## Acknowledgements

- This extension is designed to work with [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm).

---

Copyright © 2024 [Mintplex Labs](https://github.com/Mintplex-Labs). <br />
This project is [MIT](../LICENSE) licensed.
