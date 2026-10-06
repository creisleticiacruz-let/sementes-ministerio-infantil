import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { addMember, createTeam, removeMember, toggleTeam } from '../actions'

const ROLES = [['professor', 'Professor'], ['auxiliar', 'Auxiliar'], ['servo', 'Servo'], ['monitor', 'Monitor'], ['voz', 'Voz'], ['violao', 'Violão'], ['cajon', 'Cajon'], ['percussao', 'Percussão'], ['teclado', 'Teclado'], ['responsavel_lanche', 'Responsável pelo lanche'], ['voluntario', 'Voluntário']]

export default async function AdminEquipes() {
  const { supabase } = await requireProfile()
  const [{ data: teams }, { data: users }, { data: mem }] = await Promise.all([
    supabase.from('teams').select('id,name,description,is_active').order('name'),
    supabase.from('users').select('id,name').eq('is_active', true).neq('role', 'responsavel').order('name'),
    supabase.from('team_members').select('id,team_id,role,users(name)'),
  ])
  return (
    <>
      <PageHead kicker="Administração" title="Equipes" sub="Dica: para professores registrarem presença, a equipe precisa ter o mesmo nome da turma (Baby, 4 a 7, 8 a 11)." />
      <Card title="Nova equipe">
        <form action={createTeam} className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Nome"><input name="name" required className="input" /></Field>
          <Field label="Descrição"><input name="description" className="input" /></Field>
          <button className="btn btn-primary">Criar equipe</button>
        </form>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        {teams?.map((t) => {
          const ms = (mem ?? []).filter((m) => m.team_id === t.id) as unknown as { id: string; role: string; users: { name: string } | null }[]
          return (
            <Card key={t.id} title={`${t.name}${t.is_active ? '' : ' (inativa)'}`} action={
              <form action={toggleTeam}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="active" value={t.is_active ? '0' : '1'} /><button className="btn btn-sm">{t.is_active ? 'Desativar' : 'Ativar'}</button></form>}>
              {t.description && <p className="text-xs text-[var(--muted)] mb-2">{t.description}</p>}
              {ms.length ? <div className="space-y-1 mb-3">{ms.map((m) => (
                <form key={m.id} action={removeMember} className="subcard flex items-center justify-between py-1.5"><input type="hidden" name="id" value={m.id} />
                  <span className="text-sm"><b>{m.users?.name}</b> <span className="text-[var(--muted)]">· {m.role.replace('_', ' ')}</span></span>
                  <ConfirmButton message="Remover da equipe?" className="text-xs text-[#b91c1c]">✕</ConfirmButton></form>))}</div> : <Empty>Sem membros.</Empty>}
              <form action={addMember} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input type="hidden" name="team_id" value={t.id} />
                <select name="user_id" required className="input py-1"><option value="">Pessoa…</option>{users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <select name="role" className="input py-1">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <button className="btn btn-sm btn-primary">Adicionar</button>
              </form>
            </Card>
          )
        })}
      </div>
    </>
  )
}
