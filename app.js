let busy = false;                 // anti-duplo clique no front
let cooldownUntil = 0;            // anti-spam no front (tempo)
const COOLDOWN_MS = 1500;         // trava local após disparar
let tableId = "";

const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const infoEl = document.getElementById("info");
const player = document.getElementById("player");
const lastClipLabel = document.getElementById("lastClipLabel");
const thumbsRoot = document.getElementById("thumbs");

function nowMs() { return Date.now(); }

function setStatus(text, linkUrl = "", linkLabel = "") {
  statusEl.textContent = "";
  statusEl.appendChild(document.createTextNode(text));
  if (linkUrl && (linkUrl.startsWith("http://") || linkUrl.startsWith("https://"))) {
    statusEl.appendChild(document.createTextNode(" "));
    const a = document.createElement("a");
    a.href = linkUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = linkLabel || "Abrir";
    statusEl.appendChild(a);
  }
}

function withTable(url) {
  if (!tableId) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}table_id=${encodeURIComponent(tableId)}`;
}

function setBusy(v) {
  busy = v;
  btn.disabled = v;
}

async function refreshStatus() {
  const s = await fetch("/api/status").then(r => r.json());
  if (s.ok) {
    tableId = s.table_id || "";
    const driveOn = (typeof s.gdrive_ready === "boolean") ? s.gdrive_ready : s.gdrive_enabled;
    const driveLabel = driveOn ? "Drive: ON" : "Drive: OFF";
    infoEl.textContent = `Mesa: ${tableId || "-"} | ${driveLabel} | FPS: ${s.fps} | ${s.size[0]}x${s.size[1]} | Pré ${s.pre}s + Pós ${s.post}s`;
  }
}

function renderThumbs(clips) {
  thumbsRoot.innerHTML = "";
  for (const c of clips) {
    const div = document.createElement("div");
    div.className = "thumbcard";

    const img = document.createElement("img");
    img.className = "thumbimg";
    img.alt = c.file;
    img.src = c.thumb ? withTable(`/api/thumb/${c.thumb}?t=${Date.now()}`) : "";

    const meta = document.createElement("div");
    meta.className = "thumbmeta";

    const name = document.createElement("div");
    name.style.fontSize = "13px";
    name.style.color = "#aab4c3";
    name.textContent = c.file;

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const viewBtn = document.createElement("button");
    viewBtn.className = "smallbtn";
    viewBtn.textContent = "Ver";
    viewBtn.onclick = () => playClip(c.file);

    const dlBtn = document.createElement("button");
    dlBtn.className = "smallbtn";
    dlBtn.textContent = "Download";
    dlBtn.onclick = () => window.open(withTable(`/api/download/${c.file}`), "_blank");

    actions.appendChild(viewBtn);
    actions.appendChild(dlBtn);

    meta.appendChild(name);
    meta.appendChild(actions);

    div.appendChild(img);
    div.appendChild(meta);

    thumbsRoot.appendChild(div);
  }
}

async function refreshClips() {
  const r = await fetch(withTable("/api/clips")).then(r => r.json());
  if (r.ok) renderThumbs(r.clips);
}

async function playClip(file) {
  lastClipLabel.textContent = file;
  player.src = withTable(`/api/watch/${file}?t=${Date.now()}`);
  player.load();
  try { await player.play(); } catch (e) {}
}

async function startRecord(source = "ui") {
  // anti-spam no front
  if (busy) return;
  if (nowMs() < cooldownUntil) return;

  cooldownUntil = nowMs() + COOLDOWN_MS;
  setBusy(true);
  setStatus(`Gravando... (${source})`);

  const resp = await fetch(withTable("/api/record"), { method: "POST" });
  const r = await resp.json();

  if (!r.ok) {
    setStatus(`Erro: ${r.error || "falha"}`);
    setBusy(false);
    return;
  }

  const jobId = r.job_id;
  setStatus(`Gravando... (${source}) Job: ${jobId}`, `/api/job/${jobId}`, "Detalhes");

  while (true) {
    await new Promise(res => setTimeout(res, 900));
    const j = await fetch(`/api/job/${jobId}`).then(r => r.json());
    if (!j.ok) {
      setStatus("Erro: job não encontrado");
      break;
    }
    if (j.status === "running") {
      setStatus(`Processando... Job: ${jobId}`, `/api/job/${jobId}`, "Detalhes");
      continue;
    }
    if (j.status === "error") {
      setStatus(`Erro ao gravar: ${j.error}`, `/api/job/${jobId}`, "Detalhes");
      break;
    }
    if (j.status === "done") {
      const driveUrl = j?.gdrive?.mp4?.view_url || "";
      if (driveUrl) {
        setStatus("✅ Clipe pronto! (Drive)", driveUrl, "Abrir no Drive");
      } else {
        setStatus("✅ Clipe pronto! (local)", `/api/job/${jobId}`, "Detalhes");
      }
      if (j.file) await playClip(j.file);
      await refreshClips();
      break;
    }
  }

  setBusy(false);
}

btn.addEventListener("click", () => startRecord("click"));

// TECLA = BOTÃO FÍSICO
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    startRecord("tecla");
  }
});

refreshStatus();
refreshClips();
setInterval(refreshStatus, 5000);
setInterval(refreshClips, 7000);
