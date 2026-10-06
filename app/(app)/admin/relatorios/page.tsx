import { requireProfile } from '@/lib/auth'
import { Card, Empty, PageHead } from '@/lib/ui'
import { MESES, monthRange, todayBR } from '@/lib/dates'

export default async function Relatorios() {
  const { supabase } = await requireProfile()
  const key = todayBR().slice(0, 7)
  const { start, end } = monthRange(key)
  const [{ data: turmas }, { data: kids }, { data: recs }] = await Promise.all([
    supabase.from('turmas').select('id,name').order('name'),
    supabase.from('children').select('id,turma_id').eq('is_active', true),
    supabase.from('presence_records').select('child_id,date,is_present,total_stars').gte('date', start).lt('date', end),
  ])
  const rows = (turmas ?? []).map((t) => {
    const ids = new Set((kids ?? []).filter((k) => k.turma_id === t.id).map((k) => k.id))
    const rs = (recs ?? []).filter((r) => ids.has(r.child_id))
    const aulas = new Set(rs.map((r) => r.date)).size
    const pres = rs.filter((r) => r.is_present).length
    return { nome: t.name, criancas: ids.size, aulas, freq: rs.length ? Math.round((pres / rs.length) * 100) : 0, stars: rs.reduce((a, r) => a + (r.total_stars ?? 0), 0) }
  })
  return (
    <>
      <PageHead kicker="Administração" title="Relatórios" sub={`Resumo de ${MESES[Number(key.slice(5)) - 1]} de ${key.slice(0, 4)}`} />
      <Card title="Frequência e estrelas por turma">
        {rows.length ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Turma</th><th>Crianças</th><th>Aulas no mês</th><th>Frequência</th><th>Estrelas</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.nome}><td><b>{r.nome}</b></td><td>{r.criancas}</td><td>{r.aulas}</td><td>{r.freq}%</td><td>⭐ {r.stars}</td></tr>)}</tbody></table></div> : <Empty />}
      </Card>
    </>
  )
}
