/**
 * Human readable duration, same rules as the main app.
 * @param {number} duration - seconds
 * @returns {string}
 */
export function formatDuration(duration) {
  if (!(duration >= 0)) return "";
  if (duration < 1) return `${(duration * 1000).toFixed(0)}ms`;
  if (duration < 60) return `${duration.toFixed(1)}s`;
  if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
