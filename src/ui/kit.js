import { el } from "./dom.js"

export function sectionTitle(title, subtitle = "") {
  return el("div", { className: "mb-4" }, [
    el("div", { className: "text-xl font-semibold tracking-tight" }, [title]),
    subtitle
      ? el("div", { className: "mt-1 text-sm text-white/55" }, [subtitle])
      : null,
  ])
}

export function card(children = [], className = "") {
  return el(
    "div",
    {
      className:
        "rounded-2xl border border-white/10 bg-white/5 shadow-card backdrop-blur-sm " +
        className,
    },
    children
  )
}

export function badge(text, tone = "muted") {
  const toneClass =
    tone === "neon"
      ? "border-neon-b/30 bg-neon-b/10 text-neon-b"
      : "border-white/10 bg-white/5 text-white/70"
  return el(
    "span",
    {
      className:
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium " +
        toneClass,
    },
    [text]
  )
}

export function button(label, { variant = "primary", type = "button", onClick, disabled } = {}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
  const v =
    variant === "ghost"
      ? "border border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
      : variant === "danger"
      ? "bg-red-500/15 text-red-200 border border-red-500/25 hover:bg-red-500/20"
      : "bg-gradient-to-r from-neon-b/80 to-neon-g/70 text-ink-950 shadow-soft hover:brightness-110"

  const b = el(
    "button",
    { className: `${base} ${v}`, type, disabled: disabled ? "true" : null },
    [label]
  )
  if (onClick) b.addEventListener("click", onClick)
  return b
}

export function input({ label, type = "text", value = "", placeholder = "", name, autocomplete } = {}) {
  const wrap = el("label", { className: "block" })
  wrap.appendChild(
    el("div", { className: "mb-1 text-xs font-medium text-white/70" }, [label || ""])
  )
  const i = el("input", {
    className:
      "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-neon-b/40 focus:ring-2 focus:ring-neon-b/20",
    type,
    value,
    placeholder,
    name: name || "",
    autocomplete: autocomplete || "",
  })
  wrap.appendChild(i)
  return { wrap, input: i }
}

export function select({ label, options = [], value = "" } = {}) {
  const wrap = el("label", { className: "block" })
  wrap.appendChild(
    el("div", { className: "mb-1 text-xs font-medium text-white/70" }, [label || ""])
  )
  const s = el("select", {
    className:
      "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-neon-b/40 focus:ring-2 focus:ring-neon-b/20",
  })
  for (const opt of options) {
    s.appendChild(
      el("option", { value: opt.value, selected: opt.value === value ? "true" : null }, [
        opt.label,
      ])
    )
  }
  wrap.appendChild(s)
  return { wrap, select: s }
}

export function toast(text, tone = "info") {
  const root = document.getElementById("app")
  if (!root) return
  const cls =
    tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100"
      : "border-white/10 bg-white/5 text-white/90"
  const t = el(
    "div",
    {
      className:
        "fixed bottom-4 left-1/2 z-50 w-[min(520px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm shadow-card backdrop-blur " +
        cls,
    },
    [text]
  )
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2800)
}

