'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const n = (f: FormData, k: string) => (s(f, k) === '' ? null : s(f, k))

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function updateProfile(f: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('users').update({ name: s(f, 'name') }).eq('id', user.id)
  const prefs = {
    user_id: user.id,
    app_notifications_enabled: f.get('app') === 'on',
    email_notifications_enabled: f.get('email') === 'on',
  }
  await supabase.from('user_notification_preferences').upsert(prefs, { onConflict: 'user_id' })
  revalidatePath('/configuracoes')
}

export async function markPresence(f: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const child_id = s(f, 'child_id')
  const date = s(f, 'date')
  const attitude = f.get('attitude') === 'on' ? 1 : 0
  const row = {
    child_id,
    date,
    is_present: f.get('present') === 'on',
    bible_star: f.get('bible') === 'on',
    verse_star: f.get('verse') === 'on',
    attitude_stars: attitude,
    recorded_by: user?.id ?? null,
  }
  // total_stars é calculado pelo trigger do banco
  const { data: existing } = await supabase.from('presence_records').select('id').eq('child_id', child_id).eq('date', date).maybeSingle()
  if (existing) await supabase.from('presence_records').update(row).eq('id', existing.id)
  else await supabase.from('presence_records').insert(row)
  revalidatePath('/criancas')
}

export async function addSong(f: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('songs').insert({ title: s(f, 'title'), artist: n(f, 'artist'), link: s(f, 'link'), tone: n(f, 'tone'), added_by: user?.id })
  revalidatePath('/playlist')
}

export async function setSongTone(f: FormData) {
  const supabase = await createClient()
  await supabase.from('songs').update({ tone: n(f, 'tone') }).eq('id', s(f, 'id'))
  revalidatePath('/playlist')
}

export async function addComment(f: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !s(f, 'comment')) return
  await supabase.from('activity_comments').insert({ activity_id: s(f, 'activity_id'), user_id: user.id, comment: s(f, 'comment') })
  revalidatePath('/atividades')
}

export async function markRead(f: FormData) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', s(f, 'id'))
  revalidatePath('/dashboard')
}

// ---------- Admin ----------
async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase.from('users').select('role').eq('id', user?.id ?? '').maybeSingle()
  if (data?.role !== 'admin') throw new Error('Apenas administradores.')
  return supabase
}

export async function inviteUser(f: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const email = s(f, 'email')
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: s(f, 'name') },
    redirectTo: `${site}/auth/callback?next=/redefinir-senha`,
  })
  if (error) throw new Error(error.message)
  const role = s(f, 'role') || 'voluntario'
  await admin.from('users').upsert({ id: data.user.id, name: s(f, 'name') || email.split('@')[0], email, role })
  revalidatePath('/admin')
}

export async function adminInsert(f: FormData) {
  const supabase = await assertAdmin()
  const table = s(f, 'table')
  const allowed: Record<string, string[]> = {
    children: ['name', 'birth_date', 'turma_id'],
    teams: ['name', 'description'],
    scales: ['date', 'team_id', 'description'],
    activities: ['turma_id', 'date', 'title', 'description', 'material_link', 'bible_verse'],
    rewards: ['name', 'description', 'points_required'],
    special_dates: ['date', 'title', 'description'],
  }
  const cols = allowed[table]
  if (!cols) throw new Error('Tabela inválida.')
  const row: Record<string, string | null> = {}
  cols.forEach((c) => (row[c] = n(f, c)))
  const { error } = await supabase.from(table).insert(row)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function setUserRole(f: FormData) {
  const supabase = await assertAdmin()
  await supabase.from('users').update({ role: s(f, 'role') }).eq('id', s(f, 'id'))
  revalidatePath('/admin')
}

export async function deleteChild(f: FormData) {
  const supabase = await assertAdmin()
  // presença, estrelas, resgates e vínculos com responsáveis são apagados em cascata pelo banco
  const { error } = await supabase.from('children').delete().eq('id', s(f, 'id'))
  if (error) throw new Error(error.message)
  revalidatePath('/criancas')
  revalidatePath('/aniversarios')
  revalidatePath('/espaco-responsaveis')
}
