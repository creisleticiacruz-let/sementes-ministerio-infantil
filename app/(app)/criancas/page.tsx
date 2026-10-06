import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import AttendanceSheet, { type Kid } from '@/components/AttendanceSheet'
import AutoSelect from '@/components/AutoSelect'
import { Card, Empty, PageHead } from '@/lib/ui'
import { allTurmas, manageableTurmas } from '@/lib/turmas'
import { fmtBR, isLastSundayOfMonth, monthRange, todayBR } from '@/lib/dates'

export default async function Criancas({ searchParams }: { searchParams: Promise<{ turma?: string; data?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  if (profile.role === 'responsavel') redirect('/espaco-responsaveis')
  const date = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : todayBR()
  const turmas = await allTurmas(supabase)
  const mine = await manageableTurmas(supabase, profile)
  const sel = turmas.find((t) => t.id === sp.turma)?.id ?? mine[0]?.id ?? turmas[0]?.id
  const canEdit = mine.some((t) => t.id === sel)
  const { start, end } = monthRange(date.slice(0, 7))

  const { data: kidsRaw } = sel ? await supabase.from('children').select('id,name,photo_url').eq('turma_id', sel).eq('is_active', true).order('name') : { data: [] }
  const ids = (kidsRaw ?? []).map((k) => k.id)
  const [{ data: day }, { data: month }, { data: rewards }] = await Promise.all([
    ids.length ? supabase.from('presence_records').select('child_id,is_present,bible_stars,verse_stars,attitude_stars,extra_stars').eq('date', date).in('child_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from('presence_records').select('child_id,total_stars').gte('date', start).lt('date', end).in('child_id', ids) : Promise.resolve({ data: [] }),
    supabase.from('rewards').select('id,name,points_required').neq('status', 'inactive').order('points_required'),
  ])
  const rec = new Map((day ?? []).map((r) => [r.child_id, r]))
  const initial: Kid[] = (kidsRaw ?? []).map((k) => {
    const r = rec.get(k.id)
    return { id: k.id, name: k.name, photo_url: k.photo_url, present: r?.is_present ?? false, bible: r?.bible_stars ?? 0, verse: r?.verse_stars ?? 0, attitude: (r?.attitude_stars ?? 0) + (r?.extra_stars ?? 0) }
  })
  const monthly = new Map<string, number>()
  ;(month ?? []).forEach((r) => monthly.set(r.child_id, (monthly.get(r.child_id) ?? 0) + (r.total_stars ?? 0)))
  const top = (kidsRaw ?? []).map((k) => ({ ...k, stars: monthly.get(k.id) ?? 0 })).sort((a, b) => b.stars - a.stars).slice(0, 3)
  const turmaName = turmas.find((t) => t.id === sel)?.name

  const aside = (
    <>
      <Card title="Top do Mês" action={<Link href={`/criancas/ranking?turma=${sel}`} className="btn btn-sm">Ver ranking</Link>}>
        {top.some((t) => t.stars > 0) ? top.map((t, i) => (
          <div key={t.id} className="subcard flex items-center gap-2 mb-2"><span className="badge">{i + 1}</span><span className="flex-1">{t.name}</span><span>⭐ {t.stars}</span></div>
        )) : <Empty>Sem estrelas neste mês ainda.</Empty>}
      </Card>
      <Card title="Recompensas" action={<Link href="/criancas/recompensas" className="btn btn-sm">Ver tudo</Link>}>
        {rewards?.length ? rewards.slice(0, 5).map((r) => (
          <div key={r.id} className="subcard flex justify-between mb-2"><span>🎁 {r.name}</span><span>{r.points_required} ⭐</span></div>
        )) : <Empty>Nenhuma recompensa cadastrada.</Empty>}
      </Card>
    </>
  )

  return (
    <>
      <PageHead kicker="Ministério Infantil Sementes" title="Crianças" sub={`Presença, estrelas, ranking e recompensas — aula de ${fmtBR(date)}${turmaName ? ` · ${turmaName}` : ''}`}>
        <AutoSelect value={`/criancas?turma=${sel}&data=${date}`} options={turmas.map((t) => ({ value: `/criancas?turma=${t.id}&data=${date}`, label: t.name }))} />
        <form className="flex gap-1"><input type="hidden" name="turma" value={sel} /><input type="date" name="data" defaultValue={date} className="input w-auto" /><button className="btn">Ir</button></form>
        <Link href={`/criancas/ranking?turma=${sel}`} className="btn">Ranking Mensal</Link>
        <Link href="/criancas/recompensas" className="btn">Recompensas</Link>
      </PageHead>
      {isLastSundayOfMonth(date) && (
        <Link href={`/criancas/ranking?turma=${sel}`} className="card bg-[#fef3c7] border-[#fcd34d] block font-medium">🏆 Última aula do mês! Abra o Ranking Sementes e celebre com as crianças.</Link>
      )}
      <AttendanceSheet key={`${sel}-${date}`} date={date} initial={initial} canEdit={canEdit} isAdmin={profile.role === 'admin'} aside={aside} />
    </>
  )
}
