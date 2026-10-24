import React from "react";
import { ArrowRight, CalendarCheck } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

/**
 * Card shown when the agent created a scheduled job. Opens the job's run
 * history in the AnythingLLM app.
 * @param {Object} props
 * @param {{jobId: number|string, jobName?: string, schedule?: string}} props.job
 * @param {{apiBase: string}} props.connection
 */
export default function ScheduledJob({ job, connection }) {
  const { t } = useTranslation();
  if (!job.jobId) return null;
  const appBase = connection.apiBase.replace(/\/api\/?$/, "");
  return (
    <a
      href={`${appBase}/settings/scheduled-jobs/${job.jobId}/runs`}
      target="_blank"
      rel="noreferrer"
      className="w-full flex items-center gap-x-3 bg-zinc-800 light:bg-slate-100 rounded-xl px-2 py-1.5 hover:bg-zinc-700 light:hover:bg-slate-200 transition-colors no-underline"
    >
      <div className="bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center shrink-0 h-[40px] w-[40px]">
        <CalendarCheck size={22} weight="bold" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 text-left">
        <p className="text-white light:text-slate-900 text-sm font-medium leading-snug break-words">
          {job.jobName || t("scheduledJob.fallbackName")}
        </p>
        <p className="text-zinc-400 light:text-slate-500 text-xs leading-snug break-words">
          {t("scheduledJob.created")}
          {job.schedule ? ` · ${job.schedule}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-x-1 pr-2 text-white light:text-slate-900 text-xs font-medium shrink-0">
        <span>{t("scheduledJob.view")}</span>
        <ArrowRight size={14} weight="bold" />
      </div>
    </a>
  );
}
