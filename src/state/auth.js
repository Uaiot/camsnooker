import { supabase } from "../lib/supabase.js"

let sessionCache = null
let listeners = new Set()

export async function initAuth() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  sessionCache = data?.session || null
  supabase.auth.onAuthStateChange((_event, session) => {
    sessionCache = session || null
    for (const cb of listeners) cb(sessionCache)
  })
}

export function onAuthChange(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export async function getSession() {
  if (!supabase) return null
  if (sessionCache) return sessionCache
  const { data } = await supabase.auth.getSession()
  sessionCache = data?.session || null
  return sessionCache
}

export async function signInWithPassword(email, password) {
  if (!supabase) return { ok: false, error: "SUPABASE_NOT_CONFIGURED" }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { ok: false, error: error.message }
  sessionCache = data?.session || null
  return { ok: true, session: sessionCache }
}

export async function signUp(email, password, meta = {}) {
  if (!supabase) return { ok: false, error: "SUPABASE_NOT_CONFIGURED" }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  })
  if (error) return { ok: false, error: error.message }
  sessionCache = data?.session || null
  return { ok: true, data }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  sessionCache = null
}

