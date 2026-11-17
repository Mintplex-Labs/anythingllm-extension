<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/media/anything-llm.png">
    <img src="src/media/anything-llm-dark.png" alt="AnythingLLM" width="320">
  </picture>
</p>

<h3 align="center">AnythingLLM Browser Companion</h3>

<p align="center">
  Chat with any page using AnythingLLM from your browser.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/anythingllm-browser-compa/pncmdlebcopjodenlllcomedphdmeogm">Chrome Web Store</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting started</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

> [!NOTE]
> The companion needs a running [AnythingLLM](https://anythingllm.com/download) instance, version **1.20.0 or newer**. Desktop, Docker, and Cloud instances all work.

## Features

- **Chat with any page.** The tab you're on is one click away as context.
- **Bring in more tabs.** Type `@` to add other currently open tabs to the conversation.
- **Right-click actions.** Highlight text and choose Ask, Summarize, Explain, Rewrite, or Fix spelling and grammar. Right-click a page to chat with it, or an image to add it to the chat.
- **Attachments and voice.** Drag, drop, or paste files and images, or dictate with the microphone.
- **Agents in the panel.** Approve tool calls, answer clarifying questions, and see charts, files, and scheduled jobs.
- **Synced threads.** Every chat is saved as a thread in your workspace, so you can continue it in AnythingLLM.
- **Save the web.** Send a selection or a whole page to AnythingLLM, or embed it straight into a workspace.
- **Your instance, your data.** The chats, pages, and files you share go only to the AnythingLLM instance you connect.

## Getting started

1. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/anythingllm-browser-compa/pncmdlebcopjodenlllcomedphdmeogm), or [build it yourself](#development).
2. Click the toolbar icon, or press `Alt+Shift+L`, to open the side panel.
3. In AnythingLLM, go to **Settings > Tools > Browser Extension** and click **Connect**, then approve the request in the panel. You can also paste the connection string into the panel instead.
4. Pick a workspace and start chatting.

Disconnecting, settings (language and light/dark/system theme), and the threads list are in the panel's header.

## Development

You'll need Node.js 18+ and Yarn.

```sh
yarn install
yarn dev     # rebuilds dist/ on every change
yarn build   # one-off production build
yarn build:prod  # build, then zip dist/ into release/ for the Chrome Web Store
```

Then load it into Chrome:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `dist` folder.
3. After a rebuild, click the reload icon on the extension's card.

### Project layout

| Path | What's in it |
| --- | --- |
| `public/manifest.json` | Extension manifest (name, version, permissions) |
| `public/background.js` | Service worker: context menus, connection handling, side panel |
| `public/contentScript.js` | Runs on pages to read content and relay connection requests |
| `src/components/SidePanel/` | The side panel React app |
| `src/locales/` | UI strings and translation scripts |

### Translations

English strings live in `src/locales/en/`. Run `yarn translations:verify` after changing them. `yarn translations:normalize`, `yarn translations:unused`, and `yarn translations:prune` keep the files tidy.

## Contributing

Contributions are welcome.

1. Fork the repo and create a branch from `main`.
2. Make your change, then run `yarn lint` and `yarn build`.
3. Load the built extension and check your change against a real AnythingLLM instance.
4. Open a pull request that describes what changed and includes screenshots for UI changes.

Found a bug or have an idea? [Open an issue](https://github.com/Mintplex-Labs/anythingllm-extension/issues).

## Related

- [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm): the all-in-one AI app this extension connects to
- [AnythingLLM Desktop](https://anythingllm.com/download)
- [Documentation](https://docs.anythingllm.com)

## License

[MIT](LICENSE) © [Mintplex Labs](https://github.com/Mintplex-Labs)
