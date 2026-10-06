'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { back } from '@/lib/flash'
import { addDays } from '@/lib/dates'

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const n = (f: FormData, k: string) => (s(f, k) === '' ? null : s(f, k))

async function admin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (data?.role !== 'admin') redirect('/dashboard')
  return { supabase, user }
}
const fail = (path: string, e: { message: string }) => back(path, 'erro', e.message)

// ---------- Usuários ----------
export async function inviteUser(f: FormData) {
  await admin()
  const email = s(f, 'email').toLowerCase()
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  if (!site) back('/admin/usuarios', 'erro', 'Defina NEXT_PUBLIC_SITE_URL no Vercel e faça Redeploy.')
  let adminClient: ReturnType<typeof createAdminClient>
  try { adminClient = createAdminClient() } catch { back('/admin/usuarios', 'erro', 'Defina SUPABASE_SERVICE_ROLE_KEY no Vercel e faça Redeploy.') }
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, { data: { name: s(f, 'name') }, redirectTo: `${site}/redefinir-senha` })
  if (error) fail('/admin/usuarios', error)
  await adminClient.from('users').upsert({ id: data.user!.id, name: s(f, 'name') || email.split('@')[0], email, role: s(f, 'role') || 'voluntario' })
  revalidatePath('/admin/usuarios')
  back('/admin/usuarios', 'ok', `Convite enviado para ${email}.`)
}
export async function updateUser(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('users').update({ role: s(f, 'role'), is_active: f.get('active') === 'on', name: s(f, 'name') }).eq('id', s(f, 'id'))
  if (error) fail('/admin/usuarios', error)
  revalidatePath('/admin/usuarios')
  back('/admin/usuarios', 'ok', 'Usuário atualizado.')
}

// ---------- Equipes ----------
export async function createTeam(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('teams').insert({ name: s(f, 'name'), description: n(f, 'description') })
  if (error) fail('/admin/equipes', error)
  revalidatePath('/admin/equipes')
  back('/admin/equipes', 'ok', 'Equipe criada.')
}
export async function toggleTeam(f: FormData) {
  const { supabase } = await admin()
  await supabase.from('teams').update({ is_active: s(f, 'active') === '1' }).eq('id', s(f, 'id'))
  revalidatePath('/admin/equipes')
  back('/admin/equipes', 'ok', 'Equipe atualizada.')
}
export async function addMember(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('team_members').insert({ team_id: s(f, 'team_id'), user_id: s(f, 'user_id'), role: s(f, 'role') })
  if (error) fail('/admin/equipes', { message: /duplicate/i.test(error.message) ? 'Essa pessoa já tem esta função na equipe.' : error.message })
  revalidatePath('/admin/equipes')
  back('/admin/equipes', 'ok', 'Membro adicionado.')
}
export async function removeMember(f: FormData) {
  const { supabase } = await admin()
  await supabase.from('team_members').delete().eq('id', s(f, 'id'))
  revalidatePath('/admin/equipes')
  back('/admin/equipes', 'ok', 'Membro removido.')
}

// ---------- Crianças ----------
export async function saveChild(f: FormData) {
  const { supabase } = await admin()
  const id = s(f, 'id')
  const row: Record<string, string | null> = { name: s(f, 'name'), birth_date: n(f, 'birth_date'), turma_id: s(f, 'turma_id') }
  if (s(f, 'photo_url')) row.photo_url = s(f, 'photo_url')
  const q = id ? supabase.from('children').update(row).eq('id', id).select('id').single() : supabase.from('children').insert(row).select('id').single()
  const { data, error } = await q
  if (error) fail('/admin/criancas', error)
  if (s(f, 'responsavel_id')) await supabase.from('children_responsaveis').upsert({ child_id: data!.id, user_id: s(f, 'responsavel_id') }, { onConflict: 'child_id,user_id' })
  revalidatePath('/', 'layout')
  back('/admin/criancas', 'ok', id ? 'Criança atualizada.' : 'Criança cadastrada.')
}
export async function linkGuardian(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('children_responsaveis').upsert({ child_id: s(f, 'child_id'), user_id: s(f, 'user_id') }, { onConflict: 'child_id,user_id' })
  if (error) fail('/admin/criancas', error)
  revalidatePath('/admin/criancas')
  back('/admin/criancas', 'ok', 'Responsável vinculado.')
}
export async function unlinkGuardian(f: FormData) {
  const { supabase } = await admin()
  await supabase.from('children_responsaveis').delete().eq('id', s(f, 'id'))
  revalidatePath('/admin/criancas')
  back('/admin/criancas', 'ok', 'Vínculo removido.')
}
export async function removeChild(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('children').delete().eq('id', s(f, 'id'))
  if (error) fail('/admin/criancas', error)
  revalidatePath('/', 'layout')
  back('/admin/criancas', 'ok', 'Criança excluída com todas as ligações.')
}

// ---------- Escalas ----------
export async function createScale(f: FormData) {
  const { supabase, user } = await admin()
  const { error } = await supabase.from('scales').insert({ date: s(f, 'date'), team_id: s(f, 'team_id'), description: n(f, 'description'), created_by: user.id })
  if (error) fail('/admin/escalas', error)
  revalidatePath('/admin/escalas')
  back('/admin/escalas', 'ok', 'Escala criada. Agora adicione as pessoas.')
}
export async function addAssignment(f: FormData) {
  const { supabase } = await admin()
  const { error } = await supabase.from('scale_assignments').insert({ scale_id: s(f, 'scale_id'), user_id: s(f, 'user_id'), function: s(f, 'function') })
  if (error) fail('/admin/escalas', { message: /duplicate/i.test(error.message) ? 'Essa pessoa já está nesta função.' : error.message })
  // avisa a pessoa escalada
  const { data: sc } = await supabase.from('scales').select('date,teams(name)').eq('id', s(f, 'scale_id')).single()
  if (sc) await supabase.from('notifications').insert({ user_id: s(f, 'user_id'), channel: 'app', link: '/minha-escala', message: `Você foi escalado(a) em ${sc.date.split('-').reverse().join('/')} — ${(sc.teams as unknown as { name: string } | null)?.name} (${s(f, 'function')}).` })
  revalidatePath('/admin/escalas')
  back('/admin/escalas', 'ok', 'Pessoa escalada.')
}
export async function removeAssignment(f: FormData) {
  const { supabase } = await admin()
  await supabase.from('scale_assignments').delete().eq('id', s(f, 'id'))
  revalidatePath('/admin/escalas')
  back('/admin/escalas', 'ok', 'Removido da escala.')
}
export async function deleteScale(f: FormData) {
  const { supabase } = await admin()
  await supabase.from('scales').delete().eq('id', s(f, 'id'))
  revalidatePath('/admin/escalas')
  back('/admin/escalas', 'ok', 'Escala excluída.')
}
export async function duplicateScale(f: FormData) {
  const { supabase, user } = await admin()
  const { data: src } = await supabase.from('scales').select('date,team_id,description,scale_assignments(user_id,function)').eq('id', s(f, 'id')).single()
  if (!src) back('/admin/escalas', 'erro', 'Escala não encontrada.')
  const { data: created, error } = await supabase.from('scales').insert({ date: addDays(src!.date, 7), team_id: src!.team_id, description: src!.description, created_by: user.id }).select('id').single()
  if (error) fail('/admin/escalas', error)
  const items = (src!.scale_assignments as unknown as { user_id: string; function: string }[]).map((a) => ({ scale_id: created!.id, ...a }))
  if (items.length) await supabase.from('scale_assignments').insert(items)
  revalidatePath('/admin/escalas')
  back('/admin/escalas', 'ok', 'Escala duplicada para o domingo seguinte.')
}

// ---------- Conteúdos ----------
export async function saveSpecialDate(f: FormData) {
  const { supabase, user } = await admin()
  const { error } = await supabase.from('special_dates').insert({ date: s(f, 'date'), title: s(f, 'title'), description: n(f, 'description'), created_by: user.id })
  if (error) fail('/admin/conteudos', error)
  revalidatePath('/calendario')
  back('/admin/conteudos', 'ok', 'Data especial cadastrada.')
}
export async function saveEvent(f: FormData) {
  const { supabase, user } = await admin()
  const { error } = await supabase.from('calendar_events').insert({ date: s(f, 'date'), title: s(f, 'title'), description: n(f, 'description'), created_by: user.id })
  if (error) fail('/admin/conteudos', error)
  revalidatePath('/calendario')
  back('/admin/conteudos', 'ok', 'Evento cadastrado.')
}
export async function deleteRow(f: FormData) {
  const { supabase } = await admin()
  const table = s(f, 'table')
  if (!['special_dates', 'calendar_events', 'snack_suggestions', 'activities', 'rewards'].includes(table)) back('/admin/conteudos', 'erro', 'Tabela inválida.')
  const { error } = await supabase.from(table).delete().eq('id', s(f, 'id'))
  if (error) fail(s(f, 'back') || '/admin/conteudos', error)
  revalidatePath('/', 'layout')
  back(s(f, 'back') || '/admin/conteudos', 'ok', 'Removido.')
}
export async function addSnack(f: FormData) {
  const { supabase, user } = await admin()
  const { error } = await supabase.from('snack_suggestions').insert({ name: s(f, 'name'), created_by: user.id })
  if (error) fail('/admin/conteudos', error)
  revalidatePath('/equipes')
  back('/admin/conteudos', 'ok', 'Sugestão adicionada.')
}
export async function savePix(f: FormData) {
  const { supabase, user } = await admin()
  const row = { church_name: n(f, 'church_name'), pix_key: s(f, 'pix_key'), pix_qr_code_url: n(f, 'pix_qr_code_url'), description: n(f, 'description'), is_active: true, updated_by: user.id }
  const id = s(f, 'id')
  const { error } = id ? await supabase.from('offering_settings').update(row).eq('id', id) : await supabase.from('offering_settings').insert(row)
  if (error) fail('/admin/conteudos', error)
  revalidatePath('/espaco-responsaveis')
  back('/admin/conteudos', 'ok', 'Dados do PIX salvos.')
}
export async function sendNotification(f: FormData) {
  const { supabase } = await admin()
  const target = s(f, 'target')
  let q = supabase.from('users').select('id').eq('is_active', true)
  if (target === 'responsavel') q = q.eq('role', 'responsavel')
  else if (target === 'equipe') q = q.neq('role', 'responsavel')
  const { data: us } = await q
  const rows = (us ?? []).map((u) => ({ user_id: u.id, channel: 'app', message: s(f, 'message'), link: n(f, 'link') }))
  if (!rows.length) back('/admin/conteudos', 'erro', 'Nenhum destinatário encontrado.')
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) fail('/admin/conteudos', error)
  back('/admin/conteudos', 'ok', `Notificação enviada para ${rows.length} pessoa(s).`)
}

// ---------- Recompensas ----------
export async function saveReward(f: FormData) {
  const { supabase } = await admin()
  const row = { name: s(f, 'name'), description: n(f, 'description'), points_required: Number(s(f, 'points_required')) || 0 }
  const id = s(f, 'id')
  const { error } = id ? await supabase.from('rewards').update(row).eq('id', id) : await supabase.from('rewards').insert(row)
  if (error) fail('/admin/recompensas', error)
  revalidatePath('/criancas/recompensas')
  back('/admin/recompensas', 'ok', 'Recompensa salva.')
}
