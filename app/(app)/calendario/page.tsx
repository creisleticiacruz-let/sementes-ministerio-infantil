import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'
import { DIAS, MESES, fmtBR, isSunday, monthGrid, monthRange, parseMonth, shiftMonth, todayBR } from '@/lib/dates'

export default async function Calendario({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const today = todayBR()
  const { y, m, key } = parseMonth(sp.mes)
  const { start, end } = monthRange(key)
  const [{ data: acts }, { data: specials }, { data: events }] = await Promise.all([
    supabase.from('activities').select('id,date,title,turmas(name)').gte('date', start).lt('date', end).order('date'),
    supabase.from('special_dates').select('id,date,title,description').eq('is_active', true).gte('date', start).lt('date', end).order('date'),
    supabase.from('calendar_events').select('id,date,title,description').gte('date', start).lt('date', end).order('date'),
  ])
  const grid = monthGrid(y, m)
  const staff = profile.role !== 'responsavel'
  const spBy = (d: string) => (specials ?? []).filter((x) => x.date === d)
  const evBy = (d: string) => (events ?? []).filter((x) => x.date === d)
  const acBy = (d: string) => (acts ?? []).filter((x) => x.date === d)

  return (
    <>
      <header className="card flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">📅 Calendário Sementes</h1>
        <div className="flex items-center gap-2">
          <Link href="/calendario" className="btn btn-primary btn-sm">Hoje</Link>
          <Link href={`/calendario?mes=${shiftMonth(key, -1)}`} className="btn btn-sm">‹</Link>
          <span className="text-sm font-medium w-36 text-center">{MESES[m - 1]} {y}</span>
          <Link href={`/calendario?mes=${shiftMonth(key, 1)}`} className="btn btn-sm">›</Link>
        </div>
      </header>
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card>
          <div className="hidden md:grid grid-cols-7 gap-2 text-center text-xs text-[var(--muted)] mb-2">{DIAS.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="hidden md:block" />
              const sun = isSunday(d); const sps = spBy(d); const evs = evBy(d); const as = acBy(d)
              const interesting = sun || sps.length || evs.length
              return (
                <div key={i} className={`border rounded-lg p-2 min-h-24 text-xs ${d === today ? 'border-[var(--primary)] border-2' : 'border-[var(--line)]'} ${sun ? 'bg-[#e5e7eb]' : 'bg-white'} ${!interesting ? 'hidden md:block' : ''}`}>
                  <div className="flex items-center justify-between">
                    <b className="text-sm">{Number(d.slice(8))}</b>
                    {sun && <span className="badge">Domingo</span>}
                    {!sun && sps.length > 0 && <span className="badge badge-orange">Especial</span>}
                  </div>
                  {as.map((a) => <p key={a.id} className="mt-1 leading-tight"><b>🌱 {a.title}</b>{staff && <span className="text-[var(--muted)]"> · {(a.turmas as unknown as { name: string } | null)?.name}</span>}</p>)}
                  {sun && !as.length && <p className="mt-1 text-[var(--muted)]">Tema a definir</p>}
                  {sps.map((s) => <p key={s.id} className="mt-1 text-[#92400e]">🎉 {s.title}</p>)}
                  {evs.map((e) => <p key={e.id} className="mt-1">📌 {e.title}</p>)}
                  {sun && staff && <Link href="/atividades" className="btn btn-sm mt-2">Aula</Link>}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-[var(--muted)] mt-4">
            <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#e5e7eb] border" /> Domingo (Tema)</span>
            <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#fef3c7] border" /> Data Especial</span>
          </div>
        </Card>
        <Card title="Datas Especiais">
          {specials?.length || events?.length ? (
            <div className="space-y-2">
              {[...(specials ?? []).map((s) => ({ ...s, e: false })), ...(events ?? []).map((s) => ({ ...s, e: true }))].sort((a, b) => a.date.localeCompare(b.date)).map((s) => (
                <div key={s.id} className="subcard"><p className="text-xs text-[var(--muted)]">{fmtBR(s.date).slice(0, 5)}</p><p>{s.e ? '📌' : '🎉'} {s.title}</p>{s.description && <p className="text-xs text-[var(--muted)]">{s.description}</p>}</div>
              ))}
            </div>
          ) : <Empty>Nenhuma data especial neste mês.</Empty>}
        </Card>
      </div>
    </>
  )
}
