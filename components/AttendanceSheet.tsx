'use client'

import Link from 'next/link'
import { useState, useTransition, type ReactNode } from 'react'
import { saveClass, deleteChild } from '@/app/(app)/actions'
import { Avatar } from '@/lib/ui'

export type Kid = { id: string; name: string; photo_url: string | null; present: boolean; bible: number; verse: number; attitude: number }

function Counter({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled: boolean }) {
  return (
    <div className="inline-flex items-center border border-[var(--line)] rounded-lg overflow-hidden bg-white">
      <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className="w-9 h-9 text-lg disabled:opacity-30 hover:bg-[var(--soft)]" aria-label="menos">−</button>
      <span className="w-8 text-center font-medium">{value}</span>
      <button type="button" disabled={disabled} onClick={() => onChange(value + 1)} className="w-9 h-9 text-lg disabled:opacity-30 hover:bg-[var(--soft)]" aria-label="mais">+</button>
    </div>
  )
}

export default function AttendanceSheet({ date, initial, canEdit, isAdmin, aside }: { date: string; initial: Kid[]; canEdit: boolean; isAdmin: boolean; aside: ReactNode }) {
  const [kids, setKids] = useState(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const set = (id: string, patch: Partial<Kid>) => { setKids((k) => k.map((x) => (x.id === id ? { ...x, ...patch } : x))); setMsg(null) }
  const total = (k: Kid) => (k.present ? 1 : 0) + k.bible + k.verse + k.attitude
  const presentes = kids.filter((k) => k.present).length
  const stars = kids.reduce((a, k) => a + total(k), 0)

  const save = () => start(async () => {
    const r = await saveClass(date, kids.map((k) => ({ child_id: k.id, present: k.present, bible: k.bible, verse: k.verse, attitude: k.attitude })))
    setMsg({ ok: r.ok, text: r.msg })
  })

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 pb-20 lg:pb-0">
      <section className="card">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h2 className="card-title">Lista de Crianças</h2>
          <div className="flex items-center gap-2">
            <span className="badge">{presentes} de {kids.length} presentes</span>
            {canEdit && <button onClick={save} disabled={pending} className="btn btn-primary hidden lg:inline-flex">{pending ? 'Salvando…' : 'Salvar Aula'}</button>}
          </div>
        </div>
        {msg && <p className={`text-sm rounded-lg px-3 py-2 mb-3 border ${msg.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.ok ? '✅' : '⚠️'} {msg.text}</p>}
        {!canEdit && <p className="text-xs text-[var(--muted)] mb-3">Somente leitura: você não participa da equipe desta turma.</p>}
        {kids.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma criança cadastrada nesta turma.</p>}
        <div className="hidden md:grid grid-cols-[1.6fr_.9fr_1fr_1fr_1fr_.6fr] gap-2 px-3 py-2 bg-[var(--soft)] rounded-lg text-xs font-semibold text-[var(--muted)]">
          <span>Criança</span><span>Presença</span><span>Bíblia</span><span>Versículo</span><span>Boas Atitudes</span><span className="text-right">Total</span>
        </div>
        <div className="divide-y">
          {kids.map((k) => (
            <div key={k.id} className={`py-3 px-1 md:px-3 grid grid-cols-2 md:grid-cols-[1.6fr_.9fr_1fr_1fr_1fr_.6fr] gap-x-2 gap-y-2 items-center ${!k.present ? 'opacity-90' : ''}`}>
              <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                <Avatar name={k.name} url={k.photo_url} size={36} />
                <Link href={`/criancas/${k.id}`} className="font-medium hover:underline">{k.name}</Link>
                {isAdmin && (
                  <form action={deleteChild} className="ml-auto md:ml-1">
                    <input type="hidden" name="id" value={k.id} />
                    <button className="text-xs text-[#b91c1c] opacity-60 hover:opacity-100" title="Excluir criança"
                      onClick={(e) => { if (!confirm(`Excluir ${k.name}?\n\nApaga também presenças, estrelas, resgates e vínculos com responsáveis. Não dá para desfazer.`)) e.preventDefault() }}>🗑</button>
                  </form>
                )}
              </div>
              <label className={`flex items-center gap-2 h-10 px-2 rounded-lg border cursor-pointer ${k.present ? 'bg-[var(--green-soft)] border-[#86efac]' : 'bg-white border-[var(--line)]'} ${!canEdit ? 'pointer-events-none' : ''}`}>
                <input type="checkbox" className="w-5 h-5 accent-[#16a34a]" checked={k.present} disabled={!canEdit} onChange={(e) => set(k.id, { present: e.target.checked })} />
                <span className="text-sm">{k.present ? '⭐ 1' : 'Ausente'}</span>
              </label>
              <div><span className="md:hidden text-[11px] text-[var(--muted)] block">📖 Bíblia</span><Counter value={k.bible} disabled={!canEdit} onChange={(n) => set(k.id, { bible: n })} /></div>
              <div><span className="md:hidden text-[11px] text-[var(--muted)] block">✝️ Versículo</span><Counter value={k.verse} disabled={!canEdit} onChange={(n) => set(k.id, { verse: n })} /></div>
              <div><span className="md:hidden text-[11px] text-[var(--muted)] block">😊 Boas atitudes</span><Counter value={k.attitude} disabled={!canEdit} onChange={(n) => set(k.id, { attitude: n })} /></div>
              <div className="text-right font-semibold col-span-2 md:col-span-1">⭐ {total(k)}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-3 flex justify-between"><span>Presenças marcadas: {presentes} de {kids.length}</span><span>Estrelas distribuídas hoje: ⭐ {stars}</span></p>
      </section>

      <div className="space-y-4">
        <section className="card">
          <h2 className="card-title mb-3">Resumo de Hoje</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Presentes</p><p className="font-semibold">{presentes}/{kids.length}</p></div>
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Ausentes</p><p className="font-semibold">{kids.length - presentes}</p></div>
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Estrelas hoje</p><p className="font-semibold">⭐ {stars}</p></div>
            <div className="subcard"><p className="text-xs text-[var(--muted)]">Total de crianças</p><p className="font-semibold">{kids.length}</p></div>
          </div>
        </section>
        {aside}
      </div>

      {canEdit && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-[var(--line)] p-3">
          <button onClick={save} disabled={pending} className="btn btn-primary w-full min-h-12 text-base">{pending ? 'Salvando…' : 'Salvar Aula'}</button>
        </div>
      )}
    </div>
  )
}
