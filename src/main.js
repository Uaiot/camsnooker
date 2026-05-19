import { initAuth } from "./state/auth.js"
import { mountAppShell } from "./shell.js"
import { startRouter } from "./router.js"

window.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons()
  }
})

await initAuth()
mountAppShell()
startRouter()

if (window.lucide) {
  window.lucide.createIcons()
}

