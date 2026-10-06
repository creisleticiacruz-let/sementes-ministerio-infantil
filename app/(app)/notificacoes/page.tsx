import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { Card, Empty, PageHead } from '@/lib/ui'
import { markAllRead, markRead } from '../actions'

export default async function Notificacoes() {
  const { supabase, profile } = await requireProfile()
  const { data } = await supabase.from('notifications').select('id,message,link,is_read,created_at').eq('user_id', profile.id).eq('channel', 'app').order('created_at', { ascending: false }).limit(60)
  const unread = (data ?? []).filter((n) => !n.is_read).length
  return (
    <>
      <PageHead kicker="Central" title="🔔 Notificações" sub={unread ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}>
        {unread > 0 && <form action={markAllRead}><button className="btn">Marcar todas como lidas</button></form>}
      </PageHead>
      <Card>
        {data?.length ? (
          <div className="space-y-2">
            {data.map((n) => (
              <div key={n.id} className={`subcard flex items-start gap-3 ${n.is_read ? 'opacity-60' : 'bg-white border-[var(--primary)]'}`}>
                <span>{n.is_read ? '✉️' : '🔔'}</span>
                <div className="flex-1 text-sm">
                  {n.link ? <Link href={n.link} className="underline">{n.message}</Link> : n.message}
                  <p className="text-xs text-[var(--muted)] mt-0.5">{new Date(n.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!n.is_read && <form action={markRead}><input type="hidden" name="id" value={n.id} /><button className="btn btn-sm">Lida</button></form>}
              </div>
            ))}
          </div>
        ) : <Empty>Você ainda não recebeu notificações.</Empty>}
      </Card>
    </>
  )
}
