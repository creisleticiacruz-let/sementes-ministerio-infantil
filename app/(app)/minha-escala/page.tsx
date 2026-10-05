import { requireProfile, fmtDate, today } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'

type Row = { function: string; scales: { date: string; description: string | null; teams: { name: string } | null } }

export default async function MinhaEscala() {
  const { supabase, profile } = await requireProfile()
  const { data } = await supabase.from('scale_assignments').select('function, scales!inner(date, description, teams(name))')
    .eq('user_id', profile.id).order('date', { referencedTable: 'scales' })
  const rows = (data ?? []) as unknown as Row[]
  const futuras = rows.filter((r) => r.scales.date >= today())
  const passadas = rows.filter((r) => r.scales.date < today()).reverse()
  const Item = ({ r }: { r: Row }) => (
    <li className="py-2 border-b last:border-0 text-sm">
      <b>{fmtDate(r.scales.date)}</b> — {r.scales.teams?.name} · {r.function}
      {r.scales.description && <span className="text-slate-500"> ({r.scales.description})</span>}
    </li>
  )
  return (
    <>
      <h1 className="text-2xl font-bold">Minha escala</h1>
      <Card title="Próximas">{futuras.length ? <ul>{futuras.map((r, i) => <Item key={i} r={r} />)}</ul> : <Empty />}</Card>
      <Card title="Anteriores">{passadas.length ? <ul>{passadas.slice(0, 20).map((r, i) => <Item key={i} r={r} />)}</ul> : <Empty />}</Card>
    </>
  )
}
