import { requireProfile } from '@/lib/auth'
import { Card, Empty } from '@/lib/ui'

export default async function Aniversarios() {
  const { supabase } = await requireProfile()
  const mes = new Date().getMonth() + 1
  const { data } = await supabase.from('children').select('id,name,birth_date,photo_url').eq('is_active', true).not('birth_date', 'is', null)
  const list = (data ?? [])
    .filter((c) => Number(c.birth_date!.slice(5, 7)) === mes)
    .sort((a, b) => Number(a.birth_date!.slice(8)) - Number(b.birth_date!.slice(8)))
  return (
    <>
      <h1 className="text-2xl font-bold">🎂 Aniversariantes do mês</h1>
      {list.length ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {list.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">🌱</div>}
                <div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">{c.birth_date!.slice(8)}/{c.birth_date!.slice(5, 7)}</p></div>
              </div>
            </Card>
          ))}
        </div>
      ) : <Empty>Nenhum aniversariante neste mês.</Empty>}
    </>
  )
}
