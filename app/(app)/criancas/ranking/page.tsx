import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { Avatar, Card, Empty, PageHead } from '@/lib/ui'
import { allTurmas } from '@/lib/turmas'
import { MESES, monthRange, parseMonth, shiftMonth } from '@/lib/dates'

export default async function Ranking({ searchParams }: { searchParams: Promise<{ turma?: string; mes?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  if (profile.role === 'responsavel') redirect('/espaco-responsaveis')
  const { y, m, key } = parseMonth(sp.mes)
  const { start, end } = monthRange(key)
  const turmas = await allTurmas(supabase)
  const geral = sp.turma === 'geral'
  const sel = geral ? undefined : (turmas.find((t) => t.id === sp.turma)?.id ?? turmas[0]?.id)

  const { data: recs } = await supabase.from('presence_records').select('child_id,total_stars,children!inner(id,name,photo_url,turma_id,turmas(name))').gte('date', start).lt('date', end)
  const agg = new Map<string, { id: string; name: string; photo: string | null; turma: string; turma_id: string; stars: number }>()
  ;(recs ?? []).forEach((r) => {
    const c = r.children as unknown as { id: string; name: string; photo_url: string | null; turma_id: string; turmas: { name: string } | null }
    if (!geral && c.turma_id !== sel) return
    const cur = agg.get(c.id) ?? { id: c.id, name: c.name, photo: c.photo_url, turma: c.turmas?.name ?? '', turma_id: c.turma_id, stars: 0 }
    cur.stars += r.total_stars ?? 0
    agg.set(c.id, cur)
  })
  const ranking = [...agg.values()].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
  const podium = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const medals = ['🥇', '🥈', '🥉']
  const order = [1, 0, 2] // 2º, 1º, 3º

  return (
    <>
      <PageHead kicker="Ministério Infantil" title="🌱 Ranking Sementes" sub={`${MESES[m - 1]} de ${y}${geral ? ' · Ranking geral' : ''}`}>
        <Link href={`/criancas/ranking?turma=${sp.turma ?? sel}&mes=${shiftMonth(key, -1)}`} className="btn btn-sm">‹</Link>
        <Link href={`/criancas/ranking?turma=${sp.turma ?? sel}&mes=${shiftMonth(key, 1)}`} className="btn btn-sm">›</Link>
        <Link href="/criancas" className="btn">Voltar à chamada</Link>
      </PageHead>
      <div className="flex flex-wrap gap-2">
        {turmas.map((t) => <Link key={t.id} href={`/criancas/ranking?turma=${t.id}&mes=${key}`} className={`btn btn-sm ${t.id === sel ? 'btn-primary' : ''}`}>{t.name}</Link>)}
        <Link href={`/criancas/ranking?turma=geral&mes=${key}`} className={`btn btn-sm ${geral ? 'btn-primary' : ''}`}>Geral</Link>
      </div>
      {podium.length ? (
        <>
          <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mx-auto w-full">
            {order.map((pos) => {
              const c = podium[pos]
              if (!c) return <div key={pos} />
              return (
                <div key={c.id} className={`card text-center flex flex-col items-center gap-1 ${pos === 0 ? 'bg-[#fef3c7] border-[#fcd34d] pb-8' : pos === 1 ? 'pb-5' : 'pb-3'}`}>
                  <span className="text-3xl">{medals[pos]}</span>
                  <Avatar name={c.name} url={c.photo} size={pos === 0 ? 72 : 56} />
                  <p className="font-semibold leading-tight">{c.name}</p>
                  {geral && <p className="text-xs text-[var(--muted)]">{c.turma}</p>}
                  <p className="text-lg font-bold">⭐ {c.stars}</p>
                  <span className="badge">{pos + 1}º lugar</span>
                </div>
              )
            })}
          </div>
          {rest.length > 0 && (
            <Card title="Demais posições">
              {rest.map((c, i) => (
                <div key={c.id} className="subcard flex items-center gap-3 mb-2">
                  <span className="badge w-8 text-center">{i + 4}º</span><Avatar name={c.name} url={c.photo} size={32} />
                  <span className="flex-1">{c.name}{geral && <span className="text-xs text-[var(--muted)]"> · {c.turma}</span>}</span><b>⭐ {c.stars}</b>
                </div>
              ))}
            </Card>
          )}
        </>
      ) : <Card><Empty>Nenhuma estrela registrada neste mês ainda.</Empty></Card>}
    </>
  )
}
