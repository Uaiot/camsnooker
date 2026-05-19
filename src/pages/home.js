import { setHeaderTitle } from "../shell.js"
import { getSession } from "../state/auth.js"
import { listVenues } from "../data/db.js"
import { isSupabaseConfigured } from "../lib/supabase.js"
import { fmtVenueLocation } from "../lib/format.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

export async function renderHome(root) {
  setHeaderTitle("")

  let search

  const hero = el("div", { className: "mb-6" }, [
    el("div", { className: "grid gap-4 sm:grid-cols-[1.6fr_.8fr]" }, [
      card(
        [
          el("div", { className: "p-6 sm:p-8" }, [
            el("div", { className: "flex items-center justify-between gap-3" }, [
              el("div", { className: "flex items-center gap-2" }, [
                badge("Premium", "neon"),
              ]),
              el(
                "a",
                {
                  href: "#/admin",
                  className:
                    "inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition",
                },
                [icon("settings"), "Admin"]
              ),
            ]),
            el("div", { className: "mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900" }, [
              "Encontre seus clipes de jogo com mais clareza e velocidade",
            ]),
            el("div", { className: "mt-4 max-w-2xl text-sm leading-6 text-slate-600" }, [
              "Pesquise pelo bar, escolha a mesa e veja os vídeos do seu jogo com uma experiência leve e limpa.",
            ]),
            el("div", { className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" }, [
              button("Buscar local", {
                variant: "primary",
                onClick: () => search?.input?.focus(),
              }),
              el(
                "a",
                {
                  href: "#/venue",
                  className:
                    "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition",
                },
                [icon("map-pin"), "Ver locais"]
              ),
            ]),
          ]),
        ],
        "overflow-hidden border border-slate-200/80 bg-white"
      ),
    ]),
  ])
  root.appendChild(hero)

  search = input({
    label: "Buscar local/bar",
    placeholder: "Ex.: Bar do Eurípedes",
    autocomplete: "off",
  })
  search.wrap.className = "mb-4"
  root.appendChild(search.wrap)

  const list = el("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" })
  root.appendChild(list)

  const empty = el("div", { className: "text-sm text-slate-500" }, [
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
                "w-full text-left p-5 hover:bg-slate-50 transition rounded-2xl",
              type: "button",
              onclick: () => goToVenue(v.id),
            }, [
              el("div", { className: "flex items-start justify-between gap-3" }, [
                el("div", { className: "min-w-0" }, [
                  el("div", { className: "text-base font-semibold truncate text-slate-900" }, [
                    v.name || "Local",
                  ]),
                  locationText
                    ? el("div", { className: "mt-1 text-sm text-slate-600" }, [
                        locationText,
                      ])
                    : null,
                ]),
                el(
                  "div",
                  {
                    className:
                      "h-10 w-10 shrink-0 rounded-2xl border border-slate-200 bg-brand/10 shadow-soft flex items-center justify-center text-brand",
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

