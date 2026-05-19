import { getSession, onAuthChange, signOut } from "./state/auth.js"
import { el, icon } from "./ui/dom.js"

let appRoot = null
let viewRoot = null
let headerTitleEl = null
let authButtonEl = null

function renderHeader() {
  const header = el("header", {
    className:
      "sticky top-0 z-30 border-b border-white/10 bg-ink-950/75 backdrop-blur",
  })

  const inner = el("div", {
    className:
      "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3",
  })

  const left = el("div", { className: "flex items-center gap-3 min-w-0" })
  const mark = el("a", { href: "#/", className: "flex items-center gap-2" }, [
    el(
      "img",
      {
        src: "/logos/logo_preta.png",
        alt: "CAM SNOOKER",
        className: "h-10 w-auto object-contain",
        loading: "lazy",
        onerror: "this.style.display='none'"
      }
    ),
    el("div", { className: "min-w-0 hidden sm:block" }, [
      el("div", { className: "text-sm font-semibold tracking-wide" }, [
        "CAM SNOOKER",
      ]),
      el(
        "div",
        { className: "text-xs text-white/55 truncate" },
        ["clipes premium do seu jogo"]
      ),
    ]),
  ])
  left.appendChild(mark)

  headerTitleEl = el("div", {
    className: "hidden sm:block text-sm text-white/70 truncate",
  })
  left.appendChild(headerTitleEl)

  const right = el("div", { className: "flex items-center gap-2" })

  authButtonEl = el(
    "button",
    {
      className:
        "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 active:scale-[.99] transition",
      type: "button",
    },
    ["Entrar"]
  )

  authButtonEl.addEventListener("click", async () => {
    const sess = await getSession()
    if (sess?.user) await signOut()
    else location.hash = "#/login"
  })

  const profileBtn = el(
    "a",
    {
      href: "#/profile",
      className:
        "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 active:scale-[.99] transition",
    },
    [icon("user"), el("span", { className: "hidden sm:inline" }, ["Perfil"])]
  )

  const adminBtn = el(
    "a",
    {
      href: "#/admin",
      className:
        "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 active:scale-[.99] transition",
      title: "Admin",
    },
    [icon("settings")]
  )

  right.appendChild(adminBtn)
  right.appendChild(profileBtn)
  right.appendChild(authButtonEl)

  inner.appendChild(left)
  inner.appendChild(right)
  header.appendChild(inner)
  return header
}

function renderFooter() {
  const footer = el("footer", {
    className:
      "mt-10 border-t border-white/10 bg-black/10 text-white/45 text-xs",
  })
  footer.appendChild(
    el(
      "div",
      { className: "mx-auto max-w-6xl px-4 py-8 flex justify-between gap-3" },
      [
        el("div", {}, ["CAM SNOOKER • MVP"]),
        el("div", { className: "text-right" }, [
          el("a", { href: "#/", className: "hover:text-white/70" }, ["Home"]),
        ]),
      ]
    )
  )
  return footer
}

function updateAuthUI(sess) {
  if (!authButtonEl) return
  if (sess?.user) authButtonEl.textContent = "Sair"
  else authButtonEl.textContent = "Entrar"
}

export function setHeaderTitle(title) {
  if (headerTitleEl) headerTitleEl.textContent = title || ""
}

export function mountAppShell() {
  appRoot = document.getElementById("app")
  appRoot.className = "min-h-screen"
  appRoot.innerHTML = ""

  const header = renderHeader()
  viewRoot = el("main", { className: "mx-auto max-w-6xl px-4 py-6" })
  const footer = renderFooter()

  appRoot.appendChild(header)
  appRoot.appendChild(viewRoot)
  appRoot.appendChild(footer)

  onAuthChange((sess) => updateAuthUI(sess))
  getSession().then((sess) => updateAuthUI(sess))
}

export function setView(node) {
  if (!viewRoot) return
  viewRoot.innerHTML = ""
  viewRoot.appendChild(node)
}

