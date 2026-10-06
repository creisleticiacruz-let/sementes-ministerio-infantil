import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import ConfirmButton from '@/components/ConfirmButton'
import Uploader from '@/components/Uploader'
import { Card, Empty, Field, PageHead } from '@/lib/ui'
import { fmtBR, todayBR } from '@/lib/dates'
import { addSnack, deleteRow, saveEvent, savePix, saveSpecialDate, sendNotification } from '../actions'

function Del({ table, id }: { table: string; id: string }) {
  return <form action={deleteRow}><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={id} /><ConfirmButton message="Remover este item?" className="text-xs text-[#b91c1c]">✕</ConfirmButton></form>
}

export default async function Conteudos() {
  const { supabase } = await requireProfile()
  const today = todayBR()
  const [{ data: specials }, { data: events }, { data: snacks }, { data: pix }, { data: acts }] = await Promise.all([
    supabase.from('special_dates').select('id,date,title').gte('date', today).order('date').limit(15),
    supabase.from('calendar_events').select('id,date,title').gte('date', today).order('date').limit(15),
    supabase.from('snack_suggestions').select('id,name').eq('is_active', true).order('name'),
    supabase.from('offering_settings').select('id,church_name,pix_key,pix_qr_code_url,description').eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('activities').select('id,date,title,turmas(name)').order('date', { ascending: false }).limit(8),
  ])
  return (
    <>
      <PageHead kicker="Administração" title="Conteúdos">
        <Link href="/playlist" className="btn">🎵 Músicas</Link><Link href="/fotos" className="btn">📸 Fotos</Link><Link href="/atividades" className="btn">📚 Atividades</Link>
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="🎉 Datas especiais (Calendário)">
          <form action={saveSpecialDate} className="grid grid-cols-[auto_1fr_auto] gap-2 mb-3"><input type="date" name="date" required className="input" /><input name="title" required placeholder="Ex.: Dia das Crianças" className="input" /><button className="btn btn-sm btn-primary">Adicionar</button></form>
          {specials?.length ? specials.map((s) => <div key={s.id} className="subcard flex justify-between mb-1 py-1.5"><span className="text-sm">{fmtBR(s.date).slice(0, 5)} — {s.title}</span><Del table="special_dates" id={s.id} /></div>) : <Empty />}
        </Card>
        <Card title="📌 Eventos do calendário">
          <form action={saveEvent} className="grid grid-cols-[auto_1fr_auto] gap-2 mb-3"><input type="date" name="date" required className="input" /><input name="title" required placeholder="Ex.: Culto de Natal" className="input" /><button className="btn btn-sm btn-primary">Adicionar</button></form>
          {events?.length ? events.map((s) => <div key={s.id} className="subcard flex justify-between mb-1 py-1.5"><span className="text-sm">{fmtBR(s.date).slice(0, 5)} — {s.title}</span><Del table="calendar_events" id={s.id} /></div>) : <Empty />}
        </Card>
        <Card title="🍞 Sugestões de lanche">
          <form action={addSnack} className="flex gap-2 mb-3"><input name="name" required placeholder="Nova sugestão" className="input" /><button className="btn btn-sm btn-primary">Adicionar</button></form>
          <div className="flex flex-wrap gap-2">{snacks?.map((s) => <span key={s.id} className="badge badge-green py-1 flex items-center gap-2">{s.name}<Del table="snack_suggestions" id={s.id} /></span>)}</div>
        </Card>
        <Card title="❤️ PIX para ofertas">
          <form action={savePix} className="space-y-2">
            <input type="hidden" name="id" value={pix?.id ?? ''} />
            <Field label="Nome da igreja"><input name="church_name" defaultValue={pix?.church_name ?? ''} className="input" /></Field>
            <Field label="Chave PIX"><input name="pix_key" required defaultValue={pix?.pix_key ?? ''} className="input" /></Field>
            <Field label="QR Code (imagem)"><Uploader name="pix_qr_code_url" folder="pix" label="Enviar QR Code" initial={pix?.pix_qr_code_url} /></Field>
            <Field label="Mensagem"><input name="description" defaultValue={pix?.description ?? ''} className="input" /></Field>
            <button className="btn btn-primary w-full">Salvar PIX</button>
          </form>
        </Card>
        <Card title="🔔 Enviar notificação">
          <form action={sendNotification} className="space-y-2">
            <Field label="Para"><select name="target" className="input"><option value="todos">Todos os usuários</option><option value="equipe">Somente equipe (voluntários)</option><option value="responsavel">Somente responsáveis</option></select></Field>
            <Field label="Mensagem"><textarea name="message" required rows={3} className="input" placeholder="Ex.: Amanhã teremos programação especial!" /></Field>
            <Field label="Link (opcional)"><input name="link" className="input" placeholder="/calendario" /></Field>
            <button className="btn btn-primary w-full">Enviar</button>
          </form>
        </Card>
        <Card title="📚 Atividades recentes">
          {acts?.length ? acts.map((a) => <div key={a.id} className="subcard flex justify-between mb-1 py-1.5"><span className="text-sm">{fmtBR(a.date).slice(0, 5)} — {a.title} <span className="text-[var(--muted)]">({(a.turmas as unknown as { name: string } | null)?.name})</span></span><Del table="activities" id={a.id} /></div>) : <Empty />}
        </Card>
      </div>
    </>
  )
}
