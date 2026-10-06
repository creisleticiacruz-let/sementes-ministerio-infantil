import type { SupabaseClient } from '@supabase/supabase-js'
import { Avatar, Card, Empty } from '@/lib/ui'
import { MESES, fmtBR } from '@/lib/dates'

/** Resumo de uma criança: estrelas, frequência, evolução mensal e próxima recompensa. */
export default async function ChildHistory({ supabase, childId }: { supabase: SupabaseClient; childId: string }) {
  const [{ data: child }, { data: recs }, { data: rewards }] = await Promise.all([
    supabase.from('children').select('id,name,photo_url,birth_date,turmas(name)').eq('id', childId).maybeSingle(),
    supabase.from('presence_records').select('date,is_present,bible_stars,verse_stars,attitude_stars,extra_stars,total_stars').eq('child_id', childId).order('date', { ascending: false }),
    supabase.from('rewards').select('id,name,points_required').neq('status', 'inactive').order('points_required'),
  ])
  if (!child) return <Card><Empty>Criança não encontrada.</Empty></Card>
  const r = recs ?? []
  const total = r.reduce((a, x) => a + (x.total_stars ?? 0), 0)
  const presencas = r.filter((x) => x.is_present).length
  const aulas = r.length
  const pct = aulas ? Math.round((presencas / aulas) * 100) : 0
  const sum = (k: 'bible_stars' | 'verse_stars' | 'attitude_stars' | 'extra_stars') => r.reduce((a, x) => a + (x[k] ?? 0), 0)
  const byMonth = new Map<string, number>()
  r.forEach((x) => byMonth.set(x.date.slice(0, 7), (byMonth.get(x.date.slice(0, 7)) ?? 0) + (x.total_stars ?? 0)))
  const months = [...byMonth.entries()].sort().slice(-6)
  const max = Math.max(1, ...months.map(([, v]) => v))
  const conquered = (rewards ?? []).filter((w) => w.points_required <= total).at(-1)
  const next = (rewards ?? []).find((w) => w.points_required > total)
  const turma = (child.turmas as unknown as { name: string } | null)?.name

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar name={child.name} url={child.photo_url} size={72} />
          <div className="flex-1 min-w-40">
            <h2 className="text-lg font-semibold">{child.name}</h2>
            <p className="text-sm text-[var(--muted)]">Turma {turma}{child.birth_date ? ` · 🎂 ${fmtBR(child.birth_date).slice(0, 5)}` : ''}</p>
          </div>
          <div className="text-right"><p className="text-2xl font-bold">⭐ {total}</p><p className="text-xs text-[var(--muted)]">estrelas conquistadas</p></div>
        </div>
        <div className="subcard mt-3 text-sm">
          <b>Você conquistou {total} estrelas!</b>{' '}
          {next ? <>Sua próxima recompensa (<b>{next.name}</b>) está a <b>{next.points_required - total}</b> {next.points_required - total === 1 ? 'estrela' : 'estrelas'} de distância.</> : (rewards?.length ? 'Todas as recompensas foram conquistadas! 🎉' : '')}
          {conquered && <p className="text-xs text-[var(--muted)] mt-1">Última recompensa alcançada: 🎁 {conquered.name}</p>}
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card"><p className="text-xs text-[var(--muted)]">Presenças</p><p className="text-lg font-semibold">{presencas}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">Ausências</p><p className="text-lg font-semibold">{aulas - presencas}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">Frequência nos cultos</p><p className="text-lg font-semibold">{pct}%</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">Aulas registradas</p><p className="text-lg font-semibold">{aulas}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">📖 Bíblias</p><p className="text-lg font-semibold">{sum('bible_stars')}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">✝️ Versículos</p><p className="text-lg font-semibold">{sum('verse_stars')}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">😊 Boas atitudes</p><p className="text-lg font-semibold">{sum('attitude_stars') + sum('extra_stars')}</p></div>
        <div className="card"><p className="text-xs text-[var(--muted)]">⭐ Presença</p><p className="text-lg font-semibold">{presencas}</p></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Evolução mensal">
          {months.length ? (
            <div className="flex items-end gap-2 h-36">
              {months.map(([k, v]) => (
                <div key={k} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-xs font-medium">{v}</span>
                  <div className="w-full rounded-t bg-[var(--green)]" style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
                  <span className="text-[11px] text-[var(--muted)]">{MESES[Number(k.slice(5)) - 1].slice(0, 3)}</span>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Card>
        <Card title="Histórico de participação">
          {r.length ? (
            <div className="max-h-56 overflow-y-auto">
              <table className="table"><thead><tr><th>Aula</th><th>Presente</th><th>📖</th><th>✝️</th><th>😊</th><th>⭐</th></tr></thead>
                <tbody>{r.slice(0, 20).map((x) => (
                  <tr key={x.date}><td>{fmtBR(x.date).slice(0, 5)}</td><td>{x.is_present ? '✅' : '—'}</td><td>{x.bible_stars}</td><td>{x.verse_stars}</td><td>{(x.attitude_stars ?? 0) + (x.extra_stars ?? 0)}</td><td><b>{x.total_stars}</b></td></tr>
                ))}</tbody></table>
            </div>
          ) : <Empty>Ainda não há aulas registradas.</Empty>}
        </Card>
      </div>
    </div>
  )
}
