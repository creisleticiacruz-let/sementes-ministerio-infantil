'use client'

import type { ReactNode } from 'react'

/** Botão de submit que pede confirmação antes de enviar o formulário. */
export default function ConfirmButton({ message, children, className = 'btn btn-sm btn-danger' }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault() }}>{children}</button>
  )
}
