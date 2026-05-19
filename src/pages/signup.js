import { setHeaderTitle } from "../shell.js"
import { getVenue, upsertProfile } from "../data/db.js"
import { signUp, getSession } from "../state/auth.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

export async function renderSignup(root, query) {
  setHeaderTitle("Cadastro")

  const venueId = query.get("venue") || ""
  const venue = venueId ? await getVenue(venueId) : null

  root.appendChild(
    el("div", { className: "grid gap-4 lg:grid-cols-[1.1fr_.9fr]" }, [
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "flex items-center gap-2" }, [
              badge("Criar conta", "neon"),
              badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
            ]),
            el("div", { className: "mt-4 text-2xl font-semibold" }, [
              "Conta CAM SNOOKER",
            ]),
            el("div", { className: "mt-2 text-sm text-white/55" }, [
              "Cadastro rápido para acessar os vídeos do local.",
            ]),
            venue
              ? el(
                  "div",
                  {
                    className:
                      "mt-5 rounded-2xl border border-white/10 bg-white/5 p-4",
                  },
                  [
                    el("div", { className: "text-sm font-semibold" }, [
                      venue.name,
                    ]),
                    el("div", { className: "mt-1 text-sm text-white/55" }, [
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
      placeholder: "(xx) xxxxx-xxxx",
    })
    const email = input({ label: "E-mail", type: "email", autocomplete: "email" })
    const password = input({
      label: "Senha",
      type: "password",
      autocomplete: "new-password",
    })
    const confirm = input({
      label: "Confirmar senha",
      type: "password",
      autocomplete: "new-password",
    })

    const submit = button("Criar conta", { variant: "primary" })
    const back = el(
      "a",
      { href: `#/login?venue=${encodeURIComponent(venueId)}`, className: "text-sm text-white/70 hover:text-white" },
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

