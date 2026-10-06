import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { Card, Empty, PageHead } from '@/lib/ui'
import { allTurmas } from '@/lib/turmas'

export default async function Recompensas({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  if (profile.role === 'responsavel') redirect('/espaco-responsaveis')
  const turmas = await allTurmas(supabase)
  const sel = turmas.find((t) => t.id === sp.turma)?.id ?? turmas[0]?.id
  const [{ data: rewards }, { data: kids }, { data: recs }] = await Promise.all([
    supabase.from('rewards').select('id,name,description,points_required').neq('status', 'inactive').order('points_required'),
    supabase.from('children').select('id,name').eq('turma_id', sel ?? '').eq('is_active', true).order('name'),
    supabase.from('presence_records').select('child_id,total_stars'),
  ])
  const total = new Map<string, number>()
  ;(recs ?? []).forEach((r) => total.set(r.child_id, (total.get(r.child_id) ?? 0) + (r.total_stars ?? 0)))
  return (
    <>
      <PageHead kicker="Ministério Infantil" title="Recompensas"><Link href="/criancas" className="btn">← Voltar</Link>
        {profile.role === 'admin' && <Link href="/admin/recompensas" className="btn btn-primary">Gerenciar</Link>}</PageHead>
      <Card title="Faixas de pontuação">
        {rewards?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rewards.map((w) => <div key={w.id} className="subcard text-center"><p className="text-2xl">🎁</p><p className="font-medium">{w.name}</p><p className="text-sm">{w.points_required} ⭐</p>{w.description && <p className="text-xs text-[var(--muted)]">{w.description}</p>}</div>)}
          </div>
        ) : <Empty>Nenhuma recompensa cadastrada.</Empty>}
      </Card>
      <div className="flex gap-2 flex-wrap">{turmas.map((t) => <Link key={t.id} href={`/criancas/recompensas?turma=${t.id}`} className={`btn btn-sm ${t.id === sel ? 'btn-primary' : ''}`}>{t.name}</Link>)}</div>
      <Card title="Progresso das crianças">
        {kids?.length ? (
          <div className="overflow-x-auto">
            <table className="table"><thead><tr><th>Criança</th><th>Estrelas</th><th>Última conquista</th><th>Próxima recompensa</th></tr></thead>
              <tbody>{kids.map((k) => {
                const t = total.get(k.id) ?? 0
                const got = (rewards ?? []).filter((w) => w.points_required <= t).at(-1)
                const next = (rewards ?? []).find((w) => w.points_required > t)
                return <tr key={k.id}><td><Link href={`/criancas/${k.id}`} className="hover:underline">{k.name}</Link></td><td>⭐ {t}</td><td>{got ? `🎁 ${got.name}` : '—'}</td><td>{next ? `${next.name} — faltam ${next.points_required - t}` : '🎉 todas conquistadas'}</td></tr>
              })}</tbody></table>
          </div>
        ) : <Empty>Nenhuma criança nesta turma.</Empty>}
      </Card>
    </>
  )
}
