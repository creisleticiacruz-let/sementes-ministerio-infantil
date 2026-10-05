import { requireProfile, fmtDate } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'

export default async function EspacoResponsaveis() {
  const { supabase, profile } = await requireProfile()
  const [{ data: links }, { data: photos }, { data: pix }, { data: songs }] = await Promise.all([
    supabase.from('children_responsaveis').select('children(id,name,turmas(name))').eq('user_id', profile.id),
    supabase.from('photos').select('id,title,photo_url').eq('is_visible', true).order('created_at', { ascending: false }).limit(12),
    supabase.from('offering_settings').select('church_name,pix_key,description').eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('songs').select('id,title,link').eq('is_active', true).order('title').limit(15),
  ])
  const kids = (links ?? []).map((l) => l.children as unknown as { id: string; name: string; turmas: { name: string } | null }).filter(Boolean)
  const ids = kids.map((k) => k.id)
  const { data: stars } = ids.length ? await supabase.from('presence_records').select('child_id,total_stars,date').in('child_id', ids) : { data: [] }
  return (
    <>
      <h1 className="text-2xl font-bold">Espaço dos responsáveis</h1>
      <Card title="Minhas sementes">
        {kids.length ? kids.map((k) => {
          const rs = (stars ?? []).filter((s) => s.child_id === k.id)
          return <p key={k.id} className="text-sm py-1"><b>{k.name}</b> · {k.turmas?.name} · ⭐ {rs.reduce((a, r) => a + (r.total_stars ?? 0), 0)} estrelas · {rs.length} presenças{rs.length ? ` (última: ${fmtDate(rs.map((r) => r.date).sort().at(-1)!)})` : ''}</p>
        }) : <Empty>Nenhuma criança vinculada à sua conta. Fale com a liderança.</Empty>}
      </Card>
      <Card title="Fotos">
        {photos?.length ? <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.photo_url} alt={p.title ?? 'Foto'} className="rounded-lg aspect-square object-cover" />
        ))}</div> : <Empty />}
      </Card>
      <Card title="Playlist">
        {songs?.length ? <ul className="text-sm">{songs.map((s) => <li key={s.id}><a className="text-emerald-700 underline" href={s.link} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul> : <Empty />}
      </Card>
      <Card title="Quero ofertar">
        {pix ? <div className="text-sm"><p>{pix.church_name}</p><p className="font-mono bg-slate-100 rounded px-2 py-1 inline-block my-1 select-all">{pix.pix_key}</p><p className="text-slate-500">{pix.description}</p></div> : <Empty>Chave PIX ainda não configurada.</Empty>}
      </Card>
    </>
  )
}
