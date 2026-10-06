import { requireProfile } from '@/lib/auth'
import { Avatar, Card, Empty, Field, PageHead } from '@/lib/ui'
import { inviteUser, updateUser } from '../actions'

const ROLES = [['admin', 'Administrador'], ['professor', 'Professor'], ['voluntario', 'Voluntário'], ['responsavel', 'Responsável']]

export default async function Usuarios() {
  const { supabase } = await requireProfile()
  const [{ data: users }, { data: mem }] = await Promise.all([
    supabase.from('users').select('id,name,email,role,is_active,avatar_url').order('name'),
    supabase.from('team_members').select('user_id,role,teams(name)'),
  ])
  const teamsOf = (id: string) => (mem ?? []).filter((m) => m.user_id === id).map((m) => `${(m.teams as unknown as { name: string } | null)?.name} · ${m.role}`)
  return (
    <>
      <PageHead kicker="Administração" title="Usuários" sub="Não há cadastro público: somente quem for convidado aqui acessa a plataforma." />
      <Card title="Convidar usuário">
        <form action={inviteUser} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Nome"><input name="name" required className="input" /></Field>
          <Field label="E-mail"><input name="email" type="email" required className="input" /></Field>
          <Field label="Tipo"><select name="role" className="input" defaultValue="voluntario">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <button className="btn btn-primary">Enviar convite</button>
        </form>
        <p className="text-xs text-[var(--muted)] mt-2">A pessoa recebe um e-mail para definir a própria senha. Equipes são definidas em Administração → Equipes.</p>
      </Card>
      <Card title={`Usuários (${users?.length ?? 0})`}>
        {users?.length ? (
          <div className="space-y-2">
            {users.map((u) => (
              <form key={u.id} action={updateUser} className={`subcard grid md:grid-cols-[1.4fr_1fr_auto_auto] gap-2 items-center ${u.is_active ? '' : 'opacity-60'}`}>
                <input type="hidden" name="id" value={u.id} />
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={u.name} url={u.avatar_url} size={34} />
                  <div className="min-w-0"><input name="name" defaultValue={u.name} className="input py-1 bg-white" /><p className="text-xs text-[var(--muted)] truncate mt-0.5">{u.email}</p></div>
                </div>
                <div><select name="role" defaultValue={u.role} className="input bg-white">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{teamsOf(u.id).join(' | ') || 'Sem equipe'}</p></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={u.is_active} className="toggle" /> Ativo</label>
                <button className="btn btn-sm btn-primary">Salvar</button>
              </form>
            ))}
          </div>
        ) : <Empty />}
      </Card>
    </>
  )
}
