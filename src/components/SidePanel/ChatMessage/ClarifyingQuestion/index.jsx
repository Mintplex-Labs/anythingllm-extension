import React, { useState } from "react";
import BrowserExtension from "@/models/browserExtension";
import useTimeoutProgress from "@/hooks/useTimeoutProgress";
import TimeoutBar from "../TimeoutBar";
import Header from "./Header";
import InputForm from "./InputForm";
import ChoiceForm from "./ChoiceForm";
import Footer from "./Footer";
import SurveyBody from "./SurveyBody";
import { answerForDraft, emptyDraftFor } from "./utils";

/**
 * Walks the user through the questions an agent asked, one at a time, then
 * shows a read-only summary once submitted, skipped or timed out. The first
 * interaction tells the server to hold the request open so the user is not
 * racing the countdown.
 * @param {Object} props
 * @param {{requestId: string, questions: object[], allowSkip: boolean, timeoutMs: number|null}} props.request
 * @param {{apiBase: string, apiKey: string}} props.connection
 */
export default function ClarifyingQuestion({ request, connection }) {
  const { requestId, questions = [], allowSkip = true, timeoutMs } = request;
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [result, setResult] = useState(null);
  const [drafts, setDrafts] = useState(() => questions.map(emptyDraftFor));

  const responded = result !== null;
  const progressPercent = useTimeoutProgress(timeoutMs, {
    active: !responded && !engaged,
    onTimeout: () => setResult((prev) => prev ?? { timedOut: true }),
  });

  const total = questions.length;
  const isSingle = total === 1;
  const isLast = index === total - 1;
  const question = questions[index];
  const draft = drafts[index];
  const answeredCount = questions.filter(
    (q, i) => !answerForDraft(q, drafts[i]).skipped
  ).length;

  if (!total) return null;

  function updateDraft(patch) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  }

  function interact() {
    if (engaged || responded) return;
    setEngaged(true);
    BrowserExtension.agentReply(connection, requestId, { hold: true });
  }

  function send(payload) {
    if (responded) return;
    setResult(payload);
    BrowserExtension.agentReply(connection, requestId, payload);
  }

  function submitAll(pendingPatch = null) {
    const resolved = pendingPatch
      ? drafts.map((d, i) => (i === index ? { ...d, ...pendingPatch } : d))
      : drafts;
    send({
      skipped: false,
      answers: questions.map((q, i) => answerForDraft(q, resolved[i])),
    });
  }

  function advance(pendingPatch = null) {
    if (isLast) return submitAll(pendingPatch);
    setIndex(index + 1);
  }

  function skipThis() {
    updateDraft({ skipped: true });
    advance({ skipped: true });
  }

  return (
    <div
      className="relative border border-solid border-zinc-700 light:border-zinc-300 bg-transparent rounded-[20px] p-[18px] flex flex-col gap-[18px] overflow-hidden"
      onPointerEnter={interact}
      onPointerDownCapture={interact}
      onKeyDownCapture={interact}
    >
      {responded ? (
        <SurveyBody
          questions={questions}
          result={
            result.timedOut || result.skipped
              ? result
              : {
                  answers: questions.map((q, i) =>
                    answerForDraft(q, drafts[i])
                  ),
                }
          }
        />
      ) : (
        <>
          <Header
            question={question.question}
            index={index}
            total={total}
            isSingle={isSingle}
            onPrev={() => setIndex(Math.max(0, index - 1))}
            onNext={() => advance()}
            onClose={() => send({ skipped: true })}
            isFirst={index === 0}
            isLast={isLast}
          />
          <ActiveForm
            question={question}
            draft={draft}
            updateDraft={updateDraft}
            allowSkip={allowSkip}
            isSingle={isSingle}
            onAdvance={advance}
            onSubmitAll={submitAll}
            onSkip={skipThis}
          />
          <ActiveFooter
            question={question}
            draft={draft}
            isSingle={isSingle}
            isLast={isLast}
            allowSkip={allowSkip}
            answeredCount={answeredCount}
            total={total}
            onSkipThis={skipThis}
            onNext={() => advance()}
            onSubmitAll={() => submitAll()}
          />
          {!!timeoutMs && !engaged && <TimeoutBar percent={progressPercent} />}
        </>
      )}
    </div>
  );
}

function ActiveForm({
  question,
  draft,
  updateDraft,
  allowSkip,
  isSingle,
  onAdvance,
  onSubmitAll,
  onSkip,
}) {
  if (question.kind === "input")
    return (
      <InputForm
        question={question}
        draft={draft}
        onChange={(value) => updateDraft({ skipped: false, value })}
        onSubmit={isSingle ? () => onSubmitAll() : () => onAdvance()}
      />
    );
  if (question.kind === "choice")
    return (
      <ChoiceForm
        question={question}
        draft={draft}
        onChange={(patch) => updateDraft({ skipped: false, ...patch })}
        onAutoAdvance={
          question.multiSelect
            ? null
            : (patch) => onAdvance({ skipped: false, ...patch })
        }
        allowSkip={allowSkip}
        onSkip={onSkip}
      />
    );
  return null;
}

function ActiveFooter({ question, draft, allowSkip, ...footerProps }) {
  const isInput = question.kind === "input";
  const isChoice = question.kind === "choice";
  const show =
    isInput || (isChoice && (question.multiSelect || draft?.otherSelected));
  if (!show) return null;
  return <Footer allowSkip={allowSkip && isInput} {...footerProps} />;
}
