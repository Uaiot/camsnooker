import { setHeaderTitle } from "../shell.js"
import { getVenue, upsertProfile } from "../data/db.js"
import { signUp, getSession } from "../state/auth.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

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

export async function renderSignup(root, query) {
  setHeaderTitle("Cadastro")

  const venueId = query.get("venue") || ""
  const venue = venueId ? await getVenue(venueId) : null

  root.appendChild(
    el("div", { className: "grid gap-4 lg:grid-cols-[1.05fr_.95fr]" }, [
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "flex items-center gap-2" }, [
              badge("Criar conta", "neon"),
              badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
            ]),
            el("div", { className: "mt-4 text-2xl font-semibold tracking-tight text-slate-950" }, [
              "Conta CAM SNOOKER",
            ]),
            el("div", { className: "mt-2 max-w-sm text-sm leading-6 text-slate-600" }, [
              "Cadastro rápido para acessar os vídeos do local.",
            ]),
            venue
              ? el(
                  "div",
                  {
                    className:
                      "mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4",
                  },
                  [
                    el("div", { className: "text-sm font-semibold text-slate-950" }, [
                      venue.name,
                    ]),
                    el("div", { className: "mt-1 text-sm text-slate-500" }, [
                      fmtVenueLocation(venue),
                    ]),
                  ]
                )
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
    const fullName = input({
      label: "Nome completo",
      autocomplete: "name",
      placeholder: "Seu nome",
    })
    const phone = input({
      label: "Telefone",
      autocomplete: "tel",
      inputmode: "numeric",
      maxlength: "15",
      placeholder: "(xx) xxxxx-xxxx",
    })
    phone.input.addEventListener("input", () => {
      phone.input.value = formatPhone(phone.input.value)
    })
    const email = input({ label: "E-mail", type: "email", autocomplete: "email", placeholder: "seu@email.com" })
    const password = passwordInput({
      label: "Senha",
      autocomplete: "new-password",
    })
    const confirm = passwordInput({
      label: "Confirmar senha",
      autocomplete: "new-password",
    })

    const submit = button("Criar conta", { variant: "primary" })
    const back = el(
      "a",
      { href: `#/login?venue=${encodeURIComponent(venueId)}`, className: "text-sm font-medium text-brand hover:text-brand-600" },
      ["Já tenho conta"]
    )

    submit.addEventListener("click", async () => {
      if (!isSupabaseConfigured()) {
        toast("Configure SUPABASE_URL e SUPABASE_ANON_KEY para habilitar cadastro.", "error")
        return
      }
      const e = email.input.value.trim()
      const p = password.input.value
      const c = confirm.input.value
      if (!fullName.input.value.trim() || !e || !p) {
        toast("Preencha nome, e-mail e senha.", "error")
        return
      }
      if (p.length < 6) {
        toast("A senha precisa ter pelo menos 6 caracteres.", "error")
        return
      }
      if (p !== c) {
        toast("As senhas não conferem.", "error")
        return
      }

      submit.setAttribute("disabled", "true")
      try {
        const r = await signUp(e, p, {
          full_name: fullName.input.value.trim(),
          phone: phone.input.value.trim(),
        })
        if (!r.ok) throw new Error(r.error || "Falha no cadastro")

        const sess = await getSession()
        if (sess?.user) {
          await upsertProfile({
            user_id: sess.user.id,
            full_name: fullName.input.value.trim(),
            email: e,
            phone: phone.input.value.trim(),
          })
        }

        toast("Conta criada com sucesso.", "info")
        if (venueId) location.hash = `#/venue/${encodeURIComponent(venueId)}`
        else location.hash = "#/"
      } catch (err) {
        toast(err?.message || "Falha no cadastro", "error")
      } finally {
        submit.removeAttribute("disabled")
      }
    })

    wrap.appendChild(fullName.wrap)
    wrap.appendChild(email.wrap)
    wrap.appendChild(phone.wrap)
    wrap.appendChild(password.wrap)
    wrap.appendChild(confirm.wrap)
    wrap.appendChild(el("div", { className: "grid gap-2" }, [submit, back]))
    return wrap
  }
}
