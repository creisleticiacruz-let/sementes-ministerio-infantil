import { requireProfile } from '@/lib/auth'
import Uploader from '@/components/Uploader'
import { Avatar, Card, Field, PageHead } from '@/lib/ui'
import { signOut, updateProfile } from '../actions'

const rolePt = { admin: 'Administrador', professor: 'Professor', voluntario: 'Voluntário', responsavel: 'Responsável' } as const

function Toggle({ name, title, desc, on }: { name: string; title: string; desc: string; on: boolean }) {
  return (
    <label className="subcard flex items-center justify-between gap-3 cursor-pointer">
      <span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-[var(--muted)]">{desc}</span></span>
      <input type="checkbox" name={name} defaultChecked={on} className="toggle" />
    </label>
  )
}

export default async function Configuracoes() {
  const { supabase, profile } = await requireProfile()
  const { data: p } = await supabase.from('user_notification_preferences').select('*').eq('user_id', profile.id).maybeSingle()
  const guardian = profile.role === 'responsavel'
  return (
    <>
      <PageHead kicker="Conta" title="Configurações"><span className="badge">{rolePt[profile.role]}</span><Avatar name={profile.name} url={profile.avatar_url} size={36} /></PageHead>
      <form action={updateProfile} className="grid lg:grid-cols-[200px_1fr] gap-4">
        <input type="hidden" name="guardian" value={guardian ? '1' : '0'} />
        <nav className="card h-fit text-sm space-y-1 hidden lg:block">
          <p className="text-xs text-[var(--muted)] mb-1">Menu</p>
          <a href="#perfil" className="nav-link nav-active">Meu Perfil</a>
          <a href="#notificacoes" className="nav-link">Notificações</a>
          <a href="#sair" className="nav-link">Sair</a>
        </nav>
        <div className="space-y-4">
          <Card title="Meu Perfil">
            <div id="perfil" className="space-y-3">
              <div className="flex items-center gap-3"><Avatar name={profile.name} url={profile.avatar_url} size={64} /><Uploader name="avatar_url" folder={profile.id} label="Alterar foto" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nome"><input name="name" required defaultValue={profile.name} className="input" /></Field>
                <Field label="E-mail"><input value={profile.email} disabled className="input opacity-70" /></Field>
              </div>
            </div>
          </Card>
          <Card title="Notificações">
            <div id="notificacoes" className="space-y-2">
              <Toggle name="email" title="Notificações por e-mail" desc="Receba lembretes e novidades por e-mail" on={p?.email_notifications_enabled ?? true} />
              <Toggle name="app" title="Notificações no aplicativo" desc="Avisos dentro da plataforma" on={p?.app_notifications_enabled ?? true} />
              {guardian ? (
                <Toggle name="saturday" title="Lembrete de sábado" desc="“Amanhã tem Sementes!” todo sábado" on={p?.saturday_reminder_enabled ?? true} />
              ) : (
                <>
                  <Toggle name="monday" title="Lembrete de segunda-feira" desc="Aviso da sua escala do domingo" on={p?.monday_reminder_enabled ?? true} />
                  <Toggle name="friday" title="Lembrete de sexta-feira" desc="Segundo aviso antes do domingo" on={p?.friday_reminder_enabled ?? true} />
                </>
              )}
            </div>
          </Card>
          <div className="flex justify-end gap-2"><a href="/configuracoes" className="btn">Cancelar</a><button className="btn btn-primary">Salvar</button></div>
        </div>
      </form>
      <Card><div id="sair" className="flex items-center justify-between"><div><p className="font-medium text-sm">Sair</p><p className="text-xs text-[var(--muted)]">Encerra a sessão atual neste dispositivo</p></div>
        <form action={signOut}><button className="btn">Sair da conta</button></form></div></Card>
    </>
  )
}
