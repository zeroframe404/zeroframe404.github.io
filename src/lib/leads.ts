import type { LeadPayload } from '../types/lead'
import { getSupabaseClient } from './supabaseClient'

export async function insertLead(payload: LeadPayload) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error(
      'Faltan variables de entorno de Supabase. Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    )
  }

  const { error } = await supabase.from('leads').insert([
    {
      ...payload,
      created_at: new Date().toISOString()
    }
  ])

  if (error) {
    throw new Error(error.message)
  }
}
