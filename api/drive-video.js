const { Readable } = require("node:stream")

function send(res, statusCode, message) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.end(message)
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type")
    res.end()
    return
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed")
    return
  }

  const id = String(req.query?.id || "").trim()
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    send(res, 400, "Invalid Google Drive file id")
    return
  }

  const upstreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`
  const headers = {}
  if (req.headers.range) headers.Range = req.headers.range

  let upstream
  try {
    upstream = await fetch(upstreamUrl, { headers, redirect: "follow" })
  } catch (e) {
    send(res, 502, "Could not fetch Google Drive file")
    return
  }

  if (!upstream.ok && upstream.status !== 206) {
    send(res, upstream.status || 502, "Google Drive did not return the video")
    return
  }

  const contentType = upstream.headers.get("content-type") || "video/mp4"
  if (contentType.includes("text/html")) {
    send(res, 502, "Google Drive returned an HTML page instead of the video")
    return
  }

  res.statusCode = upstream.status === 206 ? 206 : 200
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes")
  res.setHeader("Content-Type", contentType)

  const contentLength = upstream.headers.get("content-length")
  const contentRange = upstream.headers.get("content-range")
  if (contentLength) res.setHeader("Content-Length", contentLength)
  if (contentRange) res.setHeader("Content-Range", contentRange)
  if (req.query?.download) {
    res.setHeader("Content-Disposition", `attachment; filename="camsnooker-${id}.mp4"`)
  }

  if (req.method === "HEAD") {
    res.end()
    return
  }

  if (!upstream.body) {
    res.end()
    return
  }

  Readable.fromWeb(upstream.body).pipe(res)
}
