import { setHeaderTitle } from "../shell.js"
import { getVenue } from "../data/db.js"
import { signInWithPassword } from "../state/auth.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

function passwordInput({ label, autocomplete } = {}) {
  const wrap = el("label", { className: "block" })
  wrap.appendChild(el("div", { className: "mb-1 text-xs font-medium text-slate-600" }, [label || "Senha"]))
  const field = el("div", { className: "relative" })
  const i = el("input", {
    className:
      "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15",
    type: "password",
    autocomplete: autocomplete || "",
  })
  const toggleIcon = icon("eye", "h-4 w-4")
  const toggle = el("button", {
    type: "button",
    className:
      "absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
    title: "Mostrar senha",
  }, [toggleIcon])
  toggle.addEventListener("click", () => {
    const showing = i.type === "text"
    i.type = showing ? "password" : "text"
    toggle.title = showing ? "Mostrar senha" : "Ocultar senha"
    toggleIcon.innerHTML = icon(showing ? "eye" : "eye-off", "h-4 w-4").innerHTML
  })
  field.appendChild(i)
  field.appendChild(toggle)
  wrap.appendChild(field)
  return { wrap, input: i }
}

export async function renderLogin(root, query) {
  setHeaderTitle("Login")

  const venueId = query.get("venue") || ""
  const next = query.get("next") || ""
  const venue = venueId ? await getVenue(venueId) : null

  root.appendChild(
    el("div", { className: "grid gap-4 lg:grid-cols-[1.05fr_.95fr]" }, [
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "flex items-center gap-2" }, [
              badge("CAM SNOOKER", "neon"),
              badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
            ]),
            el("div", { className: "mt-4 text-2xl font-semibold tracking-tight text-slate-950" }, [
              "Bem-vindo de volta",
            ]),
            el("div", { className: "mt-2 max-w-sm text-sm leading-6 text-slate-600" }, [
              "Entre para ver seus vídeos por data, mesa e horário.",
            ]),
            venue
              ? el("div", { className: "mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4" }, [
                  el("div", { className: "text-sm font-semibold text-slate-950" }, [venue.name]),
                  el("div", { className: "mt-1 text-sm text-slate-500" }, [
                    fmtVenueLocation(venue),
                  ]),
                ])
              : null,
          ]),
        ],
        ""
      ),
      card([el("div", { className: "p-5 sm:p-6" }, [await renderForm()])], ""),
    ])
  )

  async function renderForm() {
    const wrap = el("div", { className: "grid gap-4" })
    const email = input({ label: "E-mail", type: "email", autocomplete: "email", placeholder: "seu@email.com" })
    const password = passwordInput({
      label: "Senha",
      autocomplete: "current-password",
    })

    const actions = el("div", { className: "grid gap-2" })
    const submit = button("Entrar", { variant: "primary" })
    const toSignup = el(
      "a",
      { href: `#/signup?venue=${encodeURIComponent(venueId)}`, className: "text-sm font-medium text-brand hover:text-brand-600" },
      ["Criar conta"]
    )
    const forgot = el(
      "button",
      { type: "button", className: "text-left text-sm font-medium text-slate-500 hover:text-slate-800" },
      ["Esqueci minha senha"]
    )

    submit.addEventListener("click", async () => {
      if (!isSupabaseConfigured()) {
        toast("Configure SUPABASE_URL e SUPABASE_ANON_KEY para habilitar login.", "error")
        return
      }
      const e = email.input.value.trim()
      const p = password.input.value
      if (!e || !p) {
        toast("Preencha e-mail e senha.", "error")
        return
      }
      submit.setAttribute("disabled", "true")
      try {
        const r = await signInWithPassword(e, p)
        if (!r.ok) throw new Error(r.error || "Falha no login")
        if (next) location.hash = decodeURIComponent(next)
        else if (venueId) location.hash = `#/venue/${encodeURIComponent(venueId)}`
        else location.hash = "#/"
      } catch (err) {
        toast(err?.message || "Falha no login", "error")
      } finally {
        submit.removeAttribute("disabled")
      }
    })

    forgot.addEventListener("click", () => {
      toast("MVP: recuperação de senha será adicionada depois.", "info")
    })

    actions.appendChild(submit)
    actions.appendChild(el("div", { className: "flex items-center justify-between" }, [toSignup, forgot]))

    wrap.appendChild(email.wrap)
    wrap.appendChild(password.wrap)
    wrap.appendChild(actions)
    return wrap
  }
}
