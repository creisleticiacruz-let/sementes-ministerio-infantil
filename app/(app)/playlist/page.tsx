import { requireProfile } from '@/lib/auth'
import AutoSelect from '@/components/AutoSelect'
import ConfirmButton from '@/components/ConfirmButton'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { removeSong, saveSong, setSongTone } from '../actions'

const TONS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm']

export default async function Playlist({ searchParams }: { searchParams: Promise<{ q?: string; editar?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const canEdit = profile.role !== 'responsavel'
  const { data } = await supabase.from('songs').select('id,title,artist,link,tone,notes').eq('is_active', true).order('title')
  const songs = (data ?? []).filter((s) => !sp.q || `${s.title} ${s.artist ?? ''}`.toLowerCase().includes(sp.q.toLowerCase()))
  const editing = (data ?? []).find((s) => s.id === sp.editar)

  return (
    <>
      <PageHead kicker="Playlist / Louvor Infantil" title={canEdit ? 'Gerenciar Músicas' : 'Playlist'} />
      {canEdit && (
        <details className="card" open={!!editing}>
          <summary className="btn btn-primary w-fit cursor-pointer list-none">{editing ? '✏️ Editando música' : '+ Adicionar música'}</summary>
          <form action={saveSong} className="grid sm:grid-cols-3 gap-3 mt-3" key={editing?.id ?? 'new'}>
            <input type="hidden" name="id" value={editing?.id ?? ''} />
            <Field label="Nome da música"><input name="title" required defaultValue={editing?.title} className="input" placeholder="Ex.: Caminho no Deserto" /></Field>
            <Field label="Link"><input name="link" type="url" required defaultValue={editing?.link} className="input" placeholder="https://youtube.com/watch?v=…" /></Field>
            <Field label="Tom">
              <select name="tone" defaultValue={editing?.tone ?? ''} className="input"><option value="">Selecione o tom</option>{TONS.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Artista / ministério"><input name="artist" defaultValue={editing?.artist ?? ''} className="input" /></Field>
            <div className="sm:col-span-2"><Field label="Observações"><input name="notes" defaultValue={editing?.notes ?? ''} className="input" /></Field></div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <a href="/playlist" className="btn">Cancelar</a>
              <button className="btn btn-primary">Salvar Música</button>
            </div>
          </form>
        </details>
      )}
      <Card title="Músicas da Playlist" action={
        <form className="flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Buscar música" className="input w-40" /><button className="btn">Filtrar</button></form>}>
        {songs.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Música</th><th>Link</th><th>Tom</th>{canEdit && <th className="text-right">Ações</th>}</tr></thead>
              <tbody>
                {songs.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.title}</b>{s.artist && <span className="text-[var(--muted)]"> — {s.artist}</span>}{s.notes && <p className="text-xs text-[var(--muted)]">{s.notes}</p>}</td>
                    <td><a href={s.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Abrir Link ↗</a></td>
                    <td>
                      {canEdit ? (
                        <form action={setSongTone} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={s.id} />
                          <select name="tone" defaultValue={s.tone ?? ''} className="input w-20 py-1"><option value="">—</option>{TONS.map((t) => <option key={t}>{t}</option>)}</select>
                          <button className="btn btn-sm">Alterar</button>
                        </form>
                      ) : (s.tone ?? '—')}
                    </td>
                    {canEdit && (
                      <td className="text-right whitespace-nowrap">
                        <a href={`/playlist?editar=${s.id}`} className="btn btn-sm">Editar</a>{' '}
                        <form action={removeSong} className="inline"><input type="hidden" name="id" value={s.id} />
                          <ConfirmButton message={`Remover "${s.title}" da playlist?`}>Remover</ConfirmButton></form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Nenhuma música encontrada.</Empty>}
      </Card>
    </>
  )
}
