import React, { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";

/**
 * Collapsible list of agent status lines and model reasoning for one reply.
 * @param {Object} props
 * @param {string[]} props.thoughts
 * @param {boolean} props.streaming - the reply is still being produced, so the latest thought is shown live
 */
export default function Thoughts({ thoughts, streaming }) {
  const [open, setOpen] = useState(false);
  if (thoughts.length === 0) return null;

  const latest = thoughts[thoughts.length - 1];
  return (
    <div className="flex flex-col gap-y-1.5 min-w-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="border-none bg-transparent flex items-center gap-x-1 w-fit max-w-full text-xs text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
      >
        <CaretRight
          size={12}
          weight="bold"
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className={`truncate ${streaming ? "animate-pulse" : ""}`}>
          {streaming
            ? cleanThought(latest)
            : `${thoughts.length} ${thoughts.length === 1 ? "step" : "steps"}`}
        </span>
      </button>
      {open && (
        <ol className="flex flex-col gap-y-1.5 ml-1.5 pl-3 border-l border-zinc-700 light:border-slate-300">
          {thoughts.map((thought, i) => (
            <li
              key={i}
              className="text-xs text-zinc-400 light:text-slate-500 whitespace-pre-wrap break-words"
            >
              {cleanThought(thought)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function cleanThought(thought) {
  return thought.replace(/^@agent:\s*/, "");
}
