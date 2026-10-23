import React from "react";
import { ArrowCircleUp } from "@phosphor-icons/react";
import { MIN_SERVER_VERSION } from "@/utils/serverVersion";
import Screen, {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "../Screen";

export default function UpdateRequired({ updateUrl, onRetry, onDisconnect }) {
  return (
    <Screen
      icon={<ArrowCircleUp size={36} weight="fill" />}
      title="Update AnythingLLM"
      description={`Chat from the extension needs AnythingLLM ${MIN_SERVER_VERSION} or newer. Update your instance, then check again.`}
    >
      <a
        href={updateUrl}
        target="_blank"
        rel="noreferrer"
        className={`${PRIMARY_BUTTON} no-underline`}
      >
        Get the latest version
      </a>
      <button onClick={onRetry} className={SECONDARY_BUTTON}>
        Check again
      </button>
      <button onClick={onDisconnect} className={TEXT_BUTTON}>
        Disconnect
      </button>
    </Screen>
  );
}
