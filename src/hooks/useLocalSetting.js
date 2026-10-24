import { useEffect, useState } from "react";

/**
 * A preference kept in extension storage, so it survives restarts and stays
 * in sync across every open panel.
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {[T, (value: T) => void]}
 */
export default function useLocalSetting(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    chrome.storage.local
      .get(key)
      .then((stored) => key in stored && setValue(stored[key]));
    const onStorageChanged = (changes, area) => {
      if (area === "local" && key in changes)
        setValue(changes[key].newValue ?? defaultValue);
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [key]);

  return [value, (next) => chrome.storage.local.set({ [key]: next })];
}
