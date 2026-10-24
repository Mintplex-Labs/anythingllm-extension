import React, { Fragment } from "react";
import useLocalSetting from "@/hooks/useLocalSetting";
import { formatDuration } from "@/utils/numbers";

export const SHOW_METRICS_KEY = "showChatMetrics";

/**
 * Model, speed and time for a reply. Shown on hover, or always once the user
 * clicks it, matching the main app.
 * @param {Object} props
 * @param {{duration?: number, outputTps?: number, model?: string, timestamp?: string}|null} props.metrics
 */
export default function Metrics({ metrics }) {
  const [alwaysShow, setAlwaysShow] = useLocalSetting(SHOW_METRICS_KEY, false);
  if (!metrics?.duration || !metrics?.outputTps) return null;

  return (
    <button
      onClick={() => setAlwaysShow(!alwaysShow)}
      title={
        alwaysShow
          ? "Click to only show metrics when hovering"
          : "Click to show metrics as soon as they are available"
      }
      className={`border-none bg-transparent p-0 min-w-0 text-left cursor-pointer text-[11px] text-zinc-400 light:text-slate-500 transition-opacity duration-300 ${alwaysShow ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
    >
      {metricsParts(metrics).map((part, i) => (
        <Fragment key={part}>
          {i > 0 && " · "}
          <span className="whitespace-nowrap">{part}</span>
        </Fragment>
      ))}
    </button>
  );
}

// Each part stays on one line so a narrow panel only wraps between parts.
function metricsParts(metrics) {
  return [
    metrics.model,
    `${formatDuration(metrics.duration)} (${formatTps(metrics.outputTps)} tok/s)`,
    formatTimestamp(metrics.timestamp),
  ].filter(Boolean);
}

function formatTps(outputTps) {
  return outputTps < 1000
    ? outputTps.toFixed(2)
    : Math.round(outputTps).toLocaleString("en-US");
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (!timestamp || isNaN(date)) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
