'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RedefinirSenha() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('Use pelo menos 8 caracteres.')
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setError(error.message.includes('session') ? 'Link expirado. Peça um novo em "Esqueci a senha".' : error.message)
      setLoading(false)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-100">
      <form onSubmit={onSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-4">
        <h1 className="text-2xl font-bold text-emerald-600">Definir nova senha</h1>
        <input type="password" required minLength={8} placeholder="Nova senha (mín. 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800" />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50">Salvar senha</button>
      </form>
    </main>
  )
}
