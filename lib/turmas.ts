import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from './auth'

export type Turma = { id: string; name: string }

/** Turmas que o usuário pode gerenciar (admin: todas; demais: turmas com equipe de mesmo nome da qual participa). */
export async function manageableTurmas(supabase: SupabaseClient, profile: Profile): Promise<Turma[]> {
  const { data: turmas } = await supabase.from('turmas').select('id,name').eq('is_active', true).order('name')
  const all = (turmas ?? []) as Turma[]
  if (profile.role === 'admin') return all
  if (profile.role === 'responsavel') return []
  const { data: mem } = await supabase.from('team_members').select('teams(name)').eq('user_id', profile.id)
  const names = new Set((mem ?? []).map((m) => (m.teams as unknown as { name: string } | null)?.name))
  return all.filter((t) => names.has(t.name))
}

export async function allTurmas(supabase: SupabaseClient): Promise<Turma[]> {
  const { data } = await supabase.from('turmas').select('id,name').eq('is_active', true).order('name')
  return (data ?? []) as Turma[]
}
