import { createServerClient } from '@supabase/ssr'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from './env'

export async function createClient() {
  const env = getSupabaseEnv()
  if (!env) throw new Error('SUPABASE_ENV_MISSING')
  const store = await cookies()
  const session = store.get('sementes_remember')?.value === '0'
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => {
            const o = session ? { ...options, maxAge: undefined, expires: undefined } : options
            store.set(name, value, o)
          })
        } catch {
          // chamado de Server Component: o proxy já renova a sessão
        }
      },
    },
  })
}

/** Cliente com service role — só para ações de admin no servidor. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SERVICE_ROLE_MISSING')
  return createJsClient(url, key, { auth: { persistSession: false } })
}
