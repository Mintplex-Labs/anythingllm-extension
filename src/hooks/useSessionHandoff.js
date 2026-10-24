import { useEffect, useRef } from "react";

/**
 * Takes a value the background script parks in session storage for the panel,
 * like a context menu click, whether it arrived before or after the panel
 * opened. The value is cleared once taken, and its `id` keeps it from being
 * taken twice when the initial read and the change event both see it.
 * @param {string} key
 * @param {(value: {id: string}) => void} onValue
 */
export default function useSessionHandoff(key, onValue) {
  const onValueRef = useRef(onValue);
  onValueRef.current = onValue;
  const takenId = useRef(null);

  useEffect(() => {
    const take = (value) => {
      if (!value || value.id === takenId.current) return;
      takenId.current = value.id;
      chrome.storage.session.remove(key);
      onValueRef.current(value);
    };
    chrome.storage.session.get(key).then((stored) => take(stored[key]));
    const onStorageChanged = (changes, area) => {
      if (area === "session" && changes[key]) take(changes[key].newValue);
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [key]);
}
