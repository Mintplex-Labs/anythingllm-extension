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
