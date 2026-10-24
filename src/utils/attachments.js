// Non-image files use this mime so the server parses them to text first.
const DOCUMENT_MIME = "application/anythingllm-document";
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
// Image types every vision provider accepts; other images are converted to PNG.
const MODEL_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];
// Converted images are scaled down to keep requests within provider limits.
const MAX_CONVERTED_IMAGE_SIDE = 2048;
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
 * @returns {Promise<Attachment>} rejects when an image cannot be decoded
 */
export async function fileToAttachment(file) {
  if (isImageFile(file) && !MODEL_IMAGE_TYPES.includes(file.type))
    file = await imageToPng(file);
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
 * Redraws an image the model cannot take, like SVG or AVIF, as a PNG.
 * @param {File} file
 * @returns {Promise<File>}
 */
async function imageToPng(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = image.naturalWidth || MAX_CONVERTED_IMAGE_SIDE;
    const height = image.naturalHeight || MAX_CONVERTED_IMAGE_SIDE;
    const scale = Math.min(
      1,
      MAX_CONVERTED_IMAGE_SIDE / Math.max(width, height)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    const name = `${file.name.replace(/\.[^.]+$/, "")}.png`;
    return new File([blob], name, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
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
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads an image from a page so it can be attached like a dropped file.
 * @param {string} url - http(s) or data URL of the image
 * @returns {Promise<File|null>} null when it cannot be loaded or is not an image
 */
export async function imageFileFromUrl(url) {
  const blob = await fetch(url, { credentials: "include" })
    .then((res) => (res.ok ? res.blob() : null))
    .catch(() => null);
  if (!blob || !isImageFile(blob)) return null;
  const extension = blob.type.split("/")[1].split("+")[0];
  const base = url.startsWith("data:")
    ? "image"
    : decodeURIComponent(new URL(url).pathname.split("/").pop() || "image");
  const name = base.includes(".") ? base : `${base}.${extension}`;
  return new File([blob], name, { type: blob.type });
}

/**
 * @param {{type?: string, mime?: string}} file
 * @returns {boolean}
 */
export function isImageFile(file) {
  return (file.type ?? file.mime ?? "").startsWith("image/");
}
