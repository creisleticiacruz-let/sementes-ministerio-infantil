import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import ChildHistory from '@/components/ChildHistory'
import { PageHead } from '@/lib/ui'

export default async function CriancaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, profile } = await requireProfile()
  if (profile.role === 'responsavel') redirect(`/espaco-responsaveis?crianca=${id}`)
  return (
    <>
      <PageHead kicker="Crianças" title="Histórico de estrelas"><Link href="/criancas" className="btn">← Voltar</Link></PageHead>
      <ChildHistory supabase={supabase} childId={id} />
    </>
  )
}
