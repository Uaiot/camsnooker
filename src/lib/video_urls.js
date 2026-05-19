import { apiBaseUrl } from "./env.js"

function isHttpUrl(s) {
  return typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"))
}

function isBareFilename(s) {
  return typeof s === "string" && s.length > 0 && !s.includes("://") && !s.includes("/")
}

function driveFileId(v) {
  return String(v?.drive_file_id || "").trim()
}

function driveDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
}

function drivePreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
}

function driveThumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`
}

export function resolveDrivePreviewUrl(v) {
  const fileId = driveFileId(v)
  return fileId ? drivePreviewUrl(fileId) : ""
}

export function resolveThumbUrl(v) {
  const u = v?.thumbnail_url || ""
  if (isHttpUrl(u)) return u
  const fileId = driveFileId(v)
  if (fileId) return driveThumbnailUrl(fileId)
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/thumb/${encodeURIComponent(u)}`
  const fallback = v?.video_url || ""
  if (isBareFilename(fallback)) return `${apiBaseUrl()}/api/thumb/${encodeURIComponent(fallback)}`
  return ""
}

export function resolveWatchUrl(v) {
  const u = v?.video_url || ""
  if (isHttpUrl(u)) return u
  const fileId = driveFileId(v)
  if (fileId) return driveDownloadUrl(fileId)
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/watch/${encodeURIComponent(u)}`
  return ""
}

export function resolveDownloadUrl(v) {
  const u = v?.video_url || ""
  if (isHttpUrl(u)) return u
  const fileId = driveFileId(v)
  if (fileId) return driveDownloadUrl(fileId)
  if (isBareFilename(u)) return `${apiBaseUrl()}/api/download/${encodeURIComponent(u)}`
  return ""
}
