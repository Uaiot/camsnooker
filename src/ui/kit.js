import { el } from "./dom.js"

export function sectionTitle(title, subtitle = "") {
  return el("div", { className: "mb-4" }, [
    el("div", { className: "text-xl font-semibold tracking-tight text-slate-900" }, [title]),
    subtitle
      ? el("div", { className: "mt-1 text-sm text-slate-500" }, [subtitle])
      : null,
  ])
}

export function card(children = [], className = "") {
  return el(
    "div",
    {
      className:
        "rounded-2xl border border-slate-200/80 bg-white shadow-card " +
        className,
    },
    children
  )
}

export function badge(text, tone = "muted") {
  const toneClass =
    tone === "neon"
      ? "border-brand/30 bg-brand/10 text-brand"
      : "border-slate-200 bg-slate-100 text-slate-700"
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
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "danger"
      ? "bg-red-500/10 text-red-700 border border-red-200 hover:bg-red-500/15"
      : "bg-gradient-to-r from-brand to-brand-600 text-white shadow-soft hover:brightness-105"

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
    el("div", { className: "mb-1 text-xs font-medium text-slate-600" }, [label || ""])
  )
  const i = el("input", {
    className:
      "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15",
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
    el("div", { className: "mb-1 text-xs font-medium text-slate-600" }, [label || ""])
  )
  const s = el("select", {
    className:
      "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15",
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
      ? "border-red-500/25 bg-red-500/10 text-red-900"
      : "border-slate-200/70 bg-white text-slate-900"
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

