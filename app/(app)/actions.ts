'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { back } from '@/lib/flash'

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const n = (f: FormData, k: string) => (s(f, k) === '' ? null : s(f, k))

async function me() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  return { supabase, user }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ---------- Perfil / preferências ----------
export async function updateProfile(f: FormData) {
  const { supabase, user } = await me()
  const upd: Record<string, string | null> = { name: s(f, 'name') }
  if (f.get('avatar_url') !== null && s(f, 'avatar_url')) upd.avatar_url = s(f, 'avatar_url')
  const { error } = await supabase.from('users').update(upd).eq('id', user.id)
  if (error) back('/configuracoes', 'erro', error.message)
  const on = (k: string) => f.get(k) === 'on'
  const prefs: Record<string, boolean | string> = {
    user_id: user.id,
    app_notifications_enabled: on('app'),
    email_notifications_enabled: on('email'),
  }
  if (f.get('guardian') === '1') prefs.saturday_reminder_enabled = on('saturday')
  else { prefs.monday_reminder_enabled = on('monday'); prefs.friday_reminder_enabled = on('friday') }
  await supabase.from('user_notification_preferences').upsert(prefs, { onConflict: 'user_id' })
  revalidatePath('/', 'layout')
  back('/configuracoes', 'ok', 'Configurações salvas.')
}

// ---------- Chamada e estrelas ----------
type Row = { child_id: string; present: boolean; bible: number; verse: number; attitude: number }
export async function saveClass(date: string, rows: Row[]): Promise<{ ok: boolean; msg: string }> {
  const { supabase, user } = await me()
  if (!rows.length) return { ok: false, msg: 'Nenhuma criança para salvar.' }
  const payload = rows.map((r) => ({
    child_id: r.child_id,
    date,
    is_present: r.present,
    bible_stars: Math.max(0, Math.min(20, r.bible | 0)),
    verse_stars: Math.max(0, Math.min(20, r.verse | 0)),
    attitude_stars: Math.max(0, Math.min(50, r.attitude | 0)),
    recorded_by: user.id,
  }))
  const { error } = await supabase.from('presence_records').upsert(payload, { onConflict: 'child_id,date' })
  if (error) return { ok: false, msg: /row-level security/i.test(error.message) ? 'Você não tem permissão nesta turma.' : error.message }
  revalidatePath('/criancas'); revalidatePath('/criancas/ranking'); revalidatePath('/espaco-responsaveis')
  return { ok: true, msg: 'Aula salva com sucesso!' }
}

export async function deleteChild(f: FormData) {
  const { supabase } = await me()
  const { error } = await supabase.from('children').delete().eq('id', s(f, 'id'))
  if (error) back('/criancas', 'erro', error.message)
  revalidatePath('/', 'layout')
  back('/criancas', 'ok', 'Criança excluída com todas as ligações.')
}

// ---------- Playlist ----------
export async function saveSong(f: FormData) {
  const { supabase, user } = await me()
  const row = { title: s(f, 'title'), artist: n(f, 'artist'), link: s(f, 'link'), tone: n(f, 'tone'), notes: n(f, 'notes') }
  const id = s(f, 'id')
  const { error } = id ? await supabase.from('songs').update(row).eq('id', id) : await supabase.from('songs').insert({ ...row, added_by: user.id })
  if (error) back('/playlist', 'erro', error.message)
  revalidatePath('/playlist')
  back('/playlist', 'ok', id ? 'Música atualizada.' : 'Música adicionada.')
}
export async function setSongTone(f: FormData) {
  const { supabase } = await me()
  const { error } = await supabase.from('songs').update({ tone: n(f, 'tone') }).eq('id', s(f, 'id'))
  if (error) back('/playlist', 'erro', error.message)
  revalidatePath('/playlist')
  back('/playlist', 'ok', 'Tom alterado.')
}
export async function removeSong(f: FormData) {
  const { supabase } = await me()
  await supabase.from('songs').update({ is_active: false }).eq('id', s(f, 'id'))
  revalidatePath('/playlist')
  back('/playlist', 'ok', 'Música removida.')
}

// ---------- Atividades ----------
export async function saveActivity(f: FormData) {
  const { supabase, user } = await me()
  const turma = s(f, 'turma_id')
  const row = {
    turma_id: turma, date: s(f, 'date'), title: s(f, 'title'), description: n(f, 'description'),
    material_link: n(f, 'material_link') ?? n(f, 'material_file'), bible_verse: n(f, 'bible_verse'),
  }
  const { error } = await supabase.from('activities').insert({ ...row, created_by: user.id })
  if (error) back(`/atividades?turma=${turma}`, 'erro', /row-level/i.test(error.message) ? 'Você não tem permissão nesta turma.' : error.message)
  revalidatePath('/atividades'); revalidatePath('/calendario')
  back(`/atividades?turma=${turma}`, 'ok', 'Atividade cadastrada.')
}
export async function addComment(f: FormData) {
  const { supabase, user } = await me()
  const act = s(f, 'activity_id'); const turma = s(f, 'turma_id')
  const path = `/atividades?turma=${turma}&aula=${act}`
  if (!s(f, 'comment')) back(path, 'erro', 'Escreva um comentário.')
  const { error } = await supabase.from('activity_comments').insert({ activity_id: act, user_id: user.id, comment: s(f, 'comment') })
  if (error) back(path, 'erro', error.message)
  revalidatePath('/atividades')
  back(path, 'ok', 'Comentário publicado.')
}

// ---------- Fotos ----------
export async function addPhoto(f: FormData) {
  const { supabase, user } = await me()
  if (!s(f, 'photo_url')) back('/fotos', 'erro', 'Escolha uma foto antes de publicar.')
  const { error } = await supabase.from('photos').insert({
    photo_url: s(f, 'photo_url'), title: n(f, 'title'), turma_id: n(f, 'turma_id'), uploaded_by: user.id,
  })
  if (error) back('/fotos', 'erro', /row-level/i.test(error.message) ? 'Você não tem permissão para esta turma.' : error.message)
  revalidatePath('/fotos')
  back('/fotos', 'ok', 'Foto publicada.')
}
export async function togglePhoto(f: FormData) {
  const { supabase } = await me()
  await supabase.from('photos').update({ is_visible: s(f, 'visible') === '1' }).eq('id', s(f, 'id'))
  revalidatePath('/fotos')
  back('/fotos', 'ok', s(f, 'visible') === '1' ? 'Foto visível para os responsáveis.' : 'Foto ocultada.')
}
export async function deletePhoto(f: FormData) {
  const { supabase } = await me()
  await supabase.from('photos').delete().eq('id', s(f, 'id'))
  revalidatePath('/fotos')
  back('/fotos', 'ok', 'Foto excluída.')
}

// ---------- Notificações ----------
export async function markRead(f: FormData) {
  const { supabase } = await me()
  await supabase.from('notifications').update({ is_read: true }).eq('id', s(f, 'id'))
  revalidatePath('/', 'layout')
}
export async function markAllRead() {
  const { supabase, user } = await me()
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  revalidatePath('/', 'layout')
  back('/notificacoes', 'ok', 'Tudo marcado como lido.')
}
