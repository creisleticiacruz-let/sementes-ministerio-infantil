'use client'

import { deleteChild } from '../actions'

export default function DeleteChildButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteChild}
      onSubmit={(e) => {
        if (!confirm(`Excluir ${name}?\n\nIsso apaga também presenças, estrelas, resgates de recompensas e vínculos com responsáveis. Não dá para desfazer.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-red-700 hover:bg-red-50 border border-red-200 rounded px-3 py-1" title="Excluir criança">🗑 Excluir</button>
    </form>
  )
}
