import React from "react";

/**
 * Countdown strip along the bottom edge of a card that waits on the user.
 * @param {Object} props
 * @param {number} props.percent - 100 (full) down to 0
 */
export default function TimeoutBar({ percent }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700 light:bg-slate-300">
      <div
        className="h-full bg-sky-500 light:bg-sky-600 transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
