import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import Uploader from '@/components/Uploader'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { allTurmas, manageableTurmas } from '@/lib/turmas'
import { fmtBR } from '@/lib/dates'
import { addPhoto, deletePhoto, togglePhoto } from '../actions'

export default async function Fotos({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const turmas = await allTurmas(supabase)
  const canUpload = await manageableTurmas(supabase, profile)
  const isAdmin = profile.role === 'admin'
  let q = supabase.from('photos').select('id,title,photo_url,is_visible,created_at,turmas(name)').order('created_at', { ascending: false }).limit(120)
  if (sp.turma) q = q.eq('turma_id', sp.turma)
  const { data } = await q
  const byDay = new Map<string, NonNullable<typeof data>>()
  ;(data ?? []).forEach((p) => {
    const day = new Date(p.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    byDay.set(day, [...(byDay.get(day) ?? []), p])
  })

  return (
    <>
      <PageHead kicker="Momentos do Ministério" title="📸 Fotos">
        <Link href="/fotos" className={`btn btn-sm ${!sp.turma ? 'btn-primary' : ''}`}>Todas</Link>
        {turmas.map((t) => <Link key={t.id} href={`/fotos?turma=${t.id}`} className={`btn btn-sm ${sp.turma === t.id ? 'btn-primary' : ''}`}>{t.name}</Link>)}
      </PageHead>
      {canUpload.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-medium text-sm">➕ Anexar foto</summary>
          <form action={addPhoto} className="grid sm:grid-cols-3 gap-3 mt-3 items-end">
            <Field label="Foto"><Uploader name="photo_url" folder="fotos" label="Escolher foto" /></Field>
            <Field label="Turma"><select name="turma_id" className="input">{canUpload.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            <Field label="Aula ou evento"><input name="title" className="input" placeholder="Ex.: Dia das Crianças" /></Field>
            <button className="btn btn-primary sm:col-span-3">Publicar foto</button>
          </form>
        </details>
      )}
      {byDay.size ? [...byDay.entries()].map(([day, photos]) => (
        <Card key={day} title={fmtBR(day)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className={`space-y-1 ${!p.is_visible ? 'opacity-50' : ''}`}>
                <a href={p.photo_url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo_url} alt={p.title ?? 'Foto do Sementes'} loading="lazy" className="w-full aspect-square object-cover rounded-lg border border-[var(--line)]" />
                </a>
                <p className="text-xs text-[var(--muted)] truncate">{p.title ?? 'Sem título'} · {(p.turmas as unknown as { name: string } | null)?.name}</p>
                <div className="flex gap-1 flex-wrap">
                  <a href={`${p.photo_url}?download=foto-sementes.jpg`} className="btn btn-sm">⬇ Baixar</a>
                  {isAdmin && (
                    <>
                      <form action={togglePhoto}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="visible" value={p.is_visible ? '0' : '1'} /><button className="btn btn-sm">{p.is_visible ? 'Ocultar' : 'Mostrar'}</button></form>
                      <form action={deletePhoto}><input type="hidden" name="id" value={p.id} /><ConfirmButton message="Excluir esta foto?">🗑</ConfirmButton></form>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )) : <Card><Empty>Nenhuma foto publicada ainda.</Empty></Card>}
    </>
  )
}
