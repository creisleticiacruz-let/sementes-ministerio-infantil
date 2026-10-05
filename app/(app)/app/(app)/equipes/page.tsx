import { requireProfile, fmtDate, today } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'

export default async function Equipes() {
  const { supabase } = await requireProfile()
  const [{ data: teams }, { data: members }, { data: scales }] = await Promise.all([
    supabase.from('teams').select('id,name,description').eq('is_active', true).order('name'),
    supabase.from('team_members').select('team_id, role, users(name)'),
    supabase.from('scales').select('id,team_id,date,scale_assignments(function, users(name))').gte('date', today()).order('date').limit(40),
  ])
  return (
    <>
      <h1 className="text-2xl font-bold">Equipes</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {teams?.map((t) => {
          const ms = (members ?? []).filter((m) => m.team_id === t.id) as unknown as { role: string; users: { name: string } | null }[]
          const sc = (scales ?? []).filter((s) => s.team_id === t.id).slice(0, 3) as unknown as { id: string; date: string; scale_assignments: { function: string; users: { name: string } | null }[] }[]
          return (
            <Card key={t.id} title={t.name}>
              {t.description && <p className="text-sm text-slate-500 mb-2">{t.description}</p>}
              <p className="text-xs font-semibold uppercase text-slate-400">Membros</p>
              {ms.length ? <ul className="text-sm mb-2">{ms.map((m, i) => <li key={i}>{m.users?.name} <span className="text-slate-400">· {m.role}</span></li>)}</ul> : <Empty />}
              <p className="text-xs font-semibold uppercase text-slate-400">Próximas escalas</p>
              {sc.length ? sc.map((s) => (
                <p key={s.id} className="text-sm"><b>{fmtDate(s.date)}</b>: {s.scale_assignments.map((a) => `${a.users?.name} (${a.function})`).join(', ') || '—'}</p>
              )) : <Empty />}
            </Card>
          )
        })}
      </div>
    </>
  )
}
