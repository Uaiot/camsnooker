import { setHeaderTitle } from "../shell.js"
import { getVenue, listTables, listVideos } from "../data/db.js"
import { fmtVenueLocation, fmtTime } from "../lib/format.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, toast } from "../ui/kit.js"

function todayStr() {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function parseIsoDate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

function toIsoDate(date) {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function formatDateDisplay(value) {
  if (!value) return ""
  const date = parseIsoDate(value)
  const day = String(date.getDate()).padStart(2, "0")
  const month = date.toLocaleString("pt-BR", { month: "short" })
  const year = date.getFullYear()
  return `${day} ${month.replace(".", "").toUpperCase()} ${year}`
}

function formatWeekday(value) {
  if (!value) return ""
  return parseIsoDate(value).toLocaleDateString("pt-BR", { weekday: "long" })
}

function createChoiceGroup(label) {
  const list = el("div", { className: "flex flex-wrap gap-2" })
  const wrap = el("div", { className: "block" }, [
    el("div", { className: "mb-2 text-xs font-medium text-slate-600" }, [label]),
    list,
  ])

  function render(options, value, onSelect) {
    list.innerHTML = ""
    for (const opt of options) {
      const active = opt.value === value
      const chip = el("button", {
        type: "button",
        className:
          "inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 " +
          (active
            ? "border-brand bg-brand text-white shadow-soft"
            : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand/30 hover:bg-brand/10 hover:text-brand"),
        onclick: () => onSelect(opt.value),
      }, [opt.label])
      list.appendChild(chip)
    }
  }

  return { wrap, render }
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
      card([el("div", { className: "p-5 sm:p-6 text-sm text-slate-600" }, ["Local não encontrado."])])
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
              el("div", { className: "text-2xl font-semibold tracking-tight truncate text-slate-950" }, [
                venue.name,
              ]),
              el("div", { className: "mt-1 text-sm text-slate-600" }, [
                fmtVenueLocation(venue),
              ]),
              el("div", { className: "mt-3 flex flex-wrap gap-2" }, [
                badge("Clipes", "neon"),
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
                  : el("div", { className: "text-xs text-slate-500 font-semibold" }, ["LOGO"]),
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
  let selectedTable = tableValue
  let selectedTime = ""

  const filtersCard = card([el("div", { className: "p-5 sm:p-6" })])
  const box = filtersCard.firstChild
  box.appendChild(el("div", { className: "text-lg font-semibold" }, ["Selecione o horário"]))
  box.appendChild(el("div", { className: "mt-2 text-sm text-slate-600" }, [
    "Escolha a data, a mesa e um horário disponível para listar os vídeos.",
  ]))

  const grid = el("div", { className: "mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]" })

  const weekdayDisplay = el("div", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand" }, [
    formatWeekday(dateValue),
  ])
  const dateTextDisplay = el("div", { className: "mt-1 text-[2rem] font-bold leading-none tracking-normal text-slate-950 sm:text-4xl" }, [
    formatDateDisplay(dateValue),
  ])
  const dragHint = el("div", { className: "mt-3 flex items-center gap-2 text-xs font-medium text-slate-500" }, [
    el("span", { className: "h-1.5 w-1.5 rounded-full bg-brand/70" }),
    "Arraste para os lados",
  ])

  const prevDateButton = el("button", {
    type: "button",
    className:
      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand shadow-sm transition hover:bg-brand/20 active:scale-95",
    onclick: () => changeDate(-1),
    title: "Dia anterior",
  }, [icon("chevron-left", "h-5 w-5")])

  const datePickerButton = el("button", {
    type: "button",
    className:
      "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:border-brand/25 hover:bg-brand hover:text-white active:scale-95",
    onclick: () => openDatePicker(),
    title: "Abrir calendario",
  }, [icon("calendar", "h-5 w-5")])

  const nextDateButton = el("button", {
    type: "button",
    className:
      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand shadow-sm transition hover:bg-brand/20 active:scale-95",
    onclick: () => changeDate(1),
    title: "Proximo dia",
  }, [icon("chevron-right", "h-5 w-5")])

  const dateValueDisplay = el("div", {
    role: "button",
    tabindex: "0",
    className:
      "group relative min-h-[138px] w-full touch-pan-y overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:cursor-grabbing",
    title: "Abrir calendario",
  }, [
    el("div", { className: "pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-brand" }),
    el("div", { className: "pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-brand/10" }),
    el("div", { className: "relative flex h-full flex-col justify-between" }, [
      el("div", {}, [weekdayDisplay, dateTextDisplay, dragHint]),
      el("div", { className: "mt-4 flex items-center justify-between" }, [
        el("div", { className: "flex items-center gap-2 text-xs font-semibold text-slate-400" }, [
          prevDateButton,
          el("span", {}, ["-1 dia"]),
        ]),
        datePickerButton,
        el("div", { className: "flex items-center gap-2 text-xs font-semibold text-slate-400" }, [
          el("span", {}, ["+1 dia"]),
          nextDateButton,
        ]),
      ]),
    ]),
  ])

  const dateInput = el("input", {
    type: "date",
    value: dateValue,
    className:
      "sr-only",
    "aria-label": "Data",
  })

  function updateDateDisplay(value) {
    weekdayDisplay.textContent = formatWeekday(value)
    dateTextDisplay.textContent = formatDateDisplay(value)
  }

  function changeDate(offset) {
    const current = parseIsoDate(dateInput.value)
    current.setDate(current.getDate() + offset)
    dateInput.value = toIsoDate(current)
    updateDateDisplay(dateInput.value)
    refreshAvailability()
  }

  function openDatePicker() {
    if (typeof dateInput.showPicker === "function") dateInput.showPicker()
    else dateInput.click()
  }

  const dateWrap = el("div", { className: "block" }, [
    el("div", { className: "mb-1 text-xs font-medium text-slate-600" }, ["Data"]),
    dateValueDisplay,
    dateInput,
  ])

  const tableOptions = tables.length
    ? tables.map((t) => ({ value: t.id, label: t.name || `Mesa ${t.table_code || ""}`.trim() }))
    : [{ value: "", label: "Selecione" }]
  const tableGroup = createChoiceGroup("Mesa")
  const timeGroup = createChoiceGroup("Horário")
  const controlsWrap = el("div", {
    className:
      "grid content-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4",
  }, [tableGroup.wrap, timeGroup.wrap])

  grid.appendChild(dateWrap)
  grid.appendChild(controlsWrap)
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

  function renderTableChoices() {
    tableGroup.render(tableOptions, selectedTable, (value) => {
      if (value === selectedTable) return
      selectedTable = value
      selectedTime = ""
      renderTableChoices()
      refreshAvailability()
    })
  }

  function renderTimeChoices(options = [{ value: "", label: "Todos" }]) {
    timeGroup.render(options, selectedTime, (value) => {
      selectedTime = value
      renderTimeChoices(options)
      updateCtaState()
    })
  }

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
    const table = selectedTable
    const time = selectedTime
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
    const table = selectedTable
    if (!date || !table) {
      countPill.textContent = "0 vídeos"
      renderTimeChoices([{ value: "", label: "Todos" }])
      updateCtaState()
      return
    }
    try {
      currentVideos = await listVideos({ venueId, tableId: table, date })
      countPill.textContent = `${currentVideos.length} vídeos`
      const opts = computeTimeOptions(currentVideos)
      if (!opts.some((opt) => opt.value === selectedTime)) selectedTime = ""
      renderTimeChoices(opts)
    } catch (e) {
      toast(`Erro ao carregar horários: ${e?.message || "falha"}`, "error")
      renderTimeChoices([{ value: "", label: "Todos" }])
      countPill.textContent = "0 vídeos"
      currentVideos = []
    } finally {
      updateCtaState()
    }
  }

  dateInput.addEventListener("change", () => {
    updateDateDisplay(dateInput.value)
    refreshAvailability()
  })

  let suppressDatePickerClick = false

  dateValueDisplay.addEventListener("click", (event) => {
    if (event.target.closest("button")) return
    if (suppressDatePickerClick) {
      suppressDatePickerClick = false
      return
    }
    openDatePicker()
  })

  let dragStartX = 0
  let dragDeltaX = 0
  let draggingDate = false

  dateValueDisplay.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return
    dragStartX = event.clientX
    dragDeltaX = 0
    draggingDate = true
    dateValueDisplay.setPointerCapture(event.pointerId)
  })

  dateValueDisplay.addEventListener("pointermove", (event) => {
    if (!draggingDate) return
    dragDeltaX = event.clientX - dragStartX
    const limited = Math.max(-44, Math.min(44, dragDeltaX * 0.45))
    dateValueDisplay.style.transform = `translateX(${limited}px)`
  })

  dateValueDisplay.addEventListener("pointerup", (event) => {
    if (!draggingDate) return
    draggingDate = false
    dateValueDisplay.releasePointerCapture(event.pointerId)
    dateValueDisplay.style.transform = ""
    if (Math.abs(dragDeltaX) < 56) return
    suppressDatePickerClick = true
    changeDate(dragDeltaX > 0 ? 1 : -1)
  })

  dateValueDisplay.addEventListener("pointercancel", () => {
    draggingDate = false
    dateValueDisplay.style.transform = ""
  })
  cta.addEventListener("click", () => updateCtaState())

  renderTableChoices()
  renderTimeChoices([{ value: "", label: "Carregando..." }])
  await refreshAvailability()
  updateCtaState()
}
