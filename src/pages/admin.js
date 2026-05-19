import { setHeaderTitle } from "../shell.js"
import { apiBaseUrl } from "../lib/env.js"
import { el, icon } from "../ui/dom.js"
import { badge, button, card, input, toast } from "../ui/kit.js"

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function withTable(url, tableId) {
  if (!tableId) return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}table_id=${encodeURIComponent(tableId)}`
}

export async function renderAdmin(root) {
  setHeaderTitle("Admin")

  const base = apiBaseUrl()
  let busy = false
  let cooldownUntil = 0
  const COOLDOWN_MS = 1500
  let tableId = localStorage.getItem("cam_table_id") || ""

  const tableInput = input({
    label: "Mesa (table_id)",
    value: tableId,
    placeholder: "Ex.: 1",
  })
  tableInput.input.addEventListener("input", () => {
    tableId = tableInput.input.value.trim()
    localStorage.setItem("cam_table_id", tableId)
    refreshAll()
  })

  const infoPill = badge("Carregando…", "muted")

  const recordBtn = button("Gravar", { variant: "primary" })
  recordBtn.className =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[.99] bg-gradient-to-r from-neon-b/80 to-neon-g/70 text-ink-950 shadow-soft hover:brightness-110"
  recordBtn.prepend(icon("cue"))

  const statusText = el("div", { className: "mt-3 text-sm text-white/60" })

  const player = el("video", {
    className: "w-full rounded-2xl border border-white/10 bg-black/60",
    controls: "true",
    playsinline: "true",
  })

  const thumbs = el("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" })

  const left = card([
    el("div", { className: "p-5 sm:p-6" }, [
      el("div", { className: "flex flex-wrap items-center justify-between gap-3" }, [
        el("div", { className: "flex items-center gap-2" }, [
          badge("Ao vivo", "neon"),
          infoPill,
        ]),
        recordBtn,
      ]),
      el("div", { className: "mt-4" }, [tableInput.wrap]),
      el("div", { className: "mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30" }, [
        el("img", {
          className: "w-full aspect-video object-cover",
          src: `${base}/api/mjpeg`,
          alt: "preview ao vivo",
        }),
      ]),
      el("div", { className: "mt-4" }, [player]),
      statusText,
    ]),
  ])

  const right = card([
    el("div", { className: "p-5 sm:p-6" }, [
      el("div", { className: "flex items-center justify-between" }, [
        el("div", { className: "text-lg font-semibold" }, ["Últimos clipes"]),
        el(
          "button",
          {
            type: "button",
            className:
              "text-xs font-semibold text-white/70 hover:text-white/90",
            onclick: () => refreshClips(),
          },
          ["Atualizar"]
        ),
      ]),
      el("div", { className: "mt-4" }, [thumbs]),
    ]),
  ])

  root.appendChild(el("div", { className: "grid gap-4 lg:grid-cols-[1.25fr_.75fr]" }, [left, right]))

  function setBusy(v) {
    busy = v
    if (v) recordBtn.setAttribute("disabled", "true")
    else recordBtn.removeAttribute("disabled")
  }

  function setStatus(t, linkUrl = "", linkLabel = "") {
    statusText.innerHTML = ""
    statusText.appendChild(document.createTextNode(t))
    if (linkUrl && (linkUrl.startsWith("http://") || linkUrl.startsWith("https://"))) {
      statusText.appendChild(document.createTextNode(" "))
      statusText.appendChild(
        el(
          "a",
          {
            href: linkUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-neon-b hover:underline font-semibold",
          },
          [linkLabel || "Abrir"]
        )
      )
    }
  }

  async function refreshStatus() {
    const r = await fetch(`${base}/api/status`).then((x) => x.json())
    if (!r.ok) return
    const driveOn =
      typeof r.gdrive_ready === "boolean" ? r.gdrive_ready : r.gdrive_enabled
    const driveLabel = driveOn ? "Drive: ON" : "Drive: OFF"
    infoPill.textContent = `Mesa: ${tableId || r.table_id || "-"} • ${driveLabel} • FPS: ${r.fps} • ${r.size?.[0] || "-"}x${r.size?.[1] || "-"} • Pré ${r.pre}s + Pós ${r.post}s`
  }

  async function playClip(file) {
    player.src = withTable(`${base}/api/watch/${encodeURIComponent(file)}?t=${Date.now()}`, tableId)
    player.load()
    try {
      await player.play()
    } catch {}
  }

  function renderThumbs(clips) {
    thumbs.innerHTML = ""
    if (!clips?.length) {
      thumbs.appendChild(
        el("div", { className: "text-sm text-white/55" }, ["Nenhum clipe ainda."])
      )
      return
    }
    for (const c of clips) {
      const imgUrl = c.thumb
        ? withTable(`${base}/api/thumb/${encodeURIComponent(c.thumb)}?t=${Date.now()}`, tableId)
        : ""
      const item = card([
        el("div", { className: "p-4" }, [
          imgUrl
            ? el("img", {
                className:
                  "w-full rounded-2xl border border-white/10 bg-black/30 aspect-video object-cover",
                src: imgUrl,
                alt: c.file,
                loading: "lazy",
              })
            : el(
                "div",
                {
                  className:
                    "w-full rounded-2xl border border-white/10 bg-black/30 aspect-video flex items-center justify-center text-sm text-white/40",
                },
                ["Sem thumbnail"]
              ),
          el("div", { className: "mt-3 text-xs text-white/60 truncate" }, [
            c.file,
          ]),
          el("div", { className: "mt-3 flex gap-2" }, [
            button("Ver", { variant: "ghost", onClick: () => playClip(c.file) }),
            el(
              "a",
              {
                href: withTable(`${base}/api/download/${encodeURIComponent(c.file)}`, tableId),
                target: "_blank",
                rel: "noopener noreferrer",
                className:
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[.99] border border-white/10 bg-white/5 text-white/90 hover:bg-white/10",
              },
              [icon("download"), "Baixar"]
            ),
          ]),
        ]),
      ])
      thumbs.appendChild(item)
    }
  }

  async function refreshClips() {
    const r = await fetch(withTable(`${base}/api/clips`, tableId)).then((x) => x.json())
    if (r.ok) renderThumbs(r.clips)
  }

  async function startRecord(source) {
    if (busy) return
    if (Date.now() < cooldownUntil) return
    cooldownUntil = Date.now() + COOLDOWN_MS
    setBusy(true)
    setStatus(`Gravando... (${source})`)

    try {
      const resp = await fetch(withTable(`${base}/api/record`, tableId), { method: "POST" })
      const r = await resp.json()
      if (!r.ok) throw new Error(r.error || "Falha ao iniciar gravação")

      const jobId = r.job_id
      setStatus(`Processando... Job: ${jobId}`, `${base}/api/job/${jobId}`, "Detalhes")

      while (true) {
        await sleep(900)
        const j = await fetch(`${base}/api/job/${jobId}`).then((x) => x.json())
        if (!j.ok) throw new Error("Job não encontrado")
        if (j.status === "running") continue
        if (j.status === "error") throw new Error(j.error || "Erro no job")
        if (j.status === "done") {
          const driveUrl = j?.gdrive?.mp4?.view_url || ""
          if (driveUrl) setStatus("Clipe pronto! (Drive)", driveUrl, "Abrir no Drive")
          else setStatus("Clipe pronto! (local)", `${base}/api/job/${jobId}`, "Detalhes")
          if (j.file) await playClip(j.file)
          await refreshClips()
          break
        }
      }
    } catch (e) {
      toast(e?.message || "Falha ao gravar", "error")
      setStatus(`Erro: ${e?.message || "falha"}`)
    } finally {
      setBusy(false)
    }
  }

  recordBtn.addEventListener("click", () => startRecord("click"))
  const onKeyDown = (e) => {
    if (location.hash !== "#/admin") return
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault()
      startRecord("tecla")
    }
  }
  document.addEventListener("keydown", onKeyDown)

  async function refreshAll() {
    await refreshStatus()
    await refreshClips()
  }

  await refreshAll()
  const statusTimer = setInterval(() => refreshStatus(), 5000)
  const clipsTimer = setInterval(() => refreshClips(), 7000)

  return () => {
    clearInterval(statusTimer)
    clearInterval(clipsTimer)
    document.removeEventListener("keydown", onKeyDown)
  }
}
