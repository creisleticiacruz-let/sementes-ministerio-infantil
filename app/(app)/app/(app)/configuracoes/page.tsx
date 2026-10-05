import { requireProfile } from '@/lib/auth'
import { Card, btn, field } from '@/lib/ui'
import { signOut, updateProfile } from '../actions'

export default async function Configuracoes() {
  const { supabase, profile } = await requireProfile()
  const { data: prefs } = await supabase.from('user_notification_preferences').select('app_notifications_enabled,email_notifications_enabled').eq('user_id', profile.id).maybeSingle()
  return (
    <>
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Card title="Meu perfil">
        <form action={updateProfile} className="space-y-3 max-w-md">
          <label className="block text-sm">Nome<input name="name" defaultValue={profile.name} required className={field} /></label>
          <label className="block text-sm">E-mail<input value={profile.email} disabled className={field + ' bg-slate-100'} /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="app" defaultChecked={prefs?.app_notifications_enabled ?? true} /> Notificações no app</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="email" defaultChecked={prefs?.email_notifications_enabled ?? true} /> Notificações por e-mail</label>
          <button className={btn}>Salvar</button>
        </form>
      </Card>
      <form action={signOut}><button className="text-sm text-red-700 underline">Sair da conta</button></form>
    </>
  )
}
