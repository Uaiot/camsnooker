import { renderHome } from "./pages/home.js"
import { renderLogin } from "./pages/login.js"
import { renderSignup } from "./pages/signup.js"
import { renderVenue } from "./pages/venue.js"
import { renderVideos } from "./pages/videos.js"
import { renderProfile } from "./pages/profile.js"
import { renderAdmin } from "./pages/admin.js"
import { setView } from "./shell.js"
import { getSession } from "./state/auth.js"

function parseUrl() {
  const hash = (location.hash || "#/").replace(/^#/, "")
  const [pathRaw, qsRaw] = hash.split("?")
  const path = pathRaw || "/"
  const query = new URLSearchParams(qsRaw || "")
  return { path, query }
}

function matchRoute(path) {
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return { name: "home", params: {} }
  if (parts[0] === "login") return { name: "login", params: {} }
  if (parts[0] === "signup") return { name: "signup", params: {} }
  if (parts[0] === "profile") return { name: "profile", params: {} }
  if (parts[0] === "admin") return { name: "admin", params: {} }
  if (parts[0] === "venue" && parts[1]) return { name: "venue", params: { id: parts[1] } }
  if (parts[0] === "videos") return { name: "videos", params: {} }
  return { name: "home", params: {} }
}

function requireAuth(routeName) {
  return ["venue", "videos", "profile"].includes(routeName)
}

let cleanup = null

async function render() {
  const { path, query } = parseUrl()
  const { name, params } = matchRoute(path)
  const sess = await getSession()
  if (requireAuth(name) && !sess?.user) {
    const venue = query.get("venue") || params.id || ""
    const next = encodeURIComponent(location.hash || "#/")
    location.hash = `#/login?venue=${encodeURIComponent(venue)}&next=${next}`
    return
  }

  if (typeof cleanup === "function") {
    try {
      cleanup()
    } catch {}
    cleanup = null
  }

  const root = document.createElement("div")
  root.className = "min-h-[calc(100vh-64px)]"

  let result
  if (name === "home") result = await renderHome(root, query)
  else if (name === "login") result = await renderLogin(root, query)
  else if (name === "signup") result = await renderSignup(root, query)
  else if (name === "venue") result = await renderVenue(root, query, { venueId: params.id })
  else if (name === "videos") result = await renderVideos(root, query)
  else if (name === "profile") result = await renderProfile(root, query)
  else if (name === "admin") result = await renderAdmin(root, query)
  else result = await renderHome(root, query)

  cleanup = typeof result === "function" ? result : null

  setView(root)
}

export function startRouter() {
  window.addEventListener("hashchange", () => render())
  render()
}
