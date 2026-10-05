import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'professor' | 'responsavel' | 'voluntario'
export type Profile = { id: string; name: string; email: string; role: Role }

export async function requireProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data } = await supabase.from('users').select('id,name,email,role').eq('id', user.id).maybeSingle()
  // Sem linha em public.users (migração 02 não rodou): cai para um perfil mínimo
  const profile: Profile = data ?? {
    id: user.id,
    name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Usuário',
    email: user.email ?? '',
    role: 'voluntario',
  }
  return { supabase, profile, missingProfile: !data }
}

export const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
export const today = () => new Date().toISOString().slice(0, 10)
