import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { addDays, fmtBR, isSunday, nextSunday, parse, todayBR } from '@/lib/dates'

// Chamada pelo Vercel Cron (vercel.json): segunda e sexta → equipe; sábado → responsáveis.
// Protegida por CRON_SECRET (o Vercel envia "Authorization: Bearer <CRON_SECRET>").
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const today = todayBR()
  const raw = req.nextUrl.searchParams.get('tipo')
  // tipo=equipe roda segunda e sexta (um único agendamento); o dia da semana decide qual lembrete é
  const tipo = raw === 'equipe' ? (parse(today).getDay() === 5 ? 'sexta' : 'segunda') : raw
  const domingo = isSunday(today) ? addDays(today, 7) : nextSunday(today)
  const db = createAdminClient()
  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Sementes <onboarding@resend.dev>'
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  type Msg = { user_id: string; email: string; name: string; text: string; link: string; emailOn: boolean; appOn: boolean }
  const msgs: Msg[] = []
  const prefOf = async (ids: string[]) => {
    const { data } = await db.from('user_notification_preferences').select('*').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    return new Map((data ?? []).map((p) => [p.user_id, p]))
  }

  if (tipo === 'segunda' || tipo === 'sexta') {
    const { data } = await db.from('scale_assignments')
      .select('function,users!inner(id,name,email,is_active),scales!inner(date,description,teams(name))').eq('scales.date', domingo)
    const prefs = await prefOf((data ?? []).map((a) => (a.users as unknown as { id: string }).id))
    for (const a of data ?? []) {
      const u = a.users as unknown as { id: string; name: string; email: string; is_active: boolean }
      const sc = a.scales as unknown as { date: string; description: string | null; teams: { name: string } | null }
      const p = prefs.get(u.id)
      if (!u.is_active || (tipo === 'segunda' ? p?.monday_reminder_enabled === false : p?.friday_reminder_enabled === false)) continue
      msgs.push({ user_id: u.id, email: u.email, name: u.name, link: '/minha-escala', appOn: p?.app_notifications_enabled !== false, emailOn: p?.email_notifications_enabled !== false,
        text: `Você está escalado neste domingo no Ministério Infantil Sementes. 📅 ${fmtBR(sc.date)} · Equipe: ${sc.teams?.name} · Função: ${a.function}${sc.description ? ` · ${sc.description}` : ''}` })
    }
  } else if (tipo === 'sabado') {
    const [{ data: users }, { data: acts }, { data: sp }] = await Promise.all([
      db.from('users').select('id,name,email').eq('role', 'responsavel').eq('is_active', true),
      db.from('activities').select('title,turmas(name)').eq('date', domingo),
      db.from('special_dates').select('title').eq('date', domingo).eq('is_active', true),
    ])
    const prefs = await prefOf((users ?? []).map((u) => u.id))
    const tema = (acts ?? []).map((a) => `${(a.turmas as unknown as { name: string } | null)?.name}: ${a.title}`).join(' | ')
    for (const u of users ?? []) {
      const p = prefs.get(u.id)
      if (p?.saturday_reminder_enabled === false) continue
      msgs.push({ user_id: u.id, email: u.email, name: u.name, link: '/dashboard', appOn: p?.app_notifications_enabled !== false, emailOn: p?.email_notifications_enabled !== false,
        text: `🌱 Amanhã tem Sementes!${tema ? ` Tema — ${tema}.` : ''}${sp?.length ? ` 🎉 ${sp.map((x) => x.title).join(', ')}.` : ''}` })
    }
  } else return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })

  let app = 0, mail = 0
  for (const m of msgs) {
    if (m.appOn) { await db.from('notifications').insert({ user_id: m.user_id, message: m.text, link: m.link, channel: 'app' }); app++ }
    if (m.emailOn && resendKey) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: m.email, subject: tipo === 'sabado' ? '🌱 Amanhã tem Sementes!' : 'Sua escala no Ministério Infantil Sementes',
          html: `<p>Olá, ${m.name}!</p><p>${m.text}</p>${site ? `<p><a href="${site}${m.link}">Abrir a plataforma</a></p>` : ''}` }),
      })
      if (r.ok) mail++
    }
  }
  return NextResponse.json({ tipo, domingo, destinatarios: msgs.length, notificacoes: app, emails: mail, emailConfigurado: !!resendKey })
}
