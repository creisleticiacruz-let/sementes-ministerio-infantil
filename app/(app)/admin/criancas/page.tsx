import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import Uploader from '@/components/Uploader'
import { Avatar, Card, Empty, Field, PageHead } from '@/lib/ui'
import { allTurmas } from '@/lib/turmas'
import { fmtBR } from '@/lib/dates'
import { linkGuardian, removeChild, saveChild, unlinkGuardian } from '../actions'

export default async function AdminCriancas({ searchParams }: { searchParams: Promise<{ editar?: string; turma?: string }> }) {
  const sp = await searchParams
  const { supabase } = await requireProfile()
  const turmas = await allTurmas(supabase)
  let q = supabase.from('children').select('id,name,birth_date,photo_url,turma_id,turmas(name),children_responsaveis(id,user_id,users(name))').order('name')
  if (sp.turma) q = q.eq('turma_id', sp.turma)
  const [{ data: kids }, { data: guardians }] = await Promise.all([q, supabase.from('users').select('id,name').eq('role', 'responsavel').eq('is_active', true).order('name')])
  const editing = (kids ?? []).find((k) => k.id === sp.editar)
  return (
    <>
      <PageHead kicker="Administração" title="Crianças">
        <Link href="/admin/criancas" className={`btn btn-sm ${!sp.turma ? 'btn-primary' : ''}`}>Todas</Link>
        {turmas.map((t) => <Link key={t.id} href={`/admin/criancas?turma=${t.id}`} className={`btn btn-sm ${sp.turma === t.id ? 'btn-primary' : ''}`}>{t.name}</Link>)}
      </PageHead>
      <Card title={editing ? `Editando ${editing.name}` : 'Cadastrar criança'}>
        <form action={saveChild} key={editing?.id ?? 'new'} className="grid sm:grid-cols-3 gap-3 items-end">
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <Field label="Nome"><input name="name" required defaultValue={editing?.name} className="input" /></Field>
          <Field label="Data de nascimento"><input name="birth_date" type="date" defaultValue={editing?.birth_date ?? ''} className="input" /></Field>
          <Field label="Turma"><select name="turma_id" required defaultValue={editing?.turma_id} className="input">{turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Foto"><Uploader name="photo_url" folder="criancas" label="Escolher foto" initial={editing?.photo_url} /></Field>
          <Field label="Vincular responsável"><select name="responsavel_id" className="input"><option value="">— nenhum —</option>{guardians?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
          <div className="flex gap-2"><button className="btn btn-primary flex-1">{editing ? 'Salvar alterações' : 'Cadastrar'}</button>{editing && <Link href="/admin/criancas" className="btn">Cancelar</Link>}</div>
        </form>
        {!guardians?.length && <p className="text-xs text-[var(--muted)] mt-2">Para vincular responsáveis, convide-os antes em Usuários com o tipo “Responsável”.</p>}
      </Card>
      <Card title={`Crianças cadastradas (${kids?.length ?? 0})`}>
        {kids?.length ? (
          <div className="space-y-2">
            {kids.map((k) => {
              const gs = k.children_responsaveis as unknown as { id: string; users: { name: string } | null }[]
              return (
                <div key={k.id} className="subcard grid md:grid-cols-[1.2fr_1.6fr_auto] gap-3 items-center">
                  <div className="flex items-center gap-2"><Avatar name={k.name} url={k.photo_url} size={38} />
                    <div><p className="font-medium">{k.name}</p><p className="text-xs text-[var(--muted)]">{(k.turmas as unknown as { name: string } | null)?.name}{k.birth_date ? ` · 🎂 ${fmtBR(k.birth_date)}` : ''}</p></div></div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">{gs.map((g) => (
                      <form key={g.id} action={unlinkGuardian} className="inline"><input type="hidden" name="id" value={g.id} />
                        <button className="badge badge-green" title="Remover vínculo">{g.users?.name} ✕</button></form>))}
                      {!gs.length && <span className="text-xs text-[var(--muted)]">Sem responsável vinculado</span>}</div>
                    {!!guardians?.length && <form action={linkGuardian} className="flex gap-1"><input type="hidden" name="child_id" value={k.id} />
                      <select name="user_id" className="input py-1 bg-white">{guardians.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><button className="btn btn-sm">Vincular</button></form>}
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/criancas?editar=${k.id}`} className="btn btn-sm">Editar</Link>
                    <form action={removeChild}><input type="hidden" name="id" value={k.id} /><ConfirmButton message={`Excluir ${k.name}? Apaga também presenças, estrelas, resgates e vínculos. Não dá para desfazer.`}>🗑 Excluir</ConfirmButton></form>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <Empty />}
      </Card>
    </>
  )
}
