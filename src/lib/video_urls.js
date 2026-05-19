import { apiBaseUrl } from "./env.js"

function isHttpUrl(s) {
  return typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"))
}

function isBareFilename(s) {
  return typeof s === "string" && s.length > 0 && !s.includes("://") && !s.includes("/")
}

export function resolveThumbUrl(v) {
  const u = v?.thumbnail_url || ""
  if (isHttpUrl(u)) return u
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/thumb/${encodeURIComponent(u)}`
  const fallback = v?.video_url || ""
  if (isBareFilename(fallback)) return `${apiBaseUrl()}/api/thumb/${encodeURIComponent(fallback)}`
  return ""
}

export function resolveWatchUrl(v) {
  const u = v?.video_url || ""
  if (isHttpUrl(u)) return u
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/watch/${encodeURIComponent(u)}`
  return ""
}

export function resolveDownloadUrl(v) {
  const u = v?.video_url || ""
  if (isHttpUrl(u)) return u
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/download/${encodeURIComponent(u)}`
  return ""
}

