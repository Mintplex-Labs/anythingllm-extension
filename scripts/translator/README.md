# Extension auto-translator

Fills in missing extension translations with a local model, the same way `extras/translator` does for the AnythingLLM app. Expect to run it by hand and review the output before committing.

## Getting started

- Install [Ollama](https://ollama.com)
- `ollama pull translategemma:4b`

## Adding a language

All translations are based on the English dictionary in `src/locales/en/common.js`, so a string must exist there to be translated.

1. Create `src/locales/<lang>/common.js` with `const TRANSLATIONS = {}; export default TRANSLATIONS;`.
2. Register it in `src/locales/resources.js`.
3. `yarn translations:normalize` adds every English key to the new file as `null`.
4. `node scripts/translator/index.mjs <lang>` translates every `null` value, eg: `node scripts/translator/index.mjs es`.
   `yarn translations:create` does this for every registered language.
5. `yarn translations:verify` confirms every language has the same keys as English.

## Gotchas

- Sometimes a translation runs on until the token window is exceeded. You will see it as a very long line.
- Single words or symbols like "@" can go off the rails. A one word English string that becomes a sentence is wrong.
- Always review every line for removed `{{}}` placeholders, removed `<tag>` markers, or misspelled brand names like `AnyLLM` instead of `AnythingLLM`.
