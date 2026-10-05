import Link from 'next/link'
import { requireProfile, fmtDate } from '@/lib/auth'
import { Card, Empty, btn, field } from '@/lib/ui'
import { addComment } from '../actions'

export default async function Atividades({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { turma } = await searchParams
  const { supabase } = await requireProfile()
  const { data: turmas } = await supabase.from('turmas').select('id,name').eq('is_active', true).order('name')
  const sel = turma ?? turmas?.[0]?.id
  const { data: acts } = sel
    ? await supabase.from('activities').select('id,date,title,description,material_link,bible_verse,activity_comments(id,comment,users(name))').eq('turma_id', sel).order('date', { ascending: false }).limit(20)
    : { data: [] }
  return (
    <>
      <h1 className="text-2xl font-bold">Atividades</h1>
      <div className="flex gap-2">{turmas?.map((t) => (
        <Link key={t.id} href={`/atividades?turma=${t.id}`} className={`px-3 py-1 rounded-full text-sm ${t.id === sel ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>{t.name}</Link>
      ))}</div>
      {acts?.length ? acts.map((a) => {
        const cs = a.activity_comments as unknown as { id: string; comment: string; users: { name: string } | null }[]
        return (
          <Card key={a.id} title={`${fmtDate(a.date)} — ${a.title}`}>
            {a.description && <p className="text-sm mb-1">{a.description}</p>}
            {a.bible_verse && <p className="text-sm italic text-slate-600">📖 {a.bible_verse}</p>}
            {a.material_link && <a href={a.material_link} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 underline">Abrir material ↗</a>}
            <ul className="mt-2 text-sm space-y-1">{cs.map((c) => <li key={c.id}><b>{c.users?.name}:</b> {c.comment}</li>)}</ul>
            <form action={addComment} className="flex gap-2 mt-2">
              <input type="hidden" name="activity_id" value={a.id} />
              <input name="comment" placeholder="Comentar a aula…" className={field} required />
              <button className={btn}>Enviar</button>
            </form>
          </Card>
        )
      }) : <Empty>Nenhuma atividade cadastrada para esta turma.</Empty>}
    </>
  )
}
