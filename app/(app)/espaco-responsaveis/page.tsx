import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import ChildHistory from '@/components/ChildHistory'
import CopyButton from '@/components/CopyButton'
import { Avatar, Card, Empty, PageHead } from '@/lib/ui'
import { addDays, fmtLong, isSunday, parse, todayBR } from '@/lib/dates'

type Kid = { id: string; name: string; photo_url: string | null; turma_id: string; turmas: { name: string } | null }

export default async function EspacoResponsaveis({ searchParams }: { searchParams: Promise<{ crianca?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const today = todayBR()
  const sunday = isSunday(today) ? today : addDays(today, (7 - parse(today).getDay()) % 7)

  const [{ data: links }, { data: songs }, { data: pix }, { data: photos }, { data: acts }, { data: sp2 }] = await Promise.all([
    supabase.from('children_responsaveis').select('children(id,name,photo_url,turma_id,turmas(name))').eq('user_id', profile.id),
    supabase.from('songs').select('id,title,artist,link').eq('is_active', true).order('title').limit(4),
    supabase.from('offering_settings').select('church_name,pix_key,pix_qr_code_url,description').eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('photos').select('id,photo_url,title').eq('is_visible', true).order('created_at', { ascending: false }).limit(4),
    supabase.from('activities').select('title,turma_id,bible_verse').eq('date', sunday),
    supabase.from('special_dates').select('title').eq('date', sunday).eq('is_active', true),
  ])
  const kids = (links ?? []).map((l) => l.children as unknown as Kid).filter(Boolean)
  const selected = kids.find((k) => k.id === sp.crianca) ?? kids[0]
  const { data: last } = kids.length ? await supabase.from('presence_records').select('child_id,is_present,date').in('child_id', kids.map((k) => k.id)).order('date', { ascending: false }) : { data: [] }
  const status = (id: string) => (last ?? []).find((r) => r.child_id === id)

  return (
    <>
      <PageHead kicker="Área exclusiva" title="Espaço dos Responsáveis" sub="Sua semente é nossa alegria 🌱">
        <Link href="/notificacoes" className="btn">🔔 Notificações</Link>
      </PageHead>
      {profile.role === 'admin' && !kids.length && <Card><Empty>Visualização do administrador: nenhuma criança vinculada à sua conta. Vincule responsáveis em Administração → Crianças.</Empty></Card>}
      {profile.role === 'responsavel' && !kids.length && <Card><Empty>Nenhuma criança vinculada à sua conta ainda. Fale com a liderança do Ministério Infantil.</Empty></Card>}

      <div className="grid md:grid-cols-3 gap-4">
        {kids.map((k) => {
          const st = status(k.id)
          return (
            <Card key={k.id} className={k.id === selected?.id ? 'border-[var(--primary)]' : ''}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={k.name} url={k.photo_url} size={48} />
                <div className="flex-1"><p className="font-semibold">{k.name}</p><p className="text-xs text-[var(--muted)]">Turma {k.turmas?.name}</p></div>
                {st && <span className={`badge ${st.is_present ? 'badge-green' : ''}`}>{st.is_present ? 'Presente' : 'Ausente'}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/espaco-responsaveis?crianca=${k.id}`} className="btn btn-primary btn-sm">🌱 Minha Semente</Link>
                <Link href="/fotos" className="btn btn-sm">📸 Fotos</Link>
                <Link href="/playlist" className="btn btn-sm">🎵 Playlist</Link>
                <Link href="/espaco-responsaveis#ofertar" className="btn btn-sm">❤️ Ofertar</Link>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          {selected && <div><h2 className="font-semibold mb-2">🌱 Minha Semente — {selected.name}</h2><ChildHistory supabase={supabase} childId={selected.id} /></div>}
          <Card title="Fotos recentes" action={<Link href="/fotos" className="btn btn-sm">Ver galeria</Link>}>
            {photos?.length ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{photos.map((p) => (
              <a key={p.id} href={p.photo_url} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.photo_url} alt={p.title ?? 'Foto'} className="w-full aspect-square object-cover rounded-lg border" /></a>
            ))}</div> : <Empty>Ainda não há fotos.</Empty>}
          </Card>
          <Card title="🎵 Playlist dos filhos" action={<Link href="/playlist" className="btn btn-sm">Abrir playlist</Link>}>
            {songs?.length ? songs.map((s) => (
              <a key={s.id} href={s.link} target="_blank" rel="noopener noreferrer" className="subcard flex items-center gap-3 mb-2"><span>▶</span><span className="flex-1">{s.title}{s.artist && <span className="text-xs text-[var(--muted)]"> — {s.artist}</span>}</span><span className="text-[var(--muted)]">↗</span></a>
            )) : <Empty />}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Próxima aula">
            <p className="text-sm font-medium capitalize mb-2">{fmtLong(sunday)}</p>
            {kids.map((k) => { const a = acts?.find((x) => x.turma_id === k.turma_id); return <div key={k.id} className="subcard mb-2 text-sm"><b>{k.name}</b><br /><span className="text-[var(--muted)]">{a ? `Tema: ${a.title}` : 'Tema a definir'}</span>{a?.bible_verse && <p className="text-xs">📖 {a.bible_verse}</p>}</div> })}
            {sp2?.map((x, i) => <p key={i} className="text-sm">🎉 {x.title}</p>)}
          </Card>
          <section id="ofertar" className="card scroll-mt-20">
            <div className="flex justify-between mb-2"><h2 className="card-title">❤️ Quero Ofertar</h2><span className="badge">PIX</span></div>
            {pix ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-[var(--muted)]">Você pode contribuir com o Ministério Infantil Sementes. Toda semente plantada faz diferença!</p>
                {pix.church_name && <p className="font-medium">{pix.church_name}</p>}
                <div className="subcard"><p className="text-xs text-[var(--muted)]">Chave PIX</p><p className="font-mono break-all select-all">{pix.pix_key}</p><div className="mt-2"><CopyButton text={pix.pix_key} /></div></div>
                {pix.pix_qr_code_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={pix.pix_qr_code_url} alt="QR Code do PIX" className="mx-auto w-44 h-44 object-contain border rounded-lg bg-white" />}
                {pix.description && <p className="text-xs text-[var(--muted)]">{pix.description}</p>}
              </div>
            ) : <Empty>A chave PIX ainda não foi cadastrada pela liderança.</Empty>}
          </section>
        </div>
      </div>
    </>
  )
}
