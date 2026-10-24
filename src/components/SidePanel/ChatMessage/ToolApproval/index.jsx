import React, { useState } from "react";
import { CaretDown, Check, Hammer, X } from "@phosphor-icons/react";
import { Trans, useTranslation } from "react-i18next";
import BrowserExtension from "@/models/browserExtension";
import useTimeoutProgress from "@/hooks/useTimeoutProgress";
import TimeoutBar from "../TimeoutBar";

/**
 * Asks the user whether an agent may run a tool. The agent waits on the
 * server until this is answered or times out.
 * @param {Object} props
 * @param {{requestId: string, skillName: string, description: string|null, payload: object, timeoutMs: number}} props.approval
 * @param {{apiBase: string, apiKey: string}} props.connection
 */
export default function ToolApproval({ approval, connection }) {
  const { t } = useTranslation();
  const {
    requestId,
    skillName,
    payload = {},
    description,
    timeoutMs,
  } = approval;
  const [isExpanded, setIsExpanded] = useState(false);
  const [approved, setApproved] = useState(null);
  const [alwaysAllow, setAlwaysAllow] = useState(false);
  const hasPayload = !!payload && Object.keys(payload).length > 0;
  const responded = approved !== null;

  const progressPercent = useTimeoutProgress(timeoutMs, {
    active: !responded,
    intervalMs: 50,
    onTimeout: () => setApproved((prev) => prev ?? false),
  });

  function respond(isApproved) {
    if (responded) return;
    setApproved(isApproved);
    if (isApproved && alwaysAllow)
      BrowserExtension.whitelistSkill(connection, skillName);
    BrowserExtension.agentReply(connection, requestId, {
      approved: isApproved,
    });
  }

  return (
    <div className="relative bg-zinc-800 light:bg-slate-100 rounded-2xl p-4 pb-2 flex flex-col gap-y-1 overflow-hidden">
      <div className="flex w-full items-start justify-between gap-x-2 min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <Hammer size={16} className="shrink-0 mt-0.5" />
          <p className="text-white/80 light:text-slate-900 font-medium text-sm break-words">
            <Trans
              i18nKey="toolApproval.wantsToCall"
              values={{ skill: skillName }}
              components={{
                skill: (
                  <span className="font-semibold text-sky-400 light:text-sky-600" />
                ),
              }}
            />
          </p>
        </div>
        {hasPayload && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="border-none bg-transparent shrink-0 text-white light:text-slate-900"
            aria-label={
              isExpanded
                ? t("toolApproval.hideDetails")
                : t("toolApproval.showDetails")
            }
          >
            <CaretDown
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-y-1">
        {!!description && (
          <span className="text-white/60 light:text-slate-700 font-medium font-mono text-xs break-words">
            {description}
          </span>
        )}
        {hasPayload && isExpanded && (
          <div className="p-3 bg-zinc-900/50 light:bg-slate-200/50 rounded-lg overflow-x-auto">
            <pre className="text-xs text-zinc-300 light:text-slate-700 font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}
        <Decision
          approved={approved}
          skillName={skillName}
          alwaysAllow={alwaysAllow}
          setAlwaysAllow={setAlwaysAllow}
          onApprove={() => respond(true)}
          onReject={() => respond(false)}
        />
      </div>
      {!!timeoutMs && !responded && <TimeoutBar percent={progressPercent} />}
    </div>
  );
}

function Decision({
  approved,
  skillName,
  alwaysAllow,
  setAlwaysAllow,
  onApprove,
  onReject,
}) {
  const { t } = useTranslation();
  if (approved === false)
    return (
      <div className="flex items-center gap-1 text-sm font-medium text-red-400 light:text-red-500 pb-2">
        <X size={16} weight="bold" />
        <span>{t("toolApproval.rejected")}</span>
      </div>
    );
  if (approved === true)
    return (
      <div className="flex items-center gap-1 text-sm font-medium text-green-400 light:text-green-500 pb-2">
        <Check size={16} weight="bold" />
        <span>{t("toolApproval.approved")}</span>
      </div>
    );

  return (
    <div className="flex flex-col gap-2 mt-1 pb-2">
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="border-none transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm"
        >
          {t("common.approve")}
        </button>
        <button
          onClick={onReject}
          className="border-none bg-transparent text-white light:text-slate-900 text-sm font-medium w-[70px] h-9 rounded-lg hover:bg-white/5 light:hover:bg-slate-300"
        >
          {t("common.reject")}
        </button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-white/60 light:text-slate-600 text-xs hover:text-white/80 light:hover:text-slate-800 transition-colors">
        <input
          type="checkbox"
          checked={alwaysAllow}
          onChange={(e) => setAlwaysAllow(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-white/20 bg-transparent cursor-pointer"
        />
        <span>{t("toolApproval.alwaysAllow", { skill: skillName })}</span>
      </label>
    </div>
  );
}
