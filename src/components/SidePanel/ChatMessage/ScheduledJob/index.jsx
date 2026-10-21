import React from "react";
import { ArrowRight, CalendarCheck } from "@phosphor-icons/react";

/**
 * Card shown when the agent created a scheduled job. Opens the job's run
 * history in the AnythingLLM app.
 * @param {Object} props
 * @param {{jobId: number|string, jobName?: string, schedule?: string}} props.job
 * @param {{apiBase: string}} props.connection
 */
export default function ScheduledJob({ job, connection }) {
  const appBase = connection.apiBase.replace(/\/api\/?$/, "");
  return (
    <a
      href={`${appBase}/settings/scheduled-jobs/${job.jobId}/runs`}
      target="_blank"
      rel="noreferrer"
      className="w-full flex items-center justify-between gap-x-3 bg-zinc-800 light:bg-slate-100 light:border light:border-slate-200/50 rounded-xl px-2 py-1 hover:bg-zinc-700 light:hover:bg-slate-50 transition-colors no-underline"
    >
      <div className="flex items-center gap-x-3 min-w-0">
        <div className="bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center shrink-0 h-[48px] w-[48px]">
          <CalendarCheck size={24} weight="bold" />
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <p className="text-white light:text-slate-900 text-sm font-medium truncate leading-snug">
            {job.jobName || "Scheduled job"}
          </p>
          <p className="text-zinc-400 light:text-slate-500 text-xs leading-snug truncate">
            Scheduled job created{job.schedule ? ` · ${job.schedule}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-x-1 px-3 py-2 rounded-lg border border-zinc-600 light:border-slate-300 text-white light:text-slate-900 text-xs font-medium shrink-0">
        <span>View job</span>
        <ArrowRight size={14} weight="bold" />
      </div>
    </a>
  );
}
