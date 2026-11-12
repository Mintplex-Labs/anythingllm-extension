import markdownIt from "markdown-it";

const markdown = markdownIt({ html: false, linkify: true, breaks: true });
// Links would otherwise navigate the side panel itself.
markdown.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return self.renderToken(tokens, idx, options);
};

/**
 * Renders chat markdown to HTML. Raw HTML in the source is escaped.
 * @param {string} text
 * @returns {string}
 */
export function renderMarkdown(text) {
  return markdown.render(text);
}

/**
 * Renders a model's thinking, same as the main app. Reasoning models indent
 * freely, so indented code blocks are turned off (fenced ``` blocks still
 * work) and deep indentation is halved so nested lists still parse as lists.
 * The toggle is safe on the shared instance because rendering is synchronous.
 * @param {string} text
 * @returns {string}
 */
export function renderThoughtMarkdown(text = "") {
  markdown.disable("code");
  try {
    return markdown.render(normalizeThoughtIndentation(text));
  } finally {
    markdown.enable("code");
  }
}

/**
 * Halves indentation of four or more spaces and tightens list marker padding.
 * Lines inside fenced ``` blocks pass through untouched.
 * @param {string} text
 * @returns {string}
 */
function normalizeThoughtIndentation(text = "") {
  let inFence = false;
  return text
    .split("\n")
    .map((line) => {
      if (line.trim().startsWith("```")) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      const width = line.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length;
      const normWidth = width >= 4 ? Math.floor(width / 2) : width;
      const dedented = " ".repeat(normWidth) + line.trimStart();
      return dedented.replace(/^(\s*(?:[*+-]|\d+[.)]))\s{2,}/, "$1 ");
    })
    .join("\n");
}
