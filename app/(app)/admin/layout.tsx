import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'

const tabs = [['/admin', 'Dashboard'], ['/admin/usuarios', 'Usuários'], ['/admin/criancas', 'Crianças'], ['/admin/escalas', 'Escalas'], ['/admin/equipes', 'Equipes'], ['/admin/conteudos', 'Conteúdos'], ['/admin/recompensas', 'Recompensas'], ['/admin/relatorios', 'Relatórios']]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile()
  if (profile.role !== 'admin') redirect('/dashboard')
  return (
    <>
      <nav className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(([h, l]) => <Link key={h} href={h} className="btn btn-sm whitespace-nowrap">{l}</Link>)}
      </nav>
      {children}
    </>
  )
}
