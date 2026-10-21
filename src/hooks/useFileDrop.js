import { useEffect, useRef, useState } from "react";

/**
 * Accepts files dropped anywhere on the page.
 * @param {(files: File[]) => void} onFiles
 * @returns {boolean} whether files are being dragged over the page
 */
export default function useFileDrop(onFiles) {
  const [dragging, setDragging] = useState(false);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;

  useEffect(() => {
    // dragenter/dragleave fire for every child element crossed, so count
    // them to know when the cursor has really left the page.
    let depth = 0;
    const hasFiles = (e) => e.dataTransfer?.types.includes("Files");
    const onDragEnter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const onDragOver = (e) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDragLeave = (e) => {
      if (!hasFiles(e)) return;
      depth -= 1;
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      onFilesRef.current([...e.dataTransfer.files]);
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  return dragging;
}
