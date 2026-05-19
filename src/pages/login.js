import { setHeaderTitle } from "../shell.js"
import { getVenue } from "../data/db.js"
import { signInWithPassword } from "../state/auth.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

export async function renderLogin(root, query) {
  setHeaderTitle("Login")

  const venueId = query.get("venue") || ""
  const next = query.get("next") || ""
  const venue = venueId ? await getVenue(venueId) : null

  root.appendChild(
    el("div", { className: "grid gap-4 lg:grid-cols-[1.1fr_.9fr]" }, [
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "flex items-center gap-2" }, [
              badge("CAM SNOOKER", "neon"),
              badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
            ]),
            el("div", { className: "mt-4 text-2xl font-semibold" }, [
              "Bem-vindo de volta",
            ]),
            el("div", { className: "mt-2 text-sm text-white/55" }, [
              "Entre para ver seus vídeos por data, mesa e horário.",
            ]),
            venue
              ? el("div", { className: "mt-5 rounded-2xl border border-white/10 bg-white/5 p-4" }, [
                  el("div", { className: "text-sm font-semibold" }, [venue.name]),
                  el("div", { className: "mt-1 text-sm text-white/55" }, [
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
    const email = input({ label: "E-mail", type: "email", autocomplete: "email" })
    const password = input({
      label: "Senha",
      type: "password",
      autocomplete: "current-password",
    })

    const actions = el("div", { className: "grid gap-2" })
    const submit = button("Entrar", { variant: "primary" })
    const toSignup = el(
      "a",
      { href: `#/signup?venue=${encodeURIComponent(venueId)}`, className: "text-sm text-white/70 hover:text-white" },
      ["Criar conta"]
    )
    const forgot = el(
      "button",
      { type: "button", className: "text-left text-sm text-white/55 hover:text-white/75" },
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

