import React from "react";
import { formatAnswerDisplay } from "../utils";

/**
 * Read-only render of a completed survey.
 * @param {Object} props
 * @param {object[]} props.questions
 * @param {{timedOut?: boolean, skipped?: boolean, answers?: {skipped: boolean, answer: any}[]}} props.result
 */
export default function SurveyBody({ questions = [], result = {} }) {
  if (result.timedOut)
    return <StatusMessage message="No response submitted in time." />;
  if (result.skipped)
    return <StatusMessage message="You let the agent decide." />;

  const answers = Array.isArray(result.answers) ? result.answers : [];
  const showNumbers = questions.length > 1;
  return (
    <div className="flex flex-col gap-y-1.5 text-xs text-white/70 light:text-slate-700">
      {questions.map((question, i) => (
        <div key={i} className="flex gap-2">
          {showNumbers && (
            <span className="text-white/50 light:text-slate-500 shrink-0">
              {i + 1}.
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white/60 light:text-slate-600">
              {question.question}
            </span>
            <span className="font-medium text-white light:text-slate-900 break-words">
              {formatAnswerDisplay(answers[i])}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusMessage({ message }) {
  return (
    <div className="text-xs text-white/60 light:text-slate-600">{message}</div>
  );
}
