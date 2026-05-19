import { setHeaderTitle } from "../shell.js"
import { getVenue, listTables, listVideos } from "../data/db.js"
import { fmtIsoDate, fmtTime, fmtDurationSeconds } from "../lib/format.js"
import { resolveThumbUrl, resolveWatchUrl, resolveDownloadUrl } from "../lib/video_urls.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, toast } from "../ui/kit.js"

let modalRoot = null
let activeVideo = null

const BG_MUSIC_URL = "/assets/audio/trilha.mp3"
const BG_MUSIC_VOLUME = 0.22

let bgMusic = null
let musicEnabled = true

function getBgMusic() {
  if (!bgMusic) {
    bgMusic = new Audio(BG_MUSIC_URL)
    bgMusic.loop = true
    bgMusic.volume = BG_MUSIC_VOLUME
  }
  return bgMusic
}

function stopBgMusic(reset = true) {
  if (!bgMusic) return
  bgMusic.pause()
  if (reset) bgMusic.currentTime = 0
}

function startVideoWithMusic(video) {
  if (!video) return

  activeVideo = video

  try {
    const music = getBgMusic()
    musicEnabled = true
    music.currentTime = 0

    const videoPromise = video.play()
    const musicPromise = music.play()

    Promise.allSettled([videoPromise, musicPromise]).then((results) => {
      const musicResult = results[1]
      if (musicResult?.status === "rejected") {
        console.warn("O navegador bloqueou a trilha automática até o usuário interagir.", musicResult.reason)
      }
    })
  } catch (e) {
    console.warn("Não consegui iniciar vídeo/trilha automaticamente.", e)
  }
}

function attachBackgroundMusic(video) {
  if (!video) return

  video.addEventListener("play", async () => {
    if (!musicEnabled) return

    try {
      const music = getBgMusic()
      if (music.paused) music.currentTime = 0
      await music.play()
    } catch (e) {
      console.warn("Música bloqueada até interação do usuário.", e)
    }
  })

  video.addEventListener("pause", () => {
    stopBgMusic(false)
  })

  video.addEventListener("ended", () => {
    stopBgMusic(true)
  })
}

function closeModal() {
  stopBgMusic(true)

  if (activeVideo) {
    try {
      activeVideo.pause()
    } catch (e) {}
  }

  if (modalRoot) {
    modalRoot.remove()
    modalRoot = null
  }

  activeVideo = null
}

function renderModal(v) {
  const watchUrl = resolveWatchUrl(v)
  const downloadUrl = resolveDownloadUrl(v)
  const posterUrl = resolveThumbUrl(v)

  const overlay = el("div", {
    className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4",
    onclick: (e) => {
      if (e.target === overlay) closeModal()
    }
  })

  const modal = el("div", {
    className: "w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden"
  })

  const header = el("div", {
    className: "flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200"
  }, [
    el("div", { className: "min-w-0" }, [
      el("div", { className: "text-base font-semibold truncate text-slate-900" }, [
        v.title || `Vídeo • ${fmtTime(v.recorded_at) || ""}`.trim()
      ]),
      el("div", { className: "mt-1 flex flex-wrap gap-2" }, [
        fmtTime(v.recorded_at) ? badge(fmtTime(v.recorded_at), "neon") : null,
        v.duration ? badge(fmtDurationSeconds(v.duration), "muted") : null
      ])
    ]),
    el("button", {
      type: "button",
      className: "inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition",
      onclick: closeModal
    }, [icon("close", "h-5 w-5")])
  ])
  const videoEl = watchUrl
    ? el("video", {
        src: watchUrl,
        poster: posterUrl || null,
        className: "w-full aspect-video",
        controls: "true",
        playsinline: "true",
        preload: "auto"
      })
    : null

  const playerError = el("div", {
    className: "hidden w-full aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-300",
  }, [
    el("div", { className: "font-semibold text-white" }, ["Nao foi possivel tocar este video aqui."]),
    el("div", { className: "max-w-sm text-slate-400" }, [
      "Abra o arquivo em uma nova aba ou baixe o clipe para assistir.",
    ]),
    el("a", {
      href: downloadUrl || watchUrl || "#",
      target: "_blank",
      rel: "noopener noreferrer",
      className:
        "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100",
    }, [icon("download", "h-4 w-4"), "Abrir arquivo"]),
  ])

  if (videoEl) {
    activeVideo = videoEl
    attachBackgroundMusic(videoEl)
    videoEl.addEventListener("error", () => {
      videoEl.classList.add("hidden")
      playerError.classList.remove("hidden")
      playerError.classList.add("flex")
      stopBgMusic(true)
    })
  }

  const playerContainer = el("div", { className: "bg-slate-950" }, [
    videoEl ||
      el("div", { className: "w-full aspect-video flex items-center justify-center text-sm text-slate-400" }, [
        "Sem URL de vídeo configurada."
      ]),
    videoEl ? playerError : null,
  ])

  if (videoEl) {
    playerContainer.addEventListener("click", () => {
      if (videoEl.paused) startVideoWithMusic(videoEl)
    })
  }

  const footer = el("div", { className: "flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200" }, [
    el(
      "a",
      {
        href: downloadUrl || watchUrl || "#",
        target: "_blank",
        rel: "noopener noreferrer",
        className:
          "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
      },
      [icon("download", "h-4 w-4"), "Baixar"]
    )
  ])

  modal.appendChild(header)
  modal.appendChild(playerContainer)
  modal.appendChild(footer)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
  modalRoot = overlay

  if (videoEl) {
    startVideoWithMusic(videoEl)
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal()
  }, { once: true })
}

export async function renderVideos(root, query) {
  const venueId = query.get("venue") || ""
  const date = query.get("date") || ""
  const tableId = query.get("table") || ""
  const time = query.get("time") || ""

  const venue = await getVenue(venueId)
  if (!venue) {
    setHeaderTitle("Vídeos")
    root.appendChild(
      card([el("div", { className: "p-5 sm:p-6 text-sm text-white/60" }, ["Local não encontrado."])])
    )
    return
  }

  setHeaderTitle("Vídeos")

  const tables = await listTables(venueId)
  const tableName =
    tables.find((t) => t.id === tableId)?.name || (tableId ? "Mesa" : "Mesa")

  const top = card([
    el("div", { className: "p-5 sm:p-6" }, [
      el("div", { className: "flex flex-wrap items-end justify-between gap-3" }, [
        el("div", { className: "min-w-0" }, [
          el("div", { className: "text-xl font-semibold tracking-tight truncate text-slate-950" }, [venue.name]),
          el("div", { className: "mt-2 flex flex-wrap gap-2" }, [
            badge(date ? fmtIsoDate(`${date}T00:00:00`) : "Data", "muted"),
            badge(tableName, "muted"),
            time ? badge(time, "neon") : badge("Todos", "muted"),
          ]),
        ]),
        el("a", { href: `#/venue/${encodeURIComponent(venueId)}?date=${encodeURIComponent(date)}&table=${encodeURIComponent(tableId)}`, className: "inline-flex items-center gap-1.5 rounded-xl px-1 py-1 text-sm font-semibold text-brand transition hover:text-brand-600" }, [
          "Alterar filtros",
        ]),
      ]),
    ]),
  ])
  root.appendChild(top)

  const list = el("div", { className: "mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" })
  root.appendChild(list)

  let videos = []
  try {
    videos = await listVideos({ venueId, tableId, date })
  } catch (e) {
    toast(`Erro ao buscar vídeos: ${e?.message || "falha"}`, "error")
    videos = []
  }

  if (time) videos = videos.filter((v) => fmtTime(v.recorded_at) === time)

  if (!videos.length) {
    list.appendChild(
      card([
        el("div", { className: "p-5 sm:p-6" }, [
          el("div", { className: "text-sm text-white/60" }, [
            "Nenhum vídeo encontrado para esses filtros.",
          ]),
          el("div", { className: "mt-4" }, [
            button("Voltar", { variant: "ghost", onClick: () => history.back() }),
          ]),
        ]),
      ])
    )
    return
  }

  function renderVideoCard(v) {
    const thumb = resolveThumbUrl(v)
    const downloadUrl = resolveDownloadUrl(v)

    const cardEl = el("div", {
      className: "group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-ink-900 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
    })

    const thumbContainer = el("div", { className: "relative aspect-video overflow-hidden" }, [
      thumb
        ? el("img", {
            src: thumb,
            alt: v.title || "thumbnail",
            className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
            loading: "lazy"
          })
        : el(
            "div",
            {
              className: "w-full h-full flex items-center justify-center text-sm text-white/40 bg-black/30"
            },
            ["Sem thumbnail"]
          ),
      el("div", {
        className: "absolute inset-0 flex items-center justify-center bg-black/10 transition-all group-hover:bg-black/30"
      }, [
        el("div", {
          className: "opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
        }, [
          el("button", {
            type: "button",
            className: "flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-4 ring-white/25 transition-transform hover:scale-110",
            onclick: () => renderModal(v)
          }, [icon("play", "h-6 w-6")])
        ])
      ])
    ])

    const content = el("div", { className: "p-4 text-white" }, [
      el("div", { className: "truncate text-sm font-semibold text-white" }, [
        v.title || `Vídeo • ${fmtTime(v.recorded_at) || ""}`.trim()
      ]),
      el("div", { className: "mt-2 flex flex-wrap items-center justify-between gap-2" }, [
        el("div", { className: "flex flex-wrap gap-1.5" }, [
          fmtTime(v.recorded_at) ? badge(fmtTime(v.recorded_at), "neon") : null,
          v.duration ? badge(fmtDurationSeconds(v.duration), "muted") : null
        ]),
        el(
          "a",
          {
            href: downloadUrl || "#",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:border-brand/40 hover:bg-brand",
            title: "Baixar"
          },
          [icon("download", "h-4 w-4")]
        )
      ])
    ])

    cardEl.appendChild(thumbContainer)
    cardEl.appendChild(content)

    cardEl.addEventListener("click", (e) => {
      if (!e.target.closest("a") && !e.target.closest("button")) {
        renderModal(v)
      }
    })

    return cardEl
  }

  for (const v of videos) {
    list.appendChild(renderVideoCard(v))
  }
}

