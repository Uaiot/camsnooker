import { setHeaderTitle } from "../shell.js"
import { getSession } from "../state/auth.js"
import { listVenues } from "../data/db.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

export async function renderHome(root) {
  setHeaderTitle("")

  const hero = el("div", { className: "mb-6" }, [
    el("div", { className: "grid gap-4 sm:grid-cols-[1.2fr_.8fr]" }, [
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "flex items-center justify-between gap-3" }, [
              el("div", { className: "flex items-center gap-2" }, [
                badge("Premium", "neon"),
                badge(isSupabaseConfigured() ? "Supabase: ON" : "Supabase: OFF"),
              ]),
              el(
                "a",
                {
                  href: "#/admin",
                  className:
                    "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition",
                },
                [icon("settings"), "Admin"]
              ),
            ]),
            el("div", { className: "mt-5 text-2xl font-semibold tracking-tight" }, [
              "Encontre seu local e assista seus clipes",
            ]),
            el("div", { className: "mt-2 text-sm text-white/55" }, [
              "Busque pelo bar, escolha a mesa e o horário. Player rápido e download em 1 toque.",
            ]),
          ]),
        ],
        ""
      ),
      card(
        [
          el("div", { className: "p-5 sm:p-6" }, [
            el("div", { className: "text-sm font-semibold text-white/80" }, [
              "Dica",
            ]),
            el("div", { className: "mt-2 text-sm text-white/55 leading-relaxed" }, [
              "O MVP está preparado para puxar venues/tables/videos do Supabase. Sem configurar, ele roda com dados de exemplo.",
            ]),
          ]),
        ],
        ""
      ),
    ]),
  ])
  root.appendChild(hero)

  const search = input({
    label: "Buscar local/bar",
    placeholder: "Ex.: Bar do Eurípedes",
    autocomplete: "off",
  })
  search.wrap.className = "mb-4"
  root.appendChild(search.wrap)

  const list = el("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" })
  root.appendChild(list)

  const empty = el("div", { className: "text-sm text-white/55" }, [
    "Nenhum local encontrado.",
  ])

  async function goToVenue(venueId) {
    const sess = await getSession()
    if (sess?.user) location.hash = `#/venue/${encodeURIComponent(venueId)}`
    else location.hash = `#/login?venue=${encodeURIComponent(venueId)}`
  }

  async function renderVenues(q) {
    list.innerHTML = ""
    try {
      const venues = await listVenues({ search: q })
      if (!venues.length) {
        list.appendChild(empty)
        return
      }
      for (const v of venues) {
        const locationText = fmtVenueLocation(v)
        const c = card(
          [
            el("button", {
              className:
                "w-full text-left p-5 hover:bg-white/5 transition rounded-2xl",
              type: "button",
              onclick: () => goToVenue(v.id),
            }, [
              el("div", { className: "flex items-start justify-between gap-3" }, [
                el("div", { className: "min-w-0" }, [
                  el("div", { className: "text-base font-semibold truncate" }, [
                    v.name || "Local",
                  ]),
                  locationText
                    ? el("div", { className: "mt-1 text-sm text-white/55" }, [
                        locationText,
                      ])
                    : null,
                ]),
                el(
                  "div",
                  {
                    className:
                      "h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-neon-b/20 to-neon-g/15 shadow-soft flex items-center justify-center text-white/80",
                  },
                  [icon("arrow")]
                ),
              ]),
            ]),
          ],
          ""
        )
        list.appendChild(c)
      }
    } catch (e) {
      toast(`Erro ao buscar locais: ${e?.message || "falha"}`, "error")
      list.appendChild(empty)
    }
  }

  search.input.addEventListener("input", () => renderVenues(search.input.value))

  await renderVenues("")
}

