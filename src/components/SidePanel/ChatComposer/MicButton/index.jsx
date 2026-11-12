import React, { useEffect, useRef, useState } from "react";
import { Microphone } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const SILENCE_TIMEOUT_MS = 3200;

/**
 * Dictates into the composer with the browser's speech recognition.
 * @param {Object} props
 * @param {(text: string) => void} props.onTranscript - called with each finished phrase
 */
export default function MicButton({ onTranscript }) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const silenceTimer = useRef(null);
  const supported = "webkitSpeechRecognition" in window;

  useEffect(() => () => recognition.current?.stop(), []);

  function restartSilenceTimer() {
    clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(
      () => recognition.current?.stop(),
      SILENCE_TIMEOUT_MS
    );
  }

  function start() {
    const speech = new window.webkitSpeechRecognition();
    speech.continuous = true;
    speech.interimResults = true;
    speech.lang = navigator.language;
    speech.onresult = (e) => {
      restartSilenceTimer();
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal)
          onTranscript(e.results[i][0].transcript.trim());
      }
    };
    speech.onerror = (e) => {
      // Side panels cannot show the microphone prompt, so ask from a full tab.
      if (e.error === "not-allowed")
        chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
    };
    speech.onend = () => {
      clearTimeout(silenceTimer.current);
      recognition.current = null;
      setListening(false);
    };
    speech.start();
    recognition.current = speech;
    restartSilenceTimer();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      onClick={listening ? () => recognition.current?.stop() : start}
      title={listening ? t("composer.stopListening") : t("composer.speak")}
      aria-label={listening ? t("composer.stopListening") : t("composer.speak")}
      className={`group border-none flex justify-center items-center w-8 h-8 rounded-full hover:bg-zinc-700 light:hover:bg-slate-200 ${
        listening ? "bg-zinc-700 light:bg-slate-200" : "bg-transparent"
      }`}
    >
      <Microphone
        size={18}
        className={
          listening
            ? "text-white light:text-slate-800 animate-pulse"
            : "text-zinc-300 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-800"
        }
      />
    </button>
  );
}
