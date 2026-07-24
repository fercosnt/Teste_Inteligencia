import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para uso EXCLUSIVO no servidor.
//
// Usa a service role key, que ignora RLS. A tabela raven_resultados nega tudo
// por padrão (RLS ligado, sem policy pública), então esta é a única porta de
// entrada e saída dos dados. Nunca importe este módulo de um componente
// marcado com 'use client' — a chave vazaria para o bundle do navegador.

let client = null

export function getSupabaseAdmin() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return client
}
