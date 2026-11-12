export const THEME_SETTING_KEY = "theme";
export const THEMES = ["system", "light", "dark"];

const systemLightQuery = window.matchMedia("(prefers-color-scheme: light)");

/**
 * Resolves a theme preference to the theme the panel renders in.
 * @param {"system"|"light"|"dark"} preference
 * @returns {"light"|"dark"}
 */
export function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  return systemLightQuery.matches ? "light" : "dark";
}

/**
 * Sets the theme on the document; the `light:` Tailwind variant and the root
 * colors in index.css key off this attribute.
 * @param {"light"|"dark"} theme
 */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Calls back whenever the operating system switches between light and dark.
 * @param {() => void} callback
 * @returns {() => void} unsubscribe
 */
export function onSystemThemeChange(callback) {
  systemLightQuery.addEventListener("change", callback);
  return () => systemLightQuery.removeEventListener("change", callback);
}

/**
 * @returns {boolean} whether the panel is currently rendered in light mode
 */
export function isLightMode() {
  return document.documentElement.dataset.theme === "light";
}
