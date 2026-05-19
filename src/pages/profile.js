import { setHeaderTitle } from "../shell.js"
import { getSession } from "../state/auth.js"
import { getProfileByUserId, upsertProfile } from "../data/db.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { el } from "../ui/dom.js"
import { badge, button, card, input, select, toast } from "../ui/kit.js"

export async function renderProfile(root) {
  setHeaderTitle("Perfil")

  const sess = await getSession()
  const user = sess?.user || null

  if (!user) {
    root.appendChild(
      card([
        el("div", { className: "p-5 sm:p-6" }, [
          el("div", { className: "text-sm text-white/60" }, [
            "Você precisa entrar para ver seu perfil.",
          ]),
          el("div", { className: "mt-4" }, [
            button("Ir para login", {
              variant: "primary",
              onClick: () => (location.hash = "#/login"),
            }),
          ]),
        ]),
      ])
    )
    return
  }

  let profile = null
  if (isSupabaseConfigured()) {
    try {
      profile = await getProfileByUserId(user.id)
    } catch (e) {
      toast(`Erro ao carregar perfil: ${e?.message || "falha"}`, "error")
    }
  }

  const top = card([
    el("div", { className: "p-5 sm:p-6" }, [
      el("div", { className: "flex flex-wrap items-center justify-between gap-3" }, [
        el("div", {}, [
          el("div", { className: "text-lg font-semibold" }, ["Seu perfil"]),
          el("div", { className: "mt-1 text-sm text-white/55" }, [
            user.email || "Conta",
          ]),
        ]),
        el("div", { className: "flex gap-2" }, [
          badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
        ]),
      ]),
    ]),
  ])
  root.appendChild(top)

  const formCard = card([el("div", { className: "p-5 sm:p-6" })])
  const box = formCard.firstChild

  const fullName = input({
    label: "Nome",
    value: profile?.full_name || user.user_metadata?.full_name || "",
  })
  const email = input({
    label: "E-mail",
    value: profile?.email || user.email || "",
    type: "email",
    autocomplete: "email",
  })
  const phone = input({
    label: "Telefone",
    value: profile?.phone || user.user_metadata?.phone || "",
    autocomplete: "tel",
  })
  const birth = input({
    label: "Data de nascimento",
    value: profile?.birth_date || "",
    type: "date",
  })
  const gender = select({
    label: "Gênero",
    value: profile?.gender || "",
    options: [
      { value: "", label: "Prefiro não informar" },
      { value: "male", label: "Masculino" },
      { value: "female", label: "Feminino" },
      { value: "other", label: "Outro" },
    ],
  })

  const grid = el("div", { className: "grid gap-3 sm:grid-cols-2" }, [
    fullName.wrap,
    email.wrap,
    phone.wrap,
    birth.wrap,
    gender.wrap,
  ])
  box.appendChild(grid)

  const save = button("Atualizar perfil", { variant: "primary" })
  save.addEventListener("click", async () => {
    if (!isSupabaseConfigured()) {
      toast("Configure SUPABASE_URL e SUPABASE_ANON_KEY para salvar o perfil.", "error")
      return
    }
    save.setAttribute("disabled", "true")
    try {
      await upsertProfile({
        user_id: user.id,
        full_name: fullName.input.value.trim(),
        email: email.input.value.trim(),
        phone: phone.input.value.trim(),
        birth_date: birth.input.value || null,
        gender: gender.select.value || null,
      })
      toast("Perfil atualizado.", "info")
    } catch (e) {
      toast(e?.message || "Falha ao atualizar", "error")
    } finally {
      save.removeAttribute("disabled")
    }
  })

  box.appendChild(el("div", { className: "mt-4" }, [save]))
  root.appendChild(formCard)
}

