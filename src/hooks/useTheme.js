import { useEffect, useState } from "react";
import useLocalSetting from "./useLocalSetting";
import {
  THEME_SETTING_KEY,
  applyTheme,
  onSystemThemeChange,
  resolveTheme,
} from "@/utils/theme";

/**
 * Applies the theme picked in settings, following the operating system when
 * set to "system".
 * @returns {"light"|"dark"} the theme in effect
 */
export default function useTheme() {
  const [preference] = useLocalSetting(THEME_SETTING_KEY, "system");
  const [systemChanges, setSystemChanges] = useState(0);
  const theme = resolveTheme(preference);

  useEffect(
    () => onSystemThemeChange(() => setSystemChanges((n) => n + 1)),
    []
  );

  useEffect(() => applyTheme(theme), [theme, systemChanges]);

  return theme;
}
