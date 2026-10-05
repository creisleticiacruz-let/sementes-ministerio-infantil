import { requireProfile, fmtDate } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'

export default async function Calendario() {
  const { supabase } = await requireProfile()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
  const [{ data: events }, { data: specials }, { data: acts }] = await Promise.all([
    supabase.from('calendar_events').select('id,date,title,description').gte('date', start).lt('date', end).order('date'),
    supabase.from('special_dates').select('id,date,title,description').eq('is_active', true).gte('date', start).lt('date', end).order('date'),
    supabase.from('activities').select('id,date,title,turmas(name)').gte('date', start).lt('date', end).order('date'),
  ])
  const mes = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return (
    <>
      <h1 className="text-2xl font-bold capitalize">{mes}</h1>
      <Card title="Domingos com tema">
        {acts?.length ? <ul className="text-sm space-y-1">{acts.map((a) => <li key={a.id}><b>{fmtDate(a.date)}</b> — {a.title} <span className="text-slate-400">({(a.turmas as unknown as { name: string } | null)?.name})</span></li>)}</ul> : <Empty />}
      </Card>
      <Card title="Datas especiais">
        {specials?.length ? <ul className="text-sm space-y-1">{specials.map((d) => <li key={d.id}>🎉 <b>{fmtDate(d.date)}</b> — {d.title}{d.description ? `: ${d.description}` : ''}</li>)}</ul> : <Empty />}
      </Card>
      <Card title="Eventos">
        {events?.length ? <ul className="text-sm space-y-1">{events.map((e) => <li key={e.id}><b>{fmtDate(e.date)}</b> — {e.title}</li>)}</ul> : <Empty />}
      </Card>
    </>
  )
}
