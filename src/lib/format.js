export function fmtVenueLocation(v) {
  const city = v?.city || ""
  const state = v?.state || ""
  const parts = [city, state].filter(Boolean)
  return parts.join("/") || ""
}

export function fmtIsoDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = String(d.getFullYear())
  return `${dd}/${mm}/${yyyy}`
}

export function fmtTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export function fmtDurationSeconds(s) {
  const n = Number(s || 0)
  if (!Number.isFinite(n) || n <= 0) return ""
  if (n < 60) return `${Math.round(n)}s`
  const m = Math.floor(n / 60)
  const r = Math.round(n % 60)
  return `${m}m ${String(r).padStart(2, "0")}s`
}

