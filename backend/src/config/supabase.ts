import { createClient } from '@supabase/supabase-js'
import { env } from './environment'

// Cliente Admin (con service role key) - para operaciones del servidor
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Cliente público (con anon key) - para verificar tokens de usuarios
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
