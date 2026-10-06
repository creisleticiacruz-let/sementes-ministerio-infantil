import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Card, Empty, PageHead, Stat } from '@/lib/ui'
import { DIAS, MESES, diffDays, fmtBR, fmtLong, fmtShort, monthGrid, parseMonth, shiftMonth, todayBR } from '@/lib/dates'

type Row = { function: string; scales: { id: string; date: string; description: string | null; teams: { name: string } | null } }

export default async function MinhaEscala({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const today = todayBR()
  const { y, m, key } = parseMonth(sp.mes)
  const { data } = await supabase.from('scale_assignments').select('function, scales!inner(id,date,description,teams(name))')
    .eq('user_id', profile.id).order('date', { referencedTable: 'scales' })
  const rows = ((data ?? []) as unknown as Row[])
  const futuras = rows.filter((r) => r.scales.date >= today)
  const passadas = rows.filter((r) => r.scales.date < today).reverse()
  const noMes = rows.filter((r) => r.scales.date.startsWith(key))
  const byDate = new Map<string, Row[]>()
  noMes.forEach((r) => byDate.set(r.scales.date, [...(byDate.get(r.scales.date) ?? []), r]))
  const next = futuras[0]
  const grid = monthGrid(y, m)

  // colegas de equipe na próxima escala
  const { data: mates } = next ? await supabase.from('scale_assignments').select('function, users(name)').eq('scale_id', next.scales.id) : { data: [] }

  return (
    <>
      <PageHead kicker="Minha Escala" title={`Escala de ${profile.name.split(' ')[0]}`} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Domingos escalados no mês" value={noMes.length} />
        <Stat label="Total futuro" value={futuras.length} />
        <Stat label="Próxima escala" value={next ? (diffDays(today, next.scales.date) === 0 ? 'Hoje' : `Em ${diffDays(today, next.scales.date)} dias`) : '—'} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Calendário Completo" className="lg:col-span-2" action={
          <div className="flex items-center gap-1">
            <Link href={`/minha-escala?mes=${shiftMonth(key, -1)}`} className="btn btn-sm">‹</Link>
            <span className="btn btn-sm">{MESES[m - 1]} {y}</span>
            <Link href={`/minha-escala?mes=${shiftMonth(key, 1)}`} className="btn btn-sm">›</Link>
          </div>}>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)] mb-1">{DIAS.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="subcard min-h-14 opacity-40" />
              const hit = byDate.get(d)
              return (
                <div key={i} className={`border rounded-md min-h-14 p-1 text-xs ${d === today ? 'border-[var(--primary)]' : 'border-[var(--line)]'} ${hit ? 'bg-[var(--green-soft)]' : 'bg-white'}`}>
                  <span className="text-[var(--muted)]">{Number(d.slice(8))}</span>
                  {hit?.map((r, j) => <p key={j} className="mt-0.5 font-medium leading-tight">{r.scales.teams?.name}</p>)}
                </div>
              )
            })}
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Próxima Escala">
            {next ? (
              <>
                <div className="subcard mb-2"><b className="capitalize">{fmtLong(next.scales.date)}</b></div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="subcard"><p className="text-xs text-[var(--muted)]">Equipe</p>{next.scales.teams?.name}</div>
                  <div className="subcard"><p className="text-xs text-[var(--muted)]">Função</p>{next.function}</div>
                </div>
                {next.scales.description && <p className="text-xs text-[var(--muted)] mt-2">{next.scales.description}</p>}
                {!!mates?.length && <p className="text-xs mt-2"><b>Quem serve junto:</b> {mates.map((x) => `${(x.users as unknown as { name: string } | null)?.name} (${x.function})`).join(', ')}</p>}
              </>
            ) : <Empty>Nenhuma escala futura.</Empty>}
          </Card>
          <Card title="Próximas Escalas">
            {futuras.length > 1 ? futuras.slice(1, 6).map((r, i) => (
              <div key={i} className="subcard flex items-center gap-3 mb-2 text-sm">
                <b className="w-14">{fmtShort(r.scales.date)}</b><span>{r.scales.teams?.name} · {r.function}</span>
              </div>
            )) : <Empty />}
          </Card>
        </div>
      </div>
      <Card title="Escalas Passadas">
        {passadas.length ? (
          <div className="overflow-x-auto">
            <table className="table"><thead><tr><th>Data</th><th>Equipe</th><th>Função</th></tr></thead>
              <tbody>{passadas.slice(0, 15).map((r, i) => <tr key={i}><td>{fmtBR(r.scales.date)}</td><td>{r.scales.teams?.name}</td><td>{r.function}</td></tr>)}</tbody></table>
          </div>
        ) : <Empty />}
      </Card>
    </>
  )
}
