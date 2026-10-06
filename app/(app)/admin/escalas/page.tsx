import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { fmtLong, nextSunday, todayBR } from '@/lib/dates'
import { addAssignment, createScale, deleteScale, duplicateScale, removeAssignment } from '../actions'

const FUNCS: Record<string, string[]> = {
  Louvor: ['Voz', 'Violão', 'Cajon', 'Percussão', 'Teclado'],
  Direção: ['Servo', 'Monitor'],
  Lanche: ['Responsável pelo lanche'],
  'Baby': ['Professor', 'Auxiliar'], '4 a 7': ['Professor', 'Auxiliar'], '8 a 11': ['Professor', 'Auxiliar'],
}

type Sc = { id: string; date: string; description: string | null; team_id: string; teams: { name: string } | null; scale_assignments: { id: string; function: string; users: { name: string } | null }[] }

export default async function AdminEscalas({ searchParams }: { searchParams: Promise<{ passadas?: string; equipe?: string }> }) {
  const sp = await searchParams
  const { supabase } = await requireProfile()
  const today = todayBR()
  const [{ data: teams }, { data: users }] = await Promise.all([
    supabase.from('teams').select('id,name').eq('is_active', true).order('name'),
    supabase.from('users').select('id,name,role').eq('is_active', true).neq('role', 'responsavel').order('name'),
  ])
  let q = supabase.from('scales').select('id,date,description,team_id,teams(name),scale_assignments(id,function,users(name))')
  q = sp.passadas ? q.lt('date', today).order('date', { ascending: false }) : q.gte('date', today).order('date')
  if (sp.equipe) q = q.eq('team_id', sp.equipe)
  const { data } = await q.limit(40)
  const scales = (data ?? []) as unknown as Sc[]

  return (
    <>
      <PageHead kicker="Administração" title="Escalas" sub="Crie a escala do domingo e escale as pessoas por função. Cada pessoa é avisada na plataforma.">
        <Link href={sp.passadas ? '/admin/escalas' : '/admin/escalas?passadas=1'} className="btn">{sp.passadas ? 'Ver próximas' : 'Ver passadas'}</Link>
      </PageHead>
      <Card title="Nova escala">
        <form action={createScale} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Domingo"><input type="date" name="date" required defaultValue={nextSunday(today)} className="input" /></Field>
          <Field label="Equipe"><select name="team_id" required className="input">{teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Observação / horário"><input name="description" className="input" placeholder="Ex.: chegar às 8h30" /></Field>
          <button className="btn btn-primary">Criar escala</button>
        </form>
      </Card>
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/escalas" className={`btn btn-sm ${!sp.equipe ? 'btn-primary' : ''}`}>Todas as equipes</Link>
        {teams?.map((t) => <Link key={t.id} href={`/admin/escalas?equipe=${t.id}${sp.passadas ? '&passadas=1' : ''}`} className={`btn btn-sm ${sp.equipe === t.id ? 'btn-primary' : ''}`}>{t.name}</Link>)}
      </div>
      {scales.length ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {scales.map((sc) => {
            const funcs = FUNCS[sc.teams?.name ?? ''] ?? ['Voluntário']
            return (
              <Card key={sc.id} title={`${sc.teams?.name} — ${fmtLong(sc.date)}`}>
                {sc.description && <p className="text-xs text-[var(--muted)] mb-2">{sc.description}</p>}
                {sc.scale_assignments.length ? (
                  <div className="space-y-1 mb-3">{sc.scale_assignments.map((a) => (
                    <form key={a.id} action={removeAssignment} className="subcard flex items-center justify-between py-1.5">
                      <input type="hidden" name="id" value={a.id} />
                      <span className="text-sm"><span className="text-[var(--muted)]">{a.function}:</span> <b>{a.users?.name}</b></span>
                      <button className="text-xs text-[#b91c1c]" title="Remover">✕</button>
                    </form>))}</div>
                ) : <Empty>Ninguém escalado ainda.</Empty>}
                <form action={addAssignment} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input type="hidden" name="scale_id" value={sc.id} />
                  <select name="user_id" required className="input py-1"><option value="">Pessoa…</option>{users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                  <select name="function" className="input py-1">{funcs.map((f) => <option key={f}>{f}</option>)}</select>
                  <button className="btn btn-sm btn-primary">Escalar</button>
                </form>
                <div className="flex gap-2 mt-3">
                  <form action={duplicateScale}><input type="hidden" name="id" value={sc.id} /><button className="btn btn-sm">📄 Duplicar (+7 dias)</button></form>
                  <form action={deleteScale}><input type="hidden" name="id" value={sc.id} /><ConfirmButton message="Excluir esta escala e todas as pessoas escaladas?">🗑 Excluir</ConfirmButton></form>
                </div>
              </Card>
            )
          })}
        </div>
      ) : <Card><Empty>Nenhuma escala {sp.passadas ? 'passada' : 'futura'} cadastrada.</Empty></Card>}
    </>
  )
}
