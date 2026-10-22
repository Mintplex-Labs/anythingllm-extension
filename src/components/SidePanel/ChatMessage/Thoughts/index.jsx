import React, { useEffect, useState } from "react";
import { Brain } from "@phosphor-icons/react";
import AgentAnimation from "@/media/animations/agent-animation.webm";
import AgentStatic from "@/media/animations/agent-static.png";
import { renderMarkdown } from "@/utils/markdown";
import { formatDuration } from "@/utils/numbers";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "../ChainOfThought";

/**
 * One rolled-up activity chain for a reply: agent status updates and model
 * thoughts collapse into a single expandable block, like the main app.
 * @param {Object} props
 * @param {{type: "status"|"thought", content: string}[]} props.nodes - in arrival order
 * @param {boolean} props.streaming - the reply is still being produced
 */
export default function Thoughts({ nodes, streaming }) {
  const [expanded, setExpanded] = useState(false);
  const { arrivals, finalizedAt } = useActivityTimestamps(nodes, streaming);
  if (nodes.length === 0) return null;

  const lastNode = nodes[nodes.length - 1];
  const thinking = streaming && lastNode.type === "thought";
  const hasStatusNodes = nodes.some((node) => node.type === "status");
  const totalDuration =
    finalizedAt && arrivals[0] ? (finalizedAt - arrivals[0]) / 1000 : null;
  const headerLabel = thinking
    ? "Thinking..."
    : streaming
      ? cleanStatus(lastNode.content)
      : totalDuration
        ? `Thought for ${formatDuration(totalDuration)}`
        : "Thoughts";

  return (
    <ChainOfThought open={expanded} onOpenChange={setExpanded}>
      <ChainOfThoughtHeader
        icon={
          <ActivityIcon
            active={streaming}
            thinking={thinking || !hasStatusNodes}
            hasStatusNodes={hasStatusNodes}
          />
        }
        pending={streaming}
      >
        {headerLabel}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {nodes.map((node, index) => {
          const start = arrivals[index];
          const end = arrivals[index + 1] ?? finalizedAt;
          const seconds =
            start && end && end > start ? (end - start) / 1000 : null;
          return (
            <ChainOfThoughtStep
              key={index}
              icon={node.type === "thought" ? Brain : undefined}
              status={
                streaming && index === nodes.length - 1 ? "active" : "complete"
              }
              label={
                node.type === "thought" ? (
                  <div
                    className="break-words [&_p]:mb-1 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(node.content),
                    }}
                  />
                ) : (
                  cleanStatus(node.content)
                )
              }
              description={seconds ? formatDuration(seconds) : undefined}
            />
          );
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

function cleanStatus(content) {
  return content.replace(/^@agent:\s*/, "");
}

/**
 * Stamps each node when it first appears and the chain once it settles, so
 * steps can show how long they took. Nodes only ever append, so the index is
 * a stable key.
 * @param {object[]} nodes
 * @param {boolean} active
 * @returns {{arrivals: Object<number, number>, finalizedAt: number|null}}
 */
function useActivityTimestamps(nodes, active) {
  const [arrivals, setArrivals] = useState({});
  const [finalizedAt, setFinalizedAt] = useState(null);

  useEffect(() => {
    if (nodes.length === 0 || arrivals[nodes.length - 1] != null) return;
    setArrivals((prev) => {
      const next = { ...prev };
      for (let i = 0; i < nodes.length; i++)
        if (next[i] == null) next[i] = Date.now();
      return next;
    });
  }, [nodes.length, arrivals]);

  useEffect(() => {
    if (active) {
      if (finalizedAt !== null) setFinalizedAt(null);
      return;
    }
    if (nodes.length > 0 && finalizedAt === null) setFinalizedAt(Date.now());
  }, [active, nodes.length, finalizedAt]);

  return { arrivals, finalizedAt };
}

function ActivityIcon({ active, thinking, hasStatusNodes }) {
  if (active && thinking)
    return <Brain className="size-4 flex-shrink-0 mt-0.5" />;

  if (active)
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-4 h-4 flex-shrink-0 mt-0.5 scale-[165%] light:invert light:opacity-50"
        aria-label="Agent is thinking..."
      >
        <source src={AgentAnimation} type="video/webm" />
      </video>
    );

  if (hasStatusNodes)
    return (
      <img
        src={AgentStatic}
        alt="Agent complete"
        className="w-4 h-4 flex-shrink-0 mt-0.5 light:invert light:opacity-50"
      />
    );

  return <Brain className="size-4 flex-shrink-0 mt-0.5" />;
}
