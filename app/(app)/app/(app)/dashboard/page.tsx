import Link from 'next/link'
import { requireProfile, fmtDate, today } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'
import { markRead } from '../actions'

export default async function Dashboard() {
  const { supabase, profile } = await requireProfile()
  const [{ data: next }, { data: notes }, { data: events }] = await Promise.all([
    supabase.from('scale_assignments').select('function, scales!inner(date, description, teams(name))')
      .eq('user_id', profile.id).gte('scales.date', today()).order('date', { referencedTable: 'scales' }).limit(1),
    supabase.from('notifications').select('id,message,link').eq('user_id', profile.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('calendar_events').select('id,date,title').gte('date', today()).order('date').limit(4),
  ])
  const sc = next?.[0] as unknown as { function: string; scales: { date: string; description: string | null; teams: { name: string } | null } } | undefined
  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {profile.name.split(' ')[0]}! 👋</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Próxima escala">
          {sc ? (
            <Link href="/minha-escala" className="block">
              <p className="font-medium">{fmtDate(sc.scales.date)} — {sc.scales.teams?.name}</p>
              <p className="text-sm text-slate-600">Função: {sc.function}</p>
            </Link>
          ) : <Empty>Você não está escalado(a) nos próximos domingos.</Empty>}
        </Card>
        <Card title="Notificações">
          {notes?.length ? notes.map((n) => (
            <form key={n.id} action={markRead} className="flex justify-between gap-2 text-sm py-1">
              <input type="hidden" name="id" value={n.id} />
              {n.link ? <Link href={n.link} className="underline">{n.message}</Link> : <span>{n.message}</span>}
              <button className="text-slate-400 hover:text-slate-700">✓</button>
            </form>
          )) : <Empty>Sem notificações novas.</Empty>}
        </Card>
        <Card title="Calendário">
          {events?.length ? events.map((e) => <p key={e.id} className="text-sm">{fmtDate(e.date)} — {e.title}</p>) : <Empty />}
          <Link href="/calendario" className="text-sm text-emerald-700 underline">Ver calendário completo</Link>
        </Card>
        <Card title="Acesso rápido">
          <div className="flex flex-wrap gap-2 text-sm">
            {[['/atividades', 'Atividades'], ['/playlist', 'Playlist'], ['/criancas', 'Crianças'], ['/aniversarios', 'Aniversários']].map(([h, l]) => (
              <Link key={h} href={h} className="bg-emerald-50 text-emerald-800 rounded-full px-3 py-1">{l}</Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
