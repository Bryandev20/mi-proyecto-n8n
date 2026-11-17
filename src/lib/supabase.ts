import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para autenticación de trabajadores OERAAE.
 * Lee las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('TU-PROYECTO') &&
    !supabaseAnonKey.includes('TU-SUPABASE')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
