import { supabase, isSupabaseConfigured } from "../lib/supabase.js"
import { mockVenues, mockTables, mockVideos } from "./mock.js"

function normalizeText(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export async function listVenues({ search = "" } = {}) {
  if (!isSupabaseConfigured()) {
    const q = normalizeText(search)
    return mockVenues.filter((v) => normalizeText(v.name).includes(q))
  }

  const q = search?.trim()
  let query = supabase.from("venues").select("*").eq("active", true).order("name")
  const { data, error } = await query
  if (error) throw new Error(error.message)
  if (!q) return data || []
  const nq = normalizeText(q)
  return (data || []).filter((v) => normalizeText(v.name).includes(nq))
}

export async function getVenue(id) {
  if (!id) return null
  if (!isSupabaseConfigured()) return mockVenues.find((v) => v.id === id) || null
  const { data, error } = await supabase.from("venues").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

export async function listTables(venueId) {
  if (!venueId) return []
  if (!isSupabaseConfigured()) return mockTables.filter((t) => t.venue_id === venueId)
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("venue_id", venueId)
    .eq("active", true)
    .order("name")
  if (error) throw new Error(error.message)
  return data || []
}

export async function listVideos({ venueId, tableId, date } = {}) {
  if (!venueId) return []

  if (!isSupabaseConfigured()) {
    return mockVideos.filter((v) => {
      if (v.venue_id !== venueId) return false
      if (tableId && v.table_id !== tableId) return false
      if (date && String(v.recorded_at || "").slice(0, 10) !== date) return false
      return true
    })
  }

  let query = supabase.from("videos").select("*").eq("venue_id", venueId).order("recorded_at", { ascending: false })
  if (tableId) query = query.eq("table_id", tableId)
  if (date) {
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(`${date}T23:59:59.999`)
    query = query.gte("recorded_at", start.toISOString()).lte("recorded_at", end.toISOString())
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getProfileByUserId(userId) {
  if (!userId) return null
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

export async function upsertProfile(p) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED")
  const { data, error } = await supabase
    .from("profiles")
    .upsert(p, { onConflict: "user_id" })
    .select("*")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

