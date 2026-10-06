'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useState, type ReactNode } from 'react'
import Flash from './Flash'

export type NavItem = { href: string; label: string; icon: string; badge?: number }

export default function AppShell({ items, title, subtitle, user, signOut, children }: {
  items: NavItem[]; title: string; subtitle: string; user: { name: string; email: string }; signOut: () => Promise<void>; children: ReactNode
}) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const active = (h: string) => path === h || (h !== '/dashboard' && h !== '/admin' && path.startsWith(h + '/')) || (h === '/admin' && path === '/admin')

  const nav = (
    <>
      <div className="px-3 py-4 border-b border-[var(--line)]">
        <p className="text-[11px] text-[var(--muted)]">{subtitle}</p>
        <p className="text-base font-semibold">{title}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map((i) => (
          <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={`nav-link flex items-center gap-2 ${active(i.href) ? 'nav-active' : ''}`}>
            <span className="w-5 text-center">{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            {!!i.badge && <span className="badge badge-orange">{i.badge}</span>}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-[var(--line)] text-xs">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-[var(--muted)] truncate mb-2">{user.email}</p>
        <form action={signOut}><button className="btn btn-sm w-full">Sair</button></form>
      </div>
    </>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-white border-r border-[var(--line)] sticky top-0 h-screen">{nav}</aside>
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[var(--line)] flex items-center justify-between px-3 py-2">
        <Link href="/dashboard" className="font-semibold">🌱 Sementes</Link>
        <button className="btn btn-sm" onClick={() => setOpen(true)} aria-label="Abrir menu">☰ Menu</button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 max-w-[85%] bg-white flex flex-col h-full">{nav}</div>
          <button className="flex-1 bg-black/40" onClick={() => setOpen(false)} aria-label="Fechar menu" />
        </div>
      )}
      <main className="flex-1 min-w-0 p-3 sm:p-5 space-y-4 max-w-6xl w-full mx-auto">
        <Suspense fallback={null}><Flash /></Suspense>
        {children}
      </main>
    </div>
  )
}
