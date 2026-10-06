export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília */
export const todayBR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

export const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
export const parse = (s: string) => new Date(s + 'T12:00:00')
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export const fmtShort = (s: string) => parse(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
export const fmtBR = (s: string) => s.split('-').reverse().join('/')
export const fmtLong = (s: string) => parse(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)

/** "2026-10" → { y, m } com fallback para o mês atual */
export function parseMonth(v?: string) {
  const t = todayBR()
  const m = v && /^\d{4}-\d{2}$/.test(v) ? v : t.slice(0, 7)
  return { y: Number(m.slice(0, 4)), m: Number(m.slice(5, 7)), key: m }
}
export const shiftMonth = (key: string, delta: number) => {
  const d = new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const monthRange = (key: string) => ({ start: `${key}-01`, end: `${shiftMonth(key, 1)}-01` })

/** Grade do mês: semanas começando no domingo, null = célula vazia */
export function monthGrid(y: number, m: number) {
  const first = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(ymd(y, m, d))
  while (cells.length % 7) cells.push(null)
  return cells
}
export const isSunday = (s: string) => parse(s).getDay() === 0
export const nextSunday = (from: string) => { const d = parse(from).getDay(); return addDays(from, d === 0 ? 0 : 7 - d) }
export const isLastSundayOfMonth = (s: string) => isSunday(s) && parse(addDays(s, 7)).getMonth() !== parse(s).getMonth()
export const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
