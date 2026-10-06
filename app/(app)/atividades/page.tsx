import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import AutoSelect from '@/components/AutoSelect'
import Uploader from '@/components/Uploader'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { allTurmas, manageableTurmas } from '@/lib/turmas'
import { fmtBR, todayBR } from '@/lib/dates'
import { addComment, saveActivity } from '../actions'

const kind = (a: { material_link: string | null; description: string | null }) =>
  a.material_link ? (/supabase\.co\/storage|\.(pdf|docx?|pptx?|xlsx?|png|jpe?g)$/i.test(a.material_link) ? 'Material' : 'Link') : 'Observação'

export default async function Atividades({ searchParams }: { searchParams: Promise<{ turma?: string; aula?: string; tipo?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const turmas = await allTurmas(supabase)
  const canCreate = await manageableTurmas(supabase, profile)
  const sel = turmas.find((t) => t.id === sp.turma)?.id ?? turmas[0]?.id
  const { data: acts } = sel
    ? await supabase.from('activities').select('id,date,title,description,material_link,bible_verse').eq('turma_id', sel).order('date', { ascending: false }).limit(30)
    : { data: [] }
  const filtered = (acts ?? []).filter((a) => !sp.tipo || kind(a).toLowerCase() === sp.tipo)
  const current = (acts ?? []).find((a) => a.id === sp.aula) ?? filtered[0]
  const { data: comments } = current
    ? await supabase.from('activity_comments').select('id,comment,created_at,users(name)').eq('activity_id', current.id).order('created_at', { ascending: false })
    : { data: [] }
  const base = `/atividades?turma=${sel}`
  const canHere = canCreate.some((t) => t.id === sel)
  const chip = (t: string | undefined, l: string) => <Link href={t ? `${base}&tipo=${t}` : base} className={`btn btn-sm ${sp.tipo === t || (!sp.tipo && !t) ? 'btn-primary' : ''}`}>{l}</Link>

  return (
    <>
      <PageHead kicker="Materiais, links e observações das aulas" title="Atividades">
        <span className="text-xs text-[var(--muted)]">Turma</span>
        <AutoSelect value={`/atividades?turma=${sel}`} options={turmas.map((t) => ({ value: `/atividades?turma=${t.id}`, label: t.name }))} />
      </PageHead>

      {canHere && (
        <details className="card">
          <summary className="cursor-pointer font-medium text-sm">➕ Nova atividade para esta turma</summary>
          <form action={saveActivity} className="grid sm:grid-cols-2 gap-3 mt-3">
            <input type="hidden" name="turma_id" value={sel} />
            <Field label="Nome da atividade"><input name="title" required className="input" placeholder="Ex.: A Arca de Noé" /></Field>
            <Field label="Data da aula"><input name="date" type="date" required defaultValue={todayBR()} className="input" /></Field>
            <Field label="Link do material"><input name="material_link" type="url" className="input" placeholder="https://…" /></Field>
            <Field label="…ou envie um arquivo"><Uploader name="material_file" folder="materiais" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" label="Escolher arquivo" /></Field>
            <Field label="Versículo"><input name="bible_verse" className="input" /></Field>
            <Field label="Descrição / observações"><textarea name="description" rows={2} className="input" /></Field>
            <button className="btn btn-primary sm:col-span-2">Salvar atividade</button>
          </form>
        </details>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <Card title="Lista de Atividades" action={<div className="flex gap-1">{chip(undefined, 'Todas')}{chip('material', 'Materiais')}{chip('link', 'Links')}</div>}>
          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className={`subcard ${a.id === current?.id ? 'border-[var(--primary)]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`${base}&aula=${a.id}`} className="font-medium">{a.title} <span className="badge ml-1">{kind(a)}</span></Link>
                    <span className="text-xs text-[var(--muted)] whitespace-nowrap">{fmtBR(a.date).slice(0, 5)}</span>
                  </div>
                  {a.description && <p className="text-sm text-[var(--muted)] mt-1">{a.description}</p>}
                  {a.bible_verse && <p className="text-sm mt-1">📖 {a.bible_verse}</p>}
                  {a.material_link && <a href={a.material_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-2">Abrir Material ↗</a>}
                </div>
              ))}
            </div>
          ) : <Empty>Nenhuma atividade cadastrada para esta turma.</Empty>}
        </Card>

        <Card title="Comentários da Aula" action={current && <span className="badge">{current.title}</span>}>
          {current ? (
            <>
              <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
                {comments?.length ? comments.map((c) => (
                  <div key={c.id} className="subcard text-sm">
                    <div className="flex justify-between text-xs text-[var(--muted)]"><b className="text-[var(--ink)]">{(c.users as unknown as { name: string } | null)?.name}</b>
                      <span>{new Date(c.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
                    <p className="mt-1">{c.comment}</p>
                  </div>
                )) : <Empty>Sem comentários nesta aula.</Empty>}
              </div>
              {profile.role !== 'responsavel' && (
                <form action={addComment} className="subcard space-y-2">
                  <input type="hidden" name="activity_id" value={current.id} />
                  <input type="hidden" name="turma_id" value={sel} />
                  <span className="label">Novo Comentário</span>
                  <textarea name="comment" required rows={3} placeholder="Escreva um comentário sobre a aula" className="input bg-white" />
                  <button className="btn btn-primary w-full">Comentar</button>
                </form>
              )}
            </>
          ) : <Empty>Selecione uma atividade.</Empty>}
        </Card>
      </div>
    </>
  )
}
