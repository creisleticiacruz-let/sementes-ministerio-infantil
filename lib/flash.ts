import { redirect } from 'next/navigation'

/** Volta para a página com uma mensagem de sucesso (ok) ou erro (erro). */
export function back(path: string, kind: 'ok' | 'erro', msg: string): never {
  const sep = path.includes('?') ? '&' : '?'
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`)
}
