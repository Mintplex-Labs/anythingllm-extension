import semver from "semver";

// Oldest AnythingLLM release that has the side panel chat routes.
export const MIN_SERVER_VERSION = "1.19.0";

const DESKTOP_DOWNLOAD_URL = "https://anythingllm.com/download";
const DOCKER_IMAGES_URL =
  "https://docs.anythingllm.com/installation-docker/available-images";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

/**
 * Whether the connected AnythingLLM is too old to chat from the extension.
 * A missing version counts as outdated.
 * @param {string|null} version - appVersion reported by /utils/metrics
 * @returns {boolean}
 */
export function isServerOutdated(version) {
  return !semver.valid(version) || semver.lt(version, MIN_SERVER_VERSION);
}

/**
 * Where to send the user for a newer AnythingLLM. A local instance is the
 * desktop app; anything else is treated as a Docker deployment.
 * @param {string} apiBase
 * @returns {string}
 */
export function updateUrl(apiBase) {
  const { hostname } = new URL(apiBase);
  return LOCAL_HOSTS.includes(hostname)
    ? DESKTOP_DOWNLOAD_URL
    : DOCKER_IMAGES_URL;
}
