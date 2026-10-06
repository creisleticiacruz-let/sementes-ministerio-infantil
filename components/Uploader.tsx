'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Envia a imagem/arquivo direto do navegador para o Supabase Storage (bucket "sementes")
 * e preenche um <input type="hidden" name={name}> com a URL pública.
 */
export default function Uploader({ name, folder, accept = 'image/*', label = 'Escolher arquivo', initial }: { name: string; folder: string; accept?: string; label?: string; initial?: string | null }) {
  const [url, setUrl] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('sementes').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      setUrl(supabase.storage.from('sementes').getPublicUrl(path).data.publicUrl)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha no envio')
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input type="hidden" name={name} value={url} />
      <label className="btn btn-sm cursor-pointer">
        {busy ? 'Enviando…' : url ? '✓ Trocar' : label}
        <input type="file" accept={accept} onChange={onFile} className="hidden" disabled={busy} />
      </label>
      {url && /\.(png|jpe?g|webp|gif)$/i.test(url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-9 h-9 rounded object-cover border" />
      )}
      {err && <span className="text-xs text-red-700">{err}</span>}
    </div>
  )
}
