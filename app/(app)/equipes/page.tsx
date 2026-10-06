import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Avatar, Card, Empty, PageHead } from '@/lib/ui'
import { fmtBR, todayBR } from '@/lib/dates'

type Assign = { function: string; users: { name: string } | null }
type Scale = { id: string; date: string; description: string | null; scale_assignments: Assign[] }

export default async function Equipes({ searchParams }: { searchParams: Promise<{ equipe?: string; completa?: string }> }) {
  const sp = await searchParams
  const { supabase, profile } = await requireProfile()
  const today = todayBR()
  const [{ data: teams }, { data: allMembers }] = await Promise.all([
    supabase.from('teams').select('id,name,description').eq('is_active', true).order('name'),
    supabase.from('team_members').select('team_id,role,users(id,name,avatar_url)'),
  ])
  const list = teams ?? []
  const sel = list.find((t) => t.id === sp.equipe) ?? list[0]
  const members = (allMembers ?? []).filter((m) => m.team_id === sel?.id) as unknown as { role: string; users: { id: string; name: string; avatar_url: string | null } | null }[]
  const count = (id: string) => new Set((allMembers ?? []).filter((m) => m.team_id === id).map((m) => (m.users as unknown as { id: string } | null)?.id)).size

  let scales: Scale[] = []
  let snacks: { id: string; name: string }[] = []
  if (sel) {
    const q = supabase.from('scales').select('id,date,description,scale_assignments(function,users(name))').eq('team_id', sel.id).order('date')
    const { data } = sp.completa ? await q.limit(60) : await q.gte('date', today).limit(8)
    scales = (data ?? []) as unknown as Scale[]
    if (sel.name === 'Lanche') {
      const { data: s } = await supabase.from('snack_suggestions').select('id,name').eq('is_active', true).order('name')
      snacks = s ?? []
    }
  }
  const isTurma = sel && ['Baby', '4 a 7', '8 a 11'].includes(sel.name)

  return (
    <>
      <PageHead kicker="Ministério" title="Equipes">
        {profile.role === 'admin' && <Link href="/admin/equipes" className="btn btn-primary">Nova Equipe</Link>}
      </PageHead>
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card title="Lista de Equipes" action={<span className="badge">{list.length} equipes</span>}>
          <div className="space-y-2">
            {list.map((t) => (
              <Link key={t.id} href={`/equipes?equipe=${t.id}`} className={`subcard flex items-center gap-3 ${t.id === sel?.id ? 'border-[var(--primary)] bg-white' : ''}`}>
                <span className="tile-icon">{t.name === 'Lanche' ? '🍞' : t.name === 'Louvor' ? '🎵' : t.name === 'Direção' ? '🧭' : '🌱'}</span>
                <div><p className="font-medium">{t.name}</p><p className="text-xs text-[var(--muted)]">{count(t.id)} membros</p></div>
              </Link>
            ))}
          </div>
        </Card>
        {sel ? (
          <div className="space-y-4">
            <PageHead kicker="Equipe selecionada" title={sel.name} sub={sel.description ?? undefined}>
              {profile.role === 'admin' && <Link href="/admin/equipes" className="btn">Editar</Link>}
              <Link href={`/equipes?equipe=${sel.id}${sp.completa ? '' : '&completa=1'}`} className="btn btn-primary">{sp.completa ? 'Ver próximas' : 'Ver Escala Completa'}</Link>
            </PageHead>
            <Card title={sp.completa ? 'Escala completa' : 'Escala da Equipe — próximos domingos'}>
              {scales.length ? (
                <div className="overflow-x-auto">
                  <table className="table"><thead><tr><th>Domingo</th><th>Escalados</th></tr></thead>
                    <tbody>{scales.map((s) => (
                      <tr key={s.id}>
                        <td className="whitespace-nowrap font-medium">{fmtBR(s.date)}{s.date < today && <span className="badge ml-2">passado</span>}</td>
                        <td>{s.scale_assignments.length ? s.scale_assignments.map((a, i) => <span key={i} className="inline-block mr-3"><span className="text-[var(--muted)]">{a.function}:</span> <b>{a.users?.name}</b></span>) : <span className="text-[var(--muted)]">Ninguém escalado ainda</span>}
                          {s.description && <p className="text-xs text-[var(--muted)]">{s.description}</p>}</td>
                      </tr>))}</tbody></table>
                </div>
              ) : <Empty>Nenhuma escala cadastrada para esta equipe.</Empty>}
            </Card>
            <Card title="Membros da Equipe" action={<span className="badge">{members.length} membros</span>}>
              {members.length ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {members.map((m, i) => (
                    <div key={i} className="subcard flex items-center gap-3 bg-white">
                      <Avatar name={m.users?.name ?? '?'} url={m.users?.avatar_url} size={34} />
                      <div><p className="font-medium text-sm">{m.users?.name}</p><p className="text-xs text-[var(--muted)] capitalize">{m.role.replace('_', ' ')}</p></div>
                    </div>
                  ))}
                </div>
              ) : <Empty>Nenhum membro cadastrado.</Empty>}
            </Card>
            {sel.name === 'Lanche' && (
              <Card title="🍞 Sugestões de Lanche">
                <div className="flex flex-wrap gap-2">{snacks.map((s) => <span key={s.id} className="badge badge-green text-sm py-1">{s.name}</span>)}</div>
                {!snacks.length && <Empty />}
              </Card>
            )}
            {sel.name === 'Louvor' && <Link href="/playlist" className="btn w-full">🎵 Abrir Playlist do Louvor</Link>}
            {isTurma && <Link href="/atividades" className="btn w-full">📚 Ver atividades da turma</Link>}
          </div>
        ) : <Card><Empty>Nenhuma equipe cadastrada.</Empty></Card>}
      </div>
    </>
  )
}
