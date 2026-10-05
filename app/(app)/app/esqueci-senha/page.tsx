'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${location.origin}/auth/callback?next=/redefinir-senha`,
      })
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.' })
    } catch {
      setMsg({ ok: false, text: 'Configuração do Supabase ausente.' })
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-100">
      <form onSubmit={onSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-4">
        <h1 className="text-2xl font-bold text-emerald-600">Recuperar senha</h1>
        <input type="email" required placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800" />
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</p>}
        <button disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50">Enviar link</button>
        <Link href="/" className="block text-center text-sm text-emerald-700 hover:underline">Voltar ao login</Link>
      </form>
    </main>
  )
}
