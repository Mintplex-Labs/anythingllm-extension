import React, { useState } from "react";
import {
  Check,
  CircleNotch,
  Copy,
  Shuffle,
  XCircle,
} from "@phosphor-icons/react";
import { Trans, useTranslation } from "react-i18next";
import { isImageFile, openAttachment } from "@/utils/attachments";
import { renderMarkdown } from "@/utils/markdown";
import AttachmentCard from "../AttachmentCard";
import Thoughts from "./Thoughts";
import ToolApproval from "./ToolApproval";
import ClarifyingQuestion from "./ClarifyingQuestion";
import Chart from "./Chart";
import ScheduledJob from "./ScheduledJob";
import Sources from "./Sources";
import Outputs from "./Outputs";
import Metrics from "./Metrics";

const MARKDOWN_CLASSES =
  "text-sm leading-relaxed break-words text-white light:text-slate-900 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_a]:text-sky-400 light:[&_a]:text-sky-600 [&_a]:underline [&_pre]:bg-zinc-800 light:[&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_code]:font-mono [&_code]:text-xs";
// Reasoning models wrap their thinking in tags; an unclosed tag means it is still streaming.
const THINK_PATTERN = /<(think|thinking|thought)>([\s\S]*?)(?:<\/\1>|$)/g;

/**
 * @param {Object} props
 * @param {object} props.message
 * @param {{apiBase: string, apiKey: string}} props.connection
 */
export default function ChatMessage({ message, connection }) {
  const { t } = useTranslation();
  if (message.role === "user") return <UserMessage message={message} />;

  const { thoughts, text } = splitThinking(message.content);
  const activity = [
    ...message.thoughts.map((content) => ({ type: "status", content })),
    ...thoughts.map((content) => ({ type: "thought", content })),
  ];
  const hasOutput =
    !!text || message.outputs.length > 0 || message.charts.length > 0;

  return (
    <div className="group flex flex-col gap-y-3">
      {!!message.routedTo && <RouteNote routedTo={message.routedTo} />}
      <Thoughts nodes={activity} streaming={!message.done} />
      {message.approvals.map((approval) => (
        <ToolApproval
          key={approval.requestId}
          approval={approval}
          connection={connection}
        />
      ))}
      {message.questions.map((request) => (
        <ClarifyingQuestion
          key={request.requestId}
          request={request}
          connection={connection}
        />
      ))}
      {!hasOutput && !message.done && activity.length === 0 && (
        <p className="text-sm text-zinc-400 light:text-slate-500 animate-pulse">
          {t("chat.thinking")}
        </p>
      )}
      {!hasOutput && message.done && !message.error && (
        <p className="text-sm text-zinc-400 light:text-slate-500">
          {t("chat.noResponse")}
        </p>
      )}
      {message.charts.map((chart, i) => (
        <Chart key={i} chart={chart} />
      ))}
      {!!text && (
        <div
          className={MARKDOWN_CLASSES}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
      )}
      {message.imagePending && <ImagePending aborted={message.done} />}
      <Outputs outputs={message.outputs} connection={connection} />
      {message.jobs.map((job) => (
        <ScheduledJob key={job.jobId} job={job} connection={connection} />
      ))}
      {message.done && (
        <ReplyFooter
          text={text}
          sources={message.sources}
          metrics={message.metrics}
        />
      )}
      {!!message.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 light:text-red-600 p-2.5 rounded-lg text-sm">
          {message.error}
        </div>
      )}
    </div>
  );
}

/**
 * Pulls thinking blocks out of a reply so they show as thoughts, not prose.
 * @param {string} content
 * @returns {{thoughts: string[], text: string}}
 */
function splitThinking(content) {
  const thoughts = [];
  const text = content
    .replace(THINK_PATTERN, (_match, _tag, thought) => {
      if (thought.trim()) thoughts.push(thought.trim());
      return "";
    })
    .trim();
  return { thoughts, text };
}

function UserMessage({ message }) {
  const images = message.attachments.filter(isImageFile);
  const files = message.attachments.filter((a) => !isImageFile(a));
  return (
    <div className="flex flex-col items-end gap-y-1">
      {images.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2 max-w-[85%]">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => openAttachment(image)}
              title={image.name}
              className="border-none p-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={image.contentString}
                alt={image.name}
                className="w-[120px] h-[120px] object-cover rounded-lg"
              />
            </button>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2 max-w-[85%]">
          {files.map((file) => (
            <AttachmentCard
              key={file.id}
              attachment={file}
              background="bg-zinc-800 light:bg-slate-100"
            />
          ))}
        </div>
      )}
      <div className="bg-zinc-800 light:bg-slate-100 rounded-[20px] rounded-br-none px-4 py-3 text-sm whitespace-pre-wrap break-words max-w-[85%]">
        {message.content}
      </div>
    </div>
  );
}

function RouteNote({ routedTo }) {
  return (
    <div className="w-fit max-w-full rounded-[20px] border border-zinc-700 light:border-slate-300 px-4 py-2 flex items-center gap-2">
      <Shuffle
        size={16}
        className="shrink-0 text-zinc-400 light:text-slate-600"
      />
      <span className="text-sm text-zinc-400 light:text-slate-600 break-words min-w-0">
        <Trans
          i18nKey={routedTo.ruleTitle ? "chat.routedToByRule" : "chat.routedTo"}
          values={{ model: routedTo.model, rule: routedTo.ruleTitle }}
          components={{
            model: <span className="text-zinc-50 light:text-slate-950" />,
          }}
        />
      </span>
    </div>
  );
}

/**
 * Placeholder while an image is being generated. Once the reply ends without
 * an image the spinner is swapped for a static notice.
 */
function ImagePending({ aborted }) {
  const { t } = useTranslation();
  if (aborted)
    return (
      <ImagePendingFrame background="bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-900 light:from-slate-200 light:via-slate-300 light:to-slate-100">
        <XCircle
          size={32}
          weight="bold"
          className="text-white/60 light:text-slate-500"
        />
        <p className="text-white/70 light:text-slate-600 text-sm font-medium">
          {t("chat.imageAborted")}
        </p>
      </ImagePendingFrame>
    );

  return (
    <ImagePendingFrame background="bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-900 light:from-slate-200 light:via-slate-300 light:to-slate-100 blur-2xl animate-pulse">
      <CircleNotch
        size={32}
        weight="bold"
        className="animate-spin text-white light:text-slate-700"
      />
      <p className="text-white light:text-slate-800 text-sm font-semibold">
        {t("chat.imageGenerating")}
      </p>
    </ImagePendingFrame>
  );
}

function ImagePendingFrame({ background, children }) {
  return (
    <div className="w-full max-w-[280px]">
      <div className="relative rounded-xl overflow-hidden aspect-square">
        <div className={`absolute inset-0 ${background}`} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 text-center px-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ReplyFooter({ text, sources, metrics }) {
  if (!text && sources.length === 0) return null;
  if (sources.length === 0)
    return (
      <div className="flex items-center gap-x-1">
        <Metrics metrics={metrics} />
        <CopyButton text={text} />
      </div>
    );

  return (
    <div className="flex flex-col gap-y-1">
      <div className="flex items-center gap-x-0.5">
        <Sources sources={sources} />
        {!!text && <CopyButton text={text} />}
      </div>
      <Metrics metrics={metrics} />
    </div>
  );
}

function CopyButton({ text }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      title={t("common.copy")}
      aria-label={t("common.copy")}
      className="border-none bg-transparent flex items-center justify-center shrink-0 w-6 h-6 rounded-md text-zinc-500 light:text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
