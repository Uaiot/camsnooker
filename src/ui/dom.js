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
    play: ["<polygon points='5 3 19 12 5 21 5 3'/>"],
    download: ["<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>"],
    close: ["<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>"],
  }
  
  const paths = icons[name] || []
  svg.innerHTML = paths.join("")
  return svg
}

