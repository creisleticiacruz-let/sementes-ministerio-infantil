'use client'

import { useRouter } from 'next/navigation'

/** <select> que navega ao trocar: cada opção tem a URL de destino. */
export default function AutoSelect({ value, options, className = 'input w-auto' }: { value: string; options: { value: string; label: string }[]; className?: string }) {
  const router = useRouter()
  return (
    <select className={className} value={value} onChange={(e) => router.push(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
