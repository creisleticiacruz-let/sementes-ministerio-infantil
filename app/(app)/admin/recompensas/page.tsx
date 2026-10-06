import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { deleteRow, saveReward } from '../actions'

export default async function AdminRecompensas() {
  const { supabase } = await requireProfile()
  const { data } = await supabase.from('rewards').select('id,name,description,points_required').neq('status', 'inactive').order('points_required')
  return (
    <>
      <PageHead kicker="Administração" title="Recompensas" sub="Faixas de estrelas totalmente editáveis. Cada criança vê quantas estrelas faltam para a próxima." />
      <Card title="Nova recompensa">
        <form action={saveReward} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Estrelas"><input name="points_required" type="number" min={0} required className="input" /></Field>
          <Field label="Recompensa"><input name="name" required className="input" /></Field>
          <Field label="Descrição"><input name="description" className="input" /></Field>
          <button className="btn btn-primary">Adicionar</button>
        </form>
      </Card>
      <Card title="Recompensas cadastradas">
        {data?.length ? (
          <div className="space-y-2">{data.map((r) => (
            <div key={r.id} className="subcard flex flex-wrap items-end gap-2">
              <form action={saveReward} className="grid grid-cols-2 sm:grid-cols-[100px_1fr_1.4fr_auto] gap-2 flex-1 items-end">
                <input type="hidden" name="id" value={r.id} />
                <Field label="Estrelas"><input name="points_required" type="number" min={0} defaultValue={r.points_required} className="input bg-white" /></Field>
                <Field label="Recompensa"><input name="name" defaultValue={r.name} required className="input bg-white" /></Field>
                <Field label="Descrição"><input name="description" defaultValue={r.description ?? ''} className="input bg-white" /></Field>
                <button className="btn btn-sm btn-primary">Salvar</button>
              </form>
              <form action={deleteRow}><input type="hidden" name="table" value="rewards" /><input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value="/admin/recompensas" /><ConfirmButton message="Excluir esta recompensa?">🗑</ConfirmButton></form>
            </div>))}</div>
        ) : <Empty />}
      </Card>
    </>
  )
}
