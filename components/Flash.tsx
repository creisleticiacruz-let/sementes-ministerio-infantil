'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function Flash() {
  const sp = useSearchParams()
  const ok = sp.get('ok')
  const erro = sp.get('erro')
  const [hidden, setHidden] = useState<string | null>(null)
  const msg = erro ?? ok
  if (!msg || hidden === msg) return null
  return (
    <div role="status" onClick={() => setHidden(msg)}
      className={`rounded-lg border px-4 py-2 text-sm cursor-pointer ${erro ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
      {erro ? '⚠️ ' : '✅ '}{msg} <span className="float-right opacity-50">×</span>
    </div>
  )
}
