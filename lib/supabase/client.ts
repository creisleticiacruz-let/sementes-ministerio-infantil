import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

export function createClient(remember = true) {
  const env = getSupabaseEnv()
  if (!env) throw new Error('SUPABASE_ENV_MISSING')
  document.cookie = `sementes_remember=${remember ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
  return createBrowserClient(env.url, env.key, {
    isSingleton: false,
    cookieOptions: remember ? undefined : { maxAge: undefined },
  })
}
