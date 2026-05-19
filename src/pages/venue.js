import { setHeaderTitle } from "../shell.js"
import { getVenue, listTables, listVideos } from "../data/db.js"
import { fmtVenueLocation, fmtTime } from "../lib/format.js"
import { el } from "../ui/dom.js"
import { badge, button, card, select, toast } from "../ui/kit.js"

function todayStr() {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export async function renderVenue(root, query, params = {}) {
  const venueId =
    (params && params.venueId) ||
    (typeof query?.get === "function" ? query.get("venue") : "") ||
    ""

  const venue = await getVenue(venueId)
  if (!venue) {
    setHeaderTitle("Local")
    root.appendChild(
      card([el("div", { className: "p-5 sm:p-6 text-sm text-white/60" }, ["Local não encontrado."])])
    )
    return
  }

  setHeaderTitle(venue.name || "Local")

  const bannerStyle = venue.banner_url
    ? `background-image:url('${venue.banner_url}'); background-size:cover; background-position:center;`
    : "background: radial-gradient(900px 350px at 25% 0%, rgba(45,212,255,.18), transparent 60%), radial-gradient(900px 350px at 75% 0%, rgba(57,255,136,.12), transparent 60%), rgba(255,255,255,.04);"

  const header = el("div", { className: "mb-6" }, [
    el(
      "div",
      {
        className:
          "overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-card",
      },
      [
        el("div", {
          className: "h-40 sm:h-52",
          style: bannerStyle,
        }),
        el("div", { className: "p-5 sm:p-6" }, [
          el("div", { className: "flex items-start justify-between gap-3" }, [
            el("div", { className: "min-w-0" }, [
              el("div", { className: "text-2xl font-semibold tracking-tight truncate" }, [
                venue.name,
              ]),
              el("div", { className: "mt-1 text-sm text-white/55" }, [
                fmtVenueLocation(venue),
              ]),
              el("div", { className: "mt-3 flex flex-wrap gap-2" }, [
                badge("Clipes", "neon"),
                badge("Mobile-first"),
              ]),
            ]),
            el(
              "div",
              {
                className:
                  "h-14 w-14 rounded-3xl border border-white/10 bg-black/30 shadow-soft overflow-hidden flex items-center justify-center shrink-0",
              },
              [
                venue.logo_url
                  ? el("img", {
                      src: venue.logo_url,
                      alt: venue.name,
                      className: "h-full w-full object-cover",
                    })
                  : el("div", { className: "text-xs text-white/60 font-semibold" }, ["LOGO"]),
              ]
            ),
          ]),
        ]),
      ]
    ),
  ])
  root.appendChild(header)

  const tables = await listTables(venueId)
  const dateValue = (typeof query?.get === "function" && query.get("date")) || todayStr()
  const tableValue = (typeof query?.get === "function" && query.get("table")) || (tables[0]?.id || "")

  const filtersCard = card([el("div", { className: "p-5 sm:p-6" })])
  const box = filtersCard.firstChild
  box.appendChild(el("div", { className: "text-lg font-semibold" }, ["Selecione o horário"]))
  box.appendChild(el("div", { className: "mt-2 text-sm text-white/55" }, [
    "Escolha a data, a mesa e um horário disponível para listar os vídeos.",
  ]))

  const grid = el("div", { className: "mt-4 grid gap-3 sm:grid-cols-3" })

  const dateWrap = el("label", { className: "block" }, [
    el("div", { className: "mb-1 text-xs font-medium text-white/70" }, ["Data"]),
    el("input", {
      type: "date",
      value: dateValue,
      className:
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-neon-b/40 focus:ring-2 focus:ring-neon-b/20",
    }),
  ])
  const dateInput = dateWrap.querySelector("input")

  const tableSel = select({
    label: "Mesa",
    value: tableValue,
    options: [{ value: "", label: "Selecione" }].concat(
      tables.map((t) => ({ value: t.id, label: t.name || `Mesa ${t.table_code || ""}`.trim() }))
    ),
  })

  const timeSel = select({ label: "Horário", value: "", options: [{ value: "", label: "Carregando..." }] })
  grid.appendChild(dateWrap)
  grid.appendChild(tableSel.wrap)
  grid.appendChild(timeSel.wrap)
  box.appendChild(grid)

  const meta = el("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3" })
  const countPill = badge("0 vídeos", "muted")
  const cta = button("Ver vídeos", { variant: "primary" })
  cta.setAttribute("disabled", "true")

  meta.appendChild(countPill)
  meta.appendChild(cta)
  box.appendChild(meta)

  root.appendChild(filtersCard)

  let currentVideos = []

  function computeTimeOptions(videos) {
    const seen = new Map()
    for (const v of videos) {
      const t = fmtTime(v.recorded_at)
      if (!t) continue
      seen.set(t, true)
    }
    const times = Array.from(seen.keys()).sort()
    return [{ value: "", label: "Todos" }].concat(times.map((t) => ({ value: t, label: t })))
  }

  function updateCtaState() {
    const venue = venueId
    const date = dateInput.value
    const table = tableSel.select.value
    const time = timeSel.select.value
    if (!venue || !date || !table) {
      cta.setAttribute("disabled", "true")
      return
    }
    cta.removeAttribute("disabled")
    cta.onclick = () => {
      const qs = new URLSearchParams()
      qs.set("venue", venue)
      qs.set("date", date)
      qs.set("table", table)
      if (time) qs.set("time", time)
      location.hash = `#/videos?${qs.toString()}`
    }
  }

  async function refreshAvailability() {
    const date = dateInput.value
    const table = tableSel.select.value
    if (!date || !table) return
    try {
      currentVideos = await listVideos({ venueId, tableId: table, date })
      countPill.textContent = `${currentVideos.length} vídeos`
      const opts = computeTimeOptions(currentVideos)
      timeSel.select.innerHTML = ""
      for (const opt of opts) {
        timeSel.select.appendChild(
          el("option", { value: opt.value }, [opt.label])
        )
      }
    } catch (e) {
      toast(`Erro ao carregar horários: ${e?.message || "falha"}`, "error")
      timeSel.select.innerHTML = ""
      timeSel.select.appendChild(el("option", { value: "" }, ["Todos"]))
      countPill.textContent = "0 vídeos"
      currentVideos = []
    } finally {
      updateCtaState()
    }
  }

  dateInput.addEventListener("change", () => refreshAvailability())
  tableSel.select.addEventListener("change", () => refreshAvailability())
  timeSel.select.addEventListener("change", () => updateCtaState())
  cta.addEventListener("click", () => updateCtaState())

  await refreshAvailability()
  updateCtaState()
}

