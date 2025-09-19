import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !/^https?:\/\//.test(url)) {
  throw new Error(`Invalid VITE_SUPABASE_URL: "${url}"`)
}
if (!anon) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anon)
