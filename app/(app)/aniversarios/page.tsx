import { requireProfile } from '@/lib/auth'
import AutoSelect from '@/components/AutoSelect'
import { Avatar, Card, Empty } from '@/lib/ui'
import { MESES, todayBR } from '@/lib/dates'

export default async function Aniversarios({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams
  const { supabase } = await requireProfile()
  const mes = Number(sp.mes) >= 1 && Number(sp.mes) <= 12 ? Number(sp.mes) : Number(todayBR().slice(5, 7))
  const { data } = await supabase.from('children').select('id,name,birth_date,photo_url,turmas(name)').eq('is_active', true).not('birth_date', 'is', null)
  const list = (data ?? []).filter((c) => Number(c.birth_date!.slice(5, 7)) === mes).sort((a, b) => Number(a.birth_date!.slice(8)) - Number(b.birth_date!.slice(8)))
  const hoje = todayBR().slice(5)
  return (
    <>
      <header className="card flex items-center justify-between flex-wrap gap-2">
        <div><p className="text-xs text-[var(--muted)]">Mês Sementes</p><h1 className="text-xl font-semibold">🎈 Aniversariantes de {MESES[mes - 1]}</h1></div>
        <AutoSelect value={`/aniversarios?mes=${mes}`} options={MESES.map((n, i) => ({ value: `/aniversarios?mes=${i + 1}`, label: n }))} />
      </header>
      {list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((c) => {
            const dia = c.birth_date!.slice(8)
            const today = c.birth_date!.slice(5) === hoje
            return (
              <Card key={c.id} className={`text-center ${today ? 'bg-[#fef3c7] border-[#fcd34d]' : ''}`}>
                <div className="flex justify-center mb-2"><Avatar name={c.name} url={c.photo_url} size={72} /></div>
                <p className="font-medium">🎂 {c.name}</p>
                <p className="text-xs text-[var(--muted)]">{dia} de {MESES[mes - 1]} · {(c.turmas as unknown as { name: string } | null)?.name}</p>
                {today && <p className="text-sm font-semibold mt-1">🎉 É hoje! Parabéns!</p>}
              </Card>
            )
          })}
        </div>
      ) : <Card><Empty>Nenhum aniversariante em {MESES[mes - 1]}.</Empty></Card>}
    </>
  )
}
