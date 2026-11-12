import { useEffect, useState } from "react";
import BrowserExtension from "@/models/browserExtension";

/**
 * Loads the connected instance's logo for the current theme: the logo the
 * admin uploaded, or the default AnythingLLM one.
 * @param {string|null} apiBase
 * @param {"light"|"dark"} theme
 * @returns {string|null} object URL for an <img>, null until loaded or when unavailable
 */
export default function useLogo(apiBase, theme) {
  const [logoURL, setLogoURL] = useState(null);

  useEffect(() => {
    if (!apiBase) return setLogoURL(null);
    let current = true;
    let objectURL = null;
    BrowserExtension.fetchLogo(apiBase, theme).then(({ logoURL }) => {
      objectURL = logoURL;
      if (current) setLogoURL(logoURL);
      else if (logoURL) URL.revokeObjectURL(logoURL);
    });
    return () => {
      current = false;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [apiBase, theme]);

  return logoURL;
}
