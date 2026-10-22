// Non-image files use this mime so the server parses them to text first.
const DOCUMENT_MIME = "application/anythingllm-document";
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
// Everything the collector can turn into text.
const DOCUMENT_EXTENSIONS = [
  "txt",
  "md",
  "org",
  "adoc",
  "rst",
  "csv",
  "json",
  "html",
  "pdf",
  "docx",
  "pptx",
  "odt",
  "odp",
  "xlsx",
  "mbox",
  "epub",
  "mp3",
  "wav",
  "mp4",
  "mpeg",
  "mov",
  "ogg",
  "oga",
  "opus",
  "m4a",
  "webm",
];

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} name
 * @property {string} mime
 * @property {string} contentString - base64 data URI of the file
 */

/**
 * Reads a dropped, pasted or picked file into the attachment shape the chat endpoint accepts.
 * @param {File} file
 * @returns {Promise<Attachment>}
 */
export function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mime: isImageFile(file) ? file.type : DOCUMENT_MIME,
        contentString: reader.result,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Why a file cannot be attached, or null when it can.
 * @param {File} file
 * @returns {string|null}
 */
export function attachmentProblem(file) {
  if (file.size > MAX_ATTACHMENT_BYTES)
    return `${file.name} is larger than 25 MB.`;
  const extension = file.name.split(".").pop().toLowerCase();
  if (!isImageFile(file) && !DOCUMENT_EXTENSIONS.includes(extension))
    return `${file.name} is not a supported file type.`;
  return null;
}

/**
 * Opens an attachment in a new tab. Chrome refuses to open `data:` URLs
 * directly, so the content is handed over as a blob URL.
 * @param {Attachment} attachment
 */
export async function openAttachment(attachment) {
  const blob = await fetch(attachment.contentString).then((res) => res.blob());
  window.open(URL.createObjectURL(blob), "_blank");
}

/**
 * @param {{type?: string, mime?: string}} file
 * @returns {boolean}
 */
export function isImageFile(file) {
  return (file.type ?? file.mime ?? "").startsWith("image/");
}
