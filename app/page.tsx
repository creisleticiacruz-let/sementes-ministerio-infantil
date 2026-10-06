'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function traduzErro(msg: string) {
  if (msg === 'SUPABASE_ENV_MISSING')
    return 'Configuração ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel → Settings → Environment Variables) e faça um novo deploy.'
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos (ou usuário ainda não foi convidado).'
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado. Use o link do convite enviado ao seu e-mail.'
  if (/failed to fetch|network/i.test(msg)) return 'Sem conexão com o Supabase. Confira a URL do projeto.'
  return msg
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await createClient(remember).auth.signInWithPassword({ email: email.trim(), password })
      if (error) { setError(traduzErro(error.message)); setLoading(false); return }
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      setError(traduzErro(err instanceof Error ? err.message : 'Erro inesperado'))
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-center items-center p-12 text-center bg-gradient-to-br from-[#dcfce7] via-[#fef3c7] to-[#dbeafe]">
        <div className="text-7xl mb-4">🌱</div>
        <h1 className="text-5xl font-bold tracking-tight text-[#14532d]">SEMENTES</h1>
        <p className="text-xl text-[#374151] mt-1">Ministério Infantil</p>
        <p className="mt-8 max-w-sm text-[#4b5563] italic">“Ensinando, cuidando e cultivando pequenos corações.”</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-6">
            <div className="text-5xl">🌱</div>
            <h1 className="text-3xl font-bold text-[#14532d]">SEMENTES</h1>
            <p className="text-sm text-[var(--muted)]">Ministério Infantil</p>
          </div>
          <form onSubmit={onSubmit} className="card space-y-4 p-6">
            <div><h2 className="text-lg font-semibold">Entrar</h2><p className="text-xs text-[var(--muted)]">Acesso somente por convite da liderança.</p></div>
            <label className="block"><span className="label">E-mail</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" /></label>
            <label className="block"><span className="label">Senha</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" /></label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Salvar login</label>
              <Link href="/esqueci-senha" className="text-[var(--green)] hover:underline">Esqueci minha senha</Link>
            </div>
            {error && <div role="alert" className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
            <button disabled={loading} className="btn btn-green w-full min-h-11 text-base">{loading ? 'Entrando…' : 'Entrar'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}
