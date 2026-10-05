import type { ReactNode } from 'react'

export const Card = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    {title && <h2 className="font-semibold text-emerald-700 mb-2">{title}</h2>}
    {children}
  </section>
)
export const Empty = ({ children = 'Nada por aqui ainda.' }: { children?: ReactNode }) => (
  <p className="text-sm text-slate-500">{children}</p>
)
export const field = 'border border-slate-300 rounded-lg px-3 py-2 text-sm w-full'
export const btn = 'bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2'
