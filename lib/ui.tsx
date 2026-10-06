import Link from 'next/link'
import type { ReactNode } from 'react'
import { initials } from './dates'

export function PageHead({ kicker, title, sub, children }: { kicker?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        {kicker && <p className="text-xs text-[var(--muted)]">{kicker}</p>}
        <h1 className="text-xl font-semibold">{title}</h1>
        {sub && <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export const Card = ({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-2 mb-3">
        {title && <h2 className="card-title">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
)

export const Empty = ({ children = 'Nada por aqui ainda.' }: { children?: ReactNode }) => (
  <p className="text-sm text-[var(--muted)] py-2">{children}</p>
)

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const s = { width: size, height: size, fontSize: size * 0.36 }
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt={name} style={s} className="rounded-full object-cover shrink-0 border border-[var(--line)]" />
  return <div style={s} className="rounded-full bg-[#e5e7eb] text-[var(--muted)] flex items-center justify-center font-medium shrink-0">{initials(name)}</div>
}

export const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="card"><p className="text-xs text-[var(--muted)]">{label}</p><p className="text-lg font-semibold mt-0.5">{value}</p></div>
)

export const SeeMore = ({ href, children = 'Ver' }: { href: string; children?: ReactNode }) => (
  <Link href={href} className="btn btn-sm">{children}</Link>
)

export const TurmaTabs = ({ turmas, sel, base, extra = '' }: { turmas: { id: string; name: string }[]; sel?: string; base: string; extra?: string }) => (
  <div className="flex flex-wrap gap-2">
    {turmas.map((t) => (
      <Link key={t.id} href={`${base}?turma=${t.id}${extra}`} className={`btn btn-sm ${t.id === sel ? 'btn-primary' : ''}`}>{t.name}</Link>
    ))}
  </div>
)

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block"><span className="label">{label}</span>{children}</label>
)
