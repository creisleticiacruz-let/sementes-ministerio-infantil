import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Avatar, Card, Empty, PageHead, SeeMore } from '@/lib/ui'
import { DIAS, addDays, fmtLong, fmtShort, isLastSundayOfMonth, isSunday, monthGrid, monthRange, parse, todayBR } from '@/lib/dates'
import { markRead } from '../actions'

type Sc = { function: string; scales: { date: string; description: string | null; teams: { name: string } | null } }

export default async function Dashboard() {
  const { supabase, profile } = await requireProfile()
  const today = todayBR()
  const key = today.slice(0, 7)
  const { start, end } = monthRange(key)
  const guardian = profile.role === 'responsavel'

  const [{ data: notes }, { data: events }, { data: specials }, { data: acts }] = await Promise.all([
    supabase.from('notifications').select('id,message,link,created_at').eq('user_id', profile.id).eq('is_read', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('calendar_events').select('date').gte('date', start).lt('date', end),
    supabase.from('special_dates').select('date').eq('is_active', true).gte('date', start).lt('date', end),
    supabase.from('activities').select('date').gte('date', start).lt('date', end),
  ])
  const marked = new Set([...(events ?? []), ...(specials ?? []), ...(acts ?? [])].map((e) => e.date))
  const [y, m] = key.split('-').map(Number)
  const grid = monthGrid(y, m)
  const total = marked.size

  const head = (
    <PageHead kicker="Painel Inicial" title={`${guardian ? 'Olá' : 'Bem-vindo'}, ${profile.name.split(' ')[0]}! 🌱`} sub={`Hoje é ${fmtLong(today)}`}>
      <Avatar name={profile.name} url={profile.avatar_url} size={44} />
    </PageHead>
  )

  const calendarCard = (
    <Card title="Calendário" action={<SeeMore href="/calendario" />}>
      <div className="subcard">
        <div className="grid grid-cols-7 text-center text-xs text-[var(--muted)] mb-1">{DIAS.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 text-center text-sm gap-y-1">
          {grid.map((d, i) => d ? (
            <span key={i} className={`py-1 rounded relative ${d === today ? 'bg-[var(--primary)] text-white' : isSunday(d) ? 'text-[var(--green)] font-medium' : ''}`}>
              {Number(d.slice(8))}
              {marked.has(d) && d !== today && <i className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full bg-[var(--orange)]" />}
            </span>
          ) : <span key={i} />)}
        </div>
      </div>
      <p className="text-center text-xs text-[var(--muted)] mt-2">{total} {total === 1 ? 'data' : 'datas'} com programação no mês</p>
    </Card>
  )

  const notesCard = (
    <Card title="Notificações" action={<SeeMore href="/notificacoes" />}>
      {notes?.length ? (
        <div className="space-y-2">
          {notes.map((n) => (
            <form key={n.id} action={markRead} className="subcard flex items-start gap-2">
              <input type="hidden" name="id" value={n.id} />
              <span>🔔</span>
              <div className="flex-1 text-sm">{n.link ? <Link href={n.link} className="underline">{n.message}</Link> : n.message}</div>
              <button className="text-xs text-[var(--muted)]" title="Marcar como lida">✓</button>
            </form>
          ))}
        </div>
      ) : <Empty>Sem notificações novas.</Empty>}
    </Card>
  )

  // ---------- Responsável ----------
  if (guardian) {
    const { data: links } = await supabase.from('children_responsaveis').select('children(id,name,photo_url,turma_id,turmas(name))').eq('user_id', profile.id)
    const kids = (links ?? []).map((l) => l.children as unknown as { id: string; name: string; photo_url: string | null; turma_id: string; turmas: { name: string } | null }).filter(Boolean)
    const sunday = isSunday(today) ? today : addDays(today, (7 - parse(today).getDay()) % 7)
    const { data: nextActs } = await supabase.from('activities').select('title,turma_id,bible_verse').eq('date', sunday)
    const { data: sp } = await supabase.from('special_dates').select('title').eq('date', sunday).eq('is_active', true)
    const tomorrowIsSunday = isSunday(addDays(today, 1))
    const { data: stars } = kids.length ? await supabase.from('presence_records').select('child_id,total_stars').in('child_id', kids.map((k) => k.id)) : { data: [] }
    return (
      <>
        {head}
        {(tomorrowIsSunday || isSunday(today)) && (
          <div className="card bg-[var(--green-soft)] border-[#86efac]">
            <p className="font-semibold text-[#166534]">🌱 {isSunday(today) ? 'Hoje tem Sementes!' : 'Amanhã tem Sementes!'}</p>
            {sp?.map((x, i) => <p key={i} className="text-sm">🎉 {x.title}</p>)}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Próxima aula" className="md:col-span-1">
            <p className="text-sm font-medium mb-2">Domingo, {fmtShort(sunday)}</p>
            {kids.length ? kids.map((k) => {
              const a = nextActs?.find((x) => x.turma_id === k.turma_id)
              return <div key={k.id} className="subcard mb-2 text-sm"><b>{k.name}</b> · {k.turmas?.name}<br /><span className="text-[var(--muted)]">{a ? `Tema: ${a.title}` : 'Tema ainda não definido'}</span></div>
            }) : <Empty>Nenhuma criança vinculada à sua conta.</Empty>}
          </Card>
          <Card title="Minhas sementes" className="md:col-span-1" action={<SeeMore href="/espaco-responsaveis" />}>
            {kids.length ? kids.map((k) => (
              <Link key={k.id} href={`/espaco-responsaveis?crianca=${k.id}`} className="subcard flex items-center gap-3 mb-2">
                <Avatar name={k.name} url={k.photo_url} size={36} />
                <div className="flex-1"><p className="text-sm font-medium">{k.name}</p><p className="text-xs text-[var(--muted)]">{k.turmas?.name}</p></div>
                <span>⭐ {(stars ?? []).filter((s) => s.child_id === k.id).reduce((a, s) => a + (s.total_stars ?? 0), 0)}</span>
              </Link>
            )) : <Empty />}
          </Card>
          {notesCard}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {calendarCard}
          <Card title="Acesso rápido">
            <div className="grid grid-cols-3 gap-2">
              {[['/espaco-responsaveis', '🌱', 'Minha Semente'], ['/fotos', '📸', 'Fotos'], ['/calendario', '📅', 'Calendário'], ['/playlist', '🎵', 'Playlist'], ['/aniversarios', '🎂', 'Aniversários'], ['/espaco-responsaveis#ofertar', '❤️', 'Quero Ofertar']].map(([h, i, l]) => (
                <Link key={h} href={h} className="tile"><span className="tile-icon">{i}</span>{l}</Link>
              ))}
            </div>
          </Card>
        </div>
      </>
    )
  }

  // ---------- Equipe ----------
  const { data: mine } = await supabase.from('scale_assignments').select('function, scales!inner(date, description, teams(name))')
    .eq('user_id', profile.id).gte('scales.date', today).order('date', { referencedTable: 'scales' }).limit(4)
  const list = (mine ?? []) as unknown as Sc[]
  const next = list[0]
  const tiles = [
    ['/minha-escala', '📅', 'Escala'], ['/calendario', '🗓️', 'Calendário'], ['/notificacoes', '🔔', 'Notificações'], ['/configuracoes', '👤', 'Perfil'],
    ['/atividades', '📚', 'Atividades'], ['/criancas', '⭐', 'Crianças'], ['/playlist', '🎵', 'Playlist'], ['/fotos', '📸', 'Fotos'],
  ]
  return (
    <>
      {head}
      {isLastSundayOfMonth(today) && (
        <Link href="/criancas/ranking" className="card bg-[#fef3c7] border-[#fcd34d] block">
          <p className="font-semibold">🏆 Hoje é a última aula do mês — veja o Ranking Sementes!</p>
        </Link>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Próxima Escala" action={<SeeMore href="/minha-escala" />}>
          {next ? (
            <>
              <div className="subcard space-y-1 text-sm">
                <p className="flex justify-between"><span className="text-[var(--muted)]">Data</span><b>{fmtShort(next.scales.date)}</b></p>
                <p className="flex justify-between"><span className="text-[var(--muted)]">Equipe</span><b>{next.scales.teams?.name}</b></p>
                <p className="flex justify-between"><span className="text-[var(--muted)]">Função</span><b>{next.function}</b></p>
              </div>
              <Link href="/minha-escala" className="btn w-full mt-2">Ver todas as escalas</Link>
            </>
          ) : <Empty>Você não está escalado(a) nos próximos domingos.</Empty>}
        </Card>
        {notesCard}
        {calendarCard}
      </div>
      <Card title="Acesso Rápido">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map(([h, i, l]) => <Link key={h} href={h} className="tile"><span className="tile-icon">{i}</span>{l}</Link>)}
        </div>
      </Card>
    </>
  )
}
