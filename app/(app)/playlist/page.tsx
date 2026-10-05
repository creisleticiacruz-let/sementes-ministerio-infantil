import { requireProfile } from '@/lib/auth'
import { Card, Empty, btn, field } from '@/lib/ui'
import { addSong, setSongTone } from '../actions'

export default async function Playlist() {
  const { supabase, profile } = await requireProfile()
  const { data: songs } = await supabase.from('songs').select('id,title,artist,link,tone').eq('is_active', true).order('title')
  const canEdit = profile.role !== 'responsavel'
  return (
    <>
      <h1 className="text-2xl font-bold">Playlist</h1>
      {canEdit && (
        <Card title="Adicionar música">
          <form action={addSong} className="grid sm:grid-cols-5 gap-2">
            <input name="title" placeholder="Título" required className={field} />
            <input name="artist" placeholder="Artista" className={field} />
            <input name="link" type="url" placeholder="Link" required className={field} />
            <input name="tone" placeholder="Tom (ex.: G)" className={field} />
            <button className={btn}>Adicionar</button>
          </form>
        </Card>
      )}
      <Card>
        {songs?.length ? (
          <ul className="divide-y">
            {songs.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                  {s.title}{s.artist ? ` — ${s.artist}` : ''}
                </a>
                {canEdit ? (
                  <form action={setSongTone} className="flex gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="tone" defaultValue={s.tone ?? ''} placeholder="Tom" className="border rounded px-2 py-1 w-16 text-center" />
                    <button className="text-xs text-slate-500">salvar</button>
                  </form>
                ) : <span>{s.tone}</span>}
              </li>
            ))}
          </ul>
        ) : <Empty>Nenhuma música ainda.</Empty>}
      </Card>
    </>
  )
}
