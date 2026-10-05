'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function traduzErro(msg: string) {
  if (msg === 'SUPABASE_ENV_MISSING')
    return 'Configuração ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel → Settings → Environment Variables) e faça um novo deploy.'
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos (ou usuário ainda não criado no Supabase Auth).'
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
      const supabase = createClient(remember)
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setError(traduzErro(error.message))
        setLoading(false)
        return
      }
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      setError(traduzErro(err instanceof Error ? err.message : 'Erro inesperado'))
      setLoading(false)
    }
  }

  const input =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800'

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-100">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600 mb-1">🌱 Sementes</h1>
          <p className="text-gray-500 text-sm">Ministério Infantil — Acesso por convite</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            E-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input + ' mt-1'} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Senha
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input + ' mt-1'} />
          </label>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Salvar login
            </label>
            <Link href="/esqueci-senha" className="text-emerald-700 hover:underline">Esqueci a senha</Link>
          </div>
          {error && <div role="alert" className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
          <button disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
