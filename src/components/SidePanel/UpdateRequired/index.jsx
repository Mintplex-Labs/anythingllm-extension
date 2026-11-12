import React from "react";
import { ArrowCircleUp } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { MIN_SERVER_VERSION } from "@/utils/serverVersion";
import Screen, {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "../Screen";

/**
 * Shown when the connected AnythingLLM is older than the extension needs.
 * @param {Object} props
 * @param {string} props.updateUrl
 * @param {() => void} props.onRetry
 * @param {() => void} props.onContinue - use the extension anyway; some features may not work
 * @param {() => void} props.onDisconnect
 */
export default function UpdateRequired({
  updateUrl,
  onRetry,
  onContinue,
  onDisconnect,
}) {
  const { t } = useTranslation();
  return (
    <Screen
      icon={<ArrowCircleUp size={36} weight="fill" />}
      title={t("update.title")}
      description={t("update.description", { version: MIN_SERVER_VERSION })}
    >
      <a
        href={updateUrl}
        target="_blank"
        rel="noreferrer"
        className={`${PRIMARY_BUTTON} no-underline`}
      >
        {t("update.download")}
      </a>
      <button onClick={onRetry} className={SECONDARY_BUTTON}>
        {t("update.retry")}
      </button>
      <button
        onClick={onContinue}
        title={t("update.continueHint")}
        className={TEXT_BUTTON}
      >
        {t("update.continue")}
      </button>
      <button onClick={onDisconnect} className={TEXT_BUTTON}>
        {t("common.disconnect")}
      </button>
    </Screen>
  );
}
