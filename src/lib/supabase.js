import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../config.js"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}

