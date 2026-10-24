// Looking for a language to translate the AnythingLLM extension to?
// Create a `common.js` file in the language's ISO code folder https://www.w3.org/International/O-charset-lang.html
// eg: Spanish => es/common.js
// eg: French => fr/common.js
// Register it below, then run `yarn translations:normalize` and `yarn translations:create` to fill it in.
// By default, the extension uses the browser's language. If a string is not defined or is null in
// the translation file, it falls back to the value in the en/common.js file.
// RULES:
// The EN translation file is the ground-truth for what keys and options are available. DO NOT add a special key
// to a specific language file as this will break the other languages. Any new keys should be added to english
// and the language file you are working on.

// Contributor Notice: If you are adding a translation you MUST locally run `yarn translations:verify` prior to PR.
// please do not submit PR's without first verifying this test passes as it will tell you about missing keys or values
// from the primary dictionary.

import English from "./en/common.js";

export const defaultNS = "common";
export const resources = {
  en: {
    common: English,
  },
};
