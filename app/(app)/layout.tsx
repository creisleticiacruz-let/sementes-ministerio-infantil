import AppShell, { type NavItem } from '@/components/AppShell'
import { requireProfile } from '@/lib/auth'
import { signOut } from './actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile, missingProfile } = await requireProfile()
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)

  const guardian = profile.role === 'responsavel'
  const items: NavItem[] = guardian
    ? [
        { href: '/dashboard', label: 'Início', icon: '🏠' },
        { href: '/espaco-responsaveis', label: 'Espaço dos Responsáveis', icon: '🌱' },
        { href: '/fotos', label: 'Fotos', icon: '📸' },
        { href: '/calendario', label: 'Calendário Sementes', icon: '📅' },
        { href: '/playlist', label: 'Playlist', icon: '🎵' },
        { href: '/aniversarios', label: 'Aniversários', icon: '🎂' },
        { href: '/notificacoes', label: 'Notificações', icon: '🔔', badge: count ?? 0 },
        { href: '/configuracoes', label: 'Configurações', icon: '⚙️' },
      ]
    : [
        { href: '/dashboard', label: 'Início', icon: '🏠' },
        { href: '/minha-escala', label: 'Minha Escala', icon: '📅' },
        { href: '/equipes', label: 'Equipes', icon: '👥' },
        { href: '/atividades', label: 'Atividades', icon: '📚' },
        { href: '/playlist', label: 'Playlist', icon: '🎵' },
        { href: '/criancas', label: 'Crianças / Pontuação', icon: '⭐' },
        { href: '/fotos', label: 'Fotos', icon: '📸' },
        { href: '/calendario', label: 'Calendário Sementes', icon: '🗓️' },
        { href: '/aniversarios', label: 'Aniversários', icon: '🎂' },
        { href: '/notificacoes', label: 'Notificações', icon: '🔔', badge: count ?? 0 },
        ...(profile.role === 'admin' ? [{ href: '/espaco-responsaveis', label: 'Espaço dos Responsáveis', icon: '🌱' }] : []),
        { href: '/configuracoes', label: 'Configurações', icon: '⚙️' },
        ...(profile.role === 'admin' ? [{ href: '/admin', label: 'Administração', icon: '🛠️' }] : []),
      ]

  return (
    <AppShell items={items} title="Sementes" subtitle="Ministério Infantil" user={{ name: profile.name, email: profile.email }} signOut={signOut}>
      {missingProfile && (
        <div className="rounded-lg bg-amber-100 text-amber-900 text-sm px-4 py-2">
          Seu perfil ainda não existe na tabela <code>users</code>. Rode <code>supabase/02_auth_rls.sql</code> no Supabase.
        </div>
      )}
      {children}
    </AppShell>
  )
}
