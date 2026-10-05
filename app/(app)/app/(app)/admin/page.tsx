import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { Card, btn, field } from '@/lib/ui'
import { adminInsert, inviteUser, setUserRole } from '../actions'

const roles = ['admin', 'professor', 'voluntario', 'responsavel']

function Add({ table, title, children }: { table: string; title: string; children: React.ReactNode }) {
  return (
    <Card title={title}>
      <form action={adminInsert} className="grid sm:grid-cols-3 gap-2">
        <input type="hidden" name="table" value={table} />
        {children}
        <button className={btn}>Adicionar</button>
      </form>
    </Card>
  )
}

export default async function Admin() {
  const { supabase, profile } = await requireProfile()
  if (profile.role !== 'admin') redirect('/dashboard')
  const [{ data: users }, { data: turmas }, { data: teams }] = await Promise.all([
    supabase.from('users').select('id,name,email,role').order('name'),
    supabase.from('turmas').select('id,name').order('name'),
    supabase.from('teams').select('id,name').order('name'),
  ])
  const TurmaSel = () => <select name="turma_id" required className={field}>{turmas?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
  const TeamSel = () => <select name="team_id" required className={field}>{teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
  return (
    <>
      <h1 className="text-2xl font-bold">Painel administrativo</h1>
      <Card title="Convidar usuário">
        <form action={inviteUser} className="grid sm:grid-cols-4 gap-2">
          <input name="name" placeholder="Nome" required className={field} />
          <input name="email" type="email" placeholder="E-mail" required className={field} />
          <select name="role" className={field}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
          <button className={btn}>Enviar convite</button>
        </form>
      </Card>
      <Card title="Usuários">
        <ul className="divide-y text-sm">
          {users?.map((u) => (
            <li key={u.id} className="py-2">
              <form action={setUserRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <span className="flex-1">{u.name} <span className="text-slate-400">· {u.email}</span></span>
                <select name="role" defaultValue={u.role} className="border rounded px-2 py-1">{roles.map((r) => <option key={r}>{r}</option>)}</select>
                <button className="text-xs text-emerald-700 underline">salvar</button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Add table="children" title="Cadastrar criança">
        <input name="name" placeholder="Nome" required className={field} />
        <input name="birth_date" type="date" className={field} />
        <TurmaSel />
      </Add>
      <Add table="teams" title="Cadastrar equipe">
        <input name="name" placeholder="Nome" required className={field} />
        <input name="description" placeholder="Descrição" className={field} />
      </Add>
      <Add table="scales" title="Criar escala">
        <input name="date" type="date" required className={field} />
        <TeamSel />
        <input name="description" placeholder="Observação" className={field} />
      </Add>
      <Add table="activities" title="Cadastrar atividade">
        <TurmaSel />
        <input name="date" type="date" required className={field} />
        <input name="title" placeholder="Título" required className={field} />
        <input name="description" placeholder="Descrição" className={field} />
        <input name="material_link" type="url" placeholder="Link do material" className={field} />
        <input name="bible_verse" placeholder="Versículo" className={field} />
      </Add>
      <Add table="rewards" title="Cadastrar recompensa">
        <input name="name" placeholder="Nome" required className={field} />
        <input name="description" placeholder="Descrição" className={field} />
        <input name="points_required" type="number" min={0} placeholder="Estrelas" required className={field} />
      </Add>
      <Add table="special_dates" title="Data especial">
        <input name="date" type="date" required className={field} />
        <input name="title" placeholder="Título" required className={field} />
        <input name="description" placeholder="Descrição" className={field} />
      </Add>
    </>
  )
}
