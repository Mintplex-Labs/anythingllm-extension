import React, { useState } from "react";
import { LinkSimple } from "@phosphor-icons/react";
import Screen, { PRIMARY_BUTTON, SECONDARY_BUTTON } from "../Screen";

/**
 * Approval for a connection string an AnythingLLM page handed to the extension.
 * @param {Object} props
 * @param {{apiBase: string, apiKey: string, requestedBy: string}} props.request
 * @param {boolean} props.connected - approving replaces the current connection
 * @param {() => Promise<string|null>} props.onApprove - resolves with an error message, or null once connected
 * @param {() => void} props.onReject
 */
export default function PendingConnectionScreen({
  request,
  connected,
  onApprove,
  onReject,
}) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);

  async function approve() {
    setApproving(true);
    setError(null);
    const failure = await onApprove();
    setError(failure);
    setApproving(false);
  }

  return (
    <Screen
      icon={<LinkSimple size={36} weight="bold" />}
      title="Connect this extension?"
      description={
        <>
          <span className="font-semibold text-white light:text-slate-900">
            {request.requestedBy}
          </span>{" "}
          wants to connect this extension to{" "}
          <span className="font-mono break-all">{request.apiBase}</span>. Only
          approve if you just requested this from your own AnythingLLM instance.
        </>
      }
    >
      {connected && (
        <p className="text-sm text-amber-400 light:text-amber-600">
          This will replace your current connection.
        </p>
      )}
      <button onClick={approve} disabled={approving} className={PRIMARY_BUTTON}>
        {approving ? "Connecting..." : "Approve"}
      </button>
      <button onClick={onReject} className={SECONDARY_BUTTON}>
        Reject
      </button>
      {!!error && (
        <p className="text-sm text-red-400 light:text-red-600">{error}</p>
      )}
    </Screen>
  );
}
