/**
 * The extension follows the system color scheme since it cannot read
 * the theme picked inside AnythingLLM.
 * @returns {boolean}
 */
export function isLightMode() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}
