import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { signOut } from './actions'

const links = [
  ['/dashboard', 'Início'],
  ['/minha-escala', 'Minha escala'],
  ['/equipes', 'Equipes'],
  ['/atividades', 'Atividades'],
  ['/playlist', 'Playlist'],
  ['/criancas', 'Crianças'],
  ['/calendario', 'Calendário'],
  ['/aniversarios', 'Aniversários'],
  ['/espaco-responsaveis', 'Responsáveis'],
  ['/configuracoes', 'Configurações'],
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, missingProfile } = await requireProfile()
  const all = profile.role === 'admin' ? [...links, ['/admin', 'Admin']] : links
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-bold text-lg">🌱 Sementes</Link>
          <form action={signOut}><button className="text-sm underline">Sair</button></form>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto text-sm">
          {all.map(([href, label]) => (
            <Link key={href} href={href} className="px-3 py-1 rounded-full hover:bg-emerald-700 whitespace-nowrap">{label}</Link>
          ))}
        </nav>
      </header>
      {missingProfile && (
        <div className="bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center">
          Seu perfil ainda não existe na tabela <code>users</code>. Rode <code>supabase/02_auth_rls.sql</code> no Supabase.
        </div>
      )}
      <main className="max-w-5xl mx-auto p-4 space-y-4">{children}</main>
    </div>
  )
}
