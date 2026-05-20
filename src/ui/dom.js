export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null) continue
    if (k === "className") node.className = v
    else if (k === "html") node.innerHTML = v
    else if (k === "text") node.textContent = v
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else node.setAttribute(k, String(v))
  }
  for (const child of children || []) {
    if (child === undefined || child === null) continue
    if (typeof child === "string") node.appendChild(document.createTextNode(child))
    else node.appendChild(child)
  }
  return node
}

export function icon(name, sizeClass = "h-4 w-4") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("class", sizeClass)
  const size = sizeClass.includes("h-6") || sizeClass.includes("w-6")
    ? "24"
    : sizeClass.includes("h-5") || sizeClass.includes("w-5")
    ? "20"
    : "16"
  svg.setAttribute("width", size)
  svg.setAttribute("height", size)
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "2")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  
  const icons = {
    cue: ["<path d='M6 18c5-5 7-7 12-12'/><circle cx='17.5' cy='6.5' r='2.5'/>"],
    user: ["<path d='M20 21a8 8 0 0 0-16 0'/><circle cx='12' cy='8' r='4'/>"],
    settings: ["<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.82v.06a2 2 0 0 1-2 2.83 2 2 0 0 1-2.83-2l-.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0 1-1.82v-.06a2 2 0 0 1 2-2.83 2 2 0 0 1 2.83 2l.06.06a1.65 1.65 0 0 0 1.82.33z'/>"],
    arrow: ["<path d='M9 18l6-6-6-6'/>"],
    "chevron-left": ["<path d='m15 18-6-6 6-6'/>"],
    "chevron-right": ["<path d='m9 18 6-6-6-6'/>"],
    calendar: ["<path d='M8 2v4'/><path d='M16 2v4'/><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M3 10h18'/>"],
    eye: ["<path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'/><circle cx='12' cy='12' r='3'/>"],
    "eye-off": ["<path d='M9.88 9.88a3 3 0 1 0 4.24 4.24'/><path d='M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'/><path d='M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61'/><line x1='2' y1='2' x2='22' y2='22'/>"],
    play: ["<polygon points='5 3 19 12 5 21 5 3'/>"],
    download: ["<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>"],
    close: ["<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>"],
  }
  
  const paths = icons[name] || []
  svg.innerHTML = paths.join("")
  return svg
}
