/**
 * Empty draft state for a question. Shared by the form renderers and the card
 * so they agree on shape.
 * @param {{kind: "input"|"choice", multiSelect?: boolean}} question
 */
export function emptyDraftFor(question) {
  if (question?.kind === "choice") {
    return {
      skipped: false,
      selected: question.multiSelect ? [] : null,
      otherSelected: false,
      otherText: "",
    };
  }
  return { skipped: false, value: "" };
}

/**
 * Resolves a draft into the `{ skipped, answer }` payload sent to the agent.
 * Empty strings, missing selections and "Other" without text all count as skipped.
 * @param {object} question
 * @param {object} draft
 */
export function answerForDraft(question, draft) {
  if (!draft || draft.skipped) return { skipped: true, answer: null };

  if (question.kind === "input") {
    const trimmed = String(draft.value || "").trim();
    if (!trimmed) return { skipped: true, answer: null };
    return { skipped: false, answer: trimmed };
  }

  if (draft.otherSelected) {
    const trimmed = String(draft.otherText || "").trim();
    if (!trimmed) return { skipped: true, answer: null };
    if (question.multiSelect)
      return { skipped: false, answer: [...(draft.selected || []), trimmed] };
    return { skipped: false, answer: trimmed };
  }

  if (question.multiSelect) {
    const picks = draft.selected || [];
    if (picks.length === 0) return { skipped: true, answer: null };
    return { skipped: false, answer: picks };
  }

  if (!draft.selected) return { skipped: true, answer: null };
  return { skipped: false, answer: draft.selected };
}

/**
 * @param {{skipped: boolean, answer: any}|null} answer
 * @returns {string}
 */
export function formatAnswerDisplay(answer) {
  if (!answer || answer.skipped) return "[user skipped]";
  if (Array.isArray(answer.answer)) return answer.answer.join(", ");
  return String(answer.answer ?? "");
}
