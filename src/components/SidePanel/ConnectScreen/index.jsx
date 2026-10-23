import React, { useState } from "react";
import { PlugsConnected } from "@phosphor-icons/react";
import Screen, { PRIMARY_BUTTON } from "../Screen";

const INPUT =
  "w-full h-[34px] px-3.5 text-sm rounded-lg outline-none bg-zinc-800 border border-zinc-800 text-zinc-100 placeholder:text-zinc-400 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder:text-slate-400 focus:border-sky-500 light:focus:border-sky-500";

/**
 * @param {Object} props
 * @param {(connectionString: string) => Promise<string|null>} props.onConnect - resolves with an error message, or null once connected
 * @param {string|null} [props.notice] - why the previous connection ended
 */
export default function ConnectScreen({ onConnect, notice = null }) {
  const [connectionString, setConnectionString] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setConnecting(true);
    setError(null);
    const failure = await onConnect(connectionString.trim());
    setError(failure);
    setConnecting(false);
  }

  return (
    <Screen
      icon={<PlugsConnected size={36} weight="fill" />}
      title="Connect to AnythingLLM"
      description="Paste the connection string from Settings > Tools > Browser Extension in your AnythingLLM instance."
    >
      {!!notice && (
        <p className="text-sm text-amber-400 light:text-amber-600">{notice}</p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-y-2">
        <input
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="Paste connection string"
          className={INPUT}
          autoFocus
          required
        />
        <button type="submit" disabled={connecting} className={PRIMARY_BUTTON}>
          {connecting ? "Connecting..." : "Connect"}
        </button>
      </form>
      {!!error && (
        <p className="text-sm text-red-400 light:text-red-600">{error}</p>
      )}
    </Screen>
  );
}
