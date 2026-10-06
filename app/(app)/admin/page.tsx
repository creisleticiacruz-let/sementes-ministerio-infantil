import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Card, Empty, PageHead, Stat } from '@/lib/ui'
import { fmtBR, nextSunday, todayBR } from '@/lib/dates'

export default async function Admin() {
  const { supabase } = await requireProfile()
  const today = todayBR()
  const sunday = nextSunday(today)
  const [u, c, e, sc, r, ru, rc, rs, ra, lastScale, redeemed] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('children').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('scales').select('id', { count: 'exact', head: true }).eq('date', sunday),
    supabase.from('rewards').select('id', { count: 'exact', head: true }).neq('status', 'inactive'),
    supabase.from('users').select('name,created_at').order('created_at', { ascending: false }).limit(2),
    supabase.from('children').select('name,created_at').order('created_at', { ascending: false }).limit(2),
    supabase.from('scales').select('date,created_at,teams(name)').order('created_at', { ascending: false }).limit(2),
    supabase.from('activities').select('title,created_at').order('created_at', { ascending: false }).limit(2),
    supabase.from('scales').select('date,teams(name)').order('date', { ascending: false }).limit(1),
    supabase.from('reward_redemptions').select('id', { count: 'exact', head: true }),
  ])
  const recent = [
    ...(ru.data ?? []).map((x) => ({ tipo: 'Usuário', nome: x.name, at: x.created_at })),
    ...(rc.data ?? []).map((x) => ({ tipo: 'Criança', nome: x.name, at: x.created_at })),
    ...(rs.data ?? []).map((x) => ({ tipo: 'Escala', nome: `${(x.teams as unknown as { name: string } | null)?.name} — ${fmtBR(x.date)}`, at: x.created_at })),
    ...(ra.data ?? []).map((x) => ({ tipo: 'Conteúdo', nome: x.title, at: x.created_at })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  const mods = [
    ['/admin/usuarios', '👥', 'Usuários', 'Cadastro, convites, funções e status dos usuários'],
    ['/admin/criancas', '🧒', 'Crianças', 'Cadastro, foto, turma e responsáveis'],
    ['/admin/escalas', '📅', 'Escalas', 'Escalas dos domingos por equipe e função'],
    ['/admin/equipes', '🤝', 'Equipes', 'Equipes e seus membros'],
    ['/admin/conteudos', '📚', 'Conteúdos', 'Datas especiais, lanche, PIX e notificações'],
    ['/admin/recompensas', '🎁', 'Recompensas', 'Faixas de estrelas e prêmios'],
  ]
  return (
    <>
      <PageHead kicker="/admin" title="Painel Administrativo" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Usuários ativos" value={u.count ?? 0} />
        <Stat label="Crianças cadastradas" value={c.count ?? 0} />
        <Stat label={`Escalas do domingo ${fmtBR(sunday).slice(0, 5)}`} value={sc.count ?? 0} />
        <Stat label="Equipes ativas" value={e.count ?? 0} />
      </div>
      <Card title="Módulos de Gerenciamento">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mods.map(([h, i, t, d]) => (
            <div key={h} className="subcard bg-white space-y-2">
              <p className="flex items-center gap-2 font-medium"><span className="tile-icon">{i}</span>{t}</p>
              <p className="text-xs text-[var(--muted)]">{d}</p>
              <Link href={h} className="btn w-full">Gerenciar</Link>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Card title="Registros Recentes">
          {recent.length ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Tipo</th><th>Nome</th><th>Criado em</th></tr></thead>
            <tbody>{recent.map((x, i) => <tr key={i}><td>{x.tipo}</td><td>{x.nome}</td><td>{new Date(x.at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div> : <Empty />}
        </Card>
        <Card title="Resumo Geral">
          <div className="space-y-2">
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Última escala cadastrada</p>{lastScale.data?.[0] ? `${(lastScale.data[0].teams as unknown as { name: string } | null)?.name} — ${fmtBR(lastScale.data[0].date)}` : '—'}</div>
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Recompensas ativas</p>{r.count ?? 0}</div>
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Recompensas resgatadas</p>{redeemed.count ?? 0}</div>
          </div>
        </Card>
      </div>
    </>
  )
}
