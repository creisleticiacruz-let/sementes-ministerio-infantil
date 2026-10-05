import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile, today } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'
import { markPresence } from '../actions'

export default async function Criancas({ searchParams }: { searchParams: Promise<{ turma?: string; data?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  if (profile.role === 'responsavel') redirect('/espaco-responsaveis')
  const date = sp.data ?? today()
  const canMark = profile.role === 'admin' || profile.role === 'professor'
  const { data: turmas } = await supabase.from('turmas').select('id,name').eq('is_active', true).order('name')
  const sel = sp.turma ?? turmas?.[0]?.id
  const month = date.slice(0, 7)
  const next = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 1).toISOString().slice(0, 10)
  const [{ data: kids }, { data: recs }, { data: monthRecs }, { data: rewards }] = await Promise.all([
    sel ? supabase.from('children').select('id,name').eq('turma_id', sel).eq('is_active', true).order('name') : Promise.resolve({ data: [] }),
    supabase.from('presence_records').select('child_id,is_present,bible_star,verse_star,attitude_stars,total_stars').eq('date', date),
    supabase.from('presence_records').select('child_id,total_stars').gte('date', `${month}-01`).lt('date', next),
    supabase.from('rewards').select('id,name,points_required').neq('status', 'inactive').order('points_required'),
  ])
  const byChild = new Map((recs ?? []).map((r) => [r.child_id, r]))
  const monthly = new Map<string, number>()
  ;(monthRecs ?? []).forEach((r) => monthly.set(r.child_id, (monthly.get(r.child_id) ?? 0) + (r.total_stars ?? 0)))
  const ranking = (kids ?? []).map((k) => ({ ...k, stars: monthly.get(k.id) ?? 0 })).sort((a, b) => b.stars - a.stars)
  return (
    <>
      <h1 className="text-2xl font-bold">Crianças</h1>
      <div className="flex gap-2 flex-wrap">{turmas?.map((t) => (
        <Link key={t.id} href={`/criancas?turma=${t.id}&data=${date}`} className={`px-3 py-1 rounded-full text-sm ${t.id === sel ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>{t.name}</Link>
      ))}</div>
      <Card title={`Presença e estrelas — ${date.split('-').reverse().join('/')}`}>
        {kids?.length ? kids.map((k) => {
          const r = byChild.get(k.id)
          return (
            <form key={k.id} action={markPresence} className="flex flex-wrap items-center gap-3 py-2 border-b last:border-0 text-sm">
              <input type="hidden" name="child_id" value={k.id} />
              <input type="hidden" name="date" value={date} />
              <span className="w-40 font-medium">{k.name}</span>
              <label><input type="checkbox" name="present" defaultChecked={r?.is_present} disabled={!canMark} /> Presente</label>
              <label><input type="checkbox" name="bible" defaultChecked={r?.bible_star} disabled={!canMark} /> 📖 Bíblia</label>
              <label><input type="checkbox" name="verse" defaultChecked={r?.verse_star} disabled={!canMark} /> ✝️ Versículo</label>
              <label><input type="checkbox" name="attitude" defaultChecked={(r?.attitude_stars ?? 0) > 0} disabled={!canMark} /> 😊 Boa atitude</label>
              <span className="ml-auto">⭐ {r?.total_stars ?? 0}</span>
              {canMark && <button className="bg-emerald-600 text-white rounded px-3 py-1">Salvar</button>}
            </form>
          )
        }) : <Empty>Nenhuma criança nesta turma.</Empty>}
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Ranking do mês">
          {ranking.length ? <ol className="list-decimal pl-5 text-sm">{ranking.map((k) => <li key={k.id}>{k.name} — ⭐ {k.stars}</li>)}</ol> : <Empty />}
        </Card>
        <Card title="Recompensas">
          {rewards?.length ? <ul className="text-sm">{rewards.map((w) => <li key={w.id}>🎁 {w.name} — {w.points_required} estrelas</li>)}</ul> : <Empty />}
        </Card>
      </div>
    </>
  )
}
