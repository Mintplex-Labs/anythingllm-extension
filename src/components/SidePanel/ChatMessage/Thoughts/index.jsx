import React, { useEffect, useState } from "react";
import { Brain } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import AgentAnimation from "@/media/animations/agent-animation.webm";
import AgentStatic from "@/media/animations/agent-static.png";
import { renderThoughtMarkdown } from "@/utils/markdown";
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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { arrivals, finalizedAt } = useActivityTimestamps(nodes, streaming);
  if (nodes.length === 0) return null;

  const lastNode = nodes[nodes.length - 1];
  const thinking = streaming && lastNode.type === "thought";
  const hasStatusNodes = nodes.some((node) => node.type === "status");
  const totalDuration =
    finalizedAt && arrivals[0] ? (finalizedAt - arrivals[0]) / 1000 : null;
  const headerLabel = labelFor({
    thinking,
    streaming,
    lastNode,
    totalDuration,
    t,
  });

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
        trailing={
          streaming && arrivals[0] ? (
            <>
              · <ElapsedTime since={arrivals[0]} />
            </>
          ) : null
        }
      >
        {headerLabel}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {nodes.map((node, index) => {
          const isActiveStep = streaming && index === nodes.length - 1;
          const start = arrivals[index];
          const end = arrivals[index + 1] ?? finalizedAt;
          const seconds =
            start && end && end > start ? (end - start) / 1000 : null;
          return (
            <ChainOfThoughtStep
              key={index}
              icon={node.type === "thought" ? Brain : undefined}
              status={isActiveStep ? "active" : "complete"}
              label={
                node.type === "thought" ? (
                  <div
                    className="break-words [&_p]:mb-1 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: renderThoughtMarkdown(node.content),
                    }}
                  />
                ) : (
                  cleanStatus(node.content)
                )
              }
              description={
                isActiveStep && start ? (
                  <ElapsedTime since={start} />
                ) : seconds ? (
                  formatDuration(seconds)
                ) : undefined
              }
            />
          );
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

/**
 * Live count of how long the chain or a step has been running. Re-renders
 * each second and derives from Date.now() so a throttled panel catches up
 * instead of drifting.
 * @param {{since: number}} props - epoch ms the count starts from
 */
function ElapsedTime({ since }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return seconds < 60 ? `${seconds}s` : formatDuration(seconds);
}

function labelFor({ thinking, streaming, lastNode, totalDuration, t }) {
  if (thinking) return t("thoughts.thinking");
  if (streaming) return cleanStatus(lastNode.content);
  if (totalDuration)
    return t("thoughts.thoughtFor", {
      duration: formatDuration(totalDuration),
    });
  return t("thoughts.title");
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
  const { t } = useTranslation();
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
        aria-label={t("thoughts.agentThinking")}
      >
        <source src={AgentAnimation} type="video/webm" />
      </video>
    );

  if (hasStatusNodes)
    return (
      <img
        src={AgentStatic}
        alt={t("thoughts.agentComplete")}
        className="w-4 h-4 flex-shrink-0 mt-0.5 light:invert light:opacity-50"
      />
    );

  return <Brain className="size-4 flex-shrink-0 mt-0.5" />;
}
