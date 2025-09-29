import { createClient } from '@supabase/supabase-js'

// Gunakan variabel dari .env.local
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
