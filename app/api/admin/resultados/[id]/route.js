import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { ehUuid } from '@/lib/relatorios-candidato'

export const dynamic = 'force-dynamic'

// Exclusão de resultados. Definitiva — a linha sai do banco.
//
// Vive sob /api/admin porque o middleware protege esse prefixo inteiro. Sob
// /api/resultados não daria: o matcher precisaria de `:path*`, que casaria
// também com /api/resultados e trancaria a gravação do candidato.
//
// Dois escopos:
//   tentativa — apaga só esta sessão, preservando as outras do candidato
//   candidato — apaga a pessoa e todas as tentativas dela
//
// A exclusão é de verdade, e não uma marca de "excluído": um pedido de remoção
// de dados pessoais não é atendido por dado que continua na tabela.

const ESCOPOS = ['tentativa', 'candidato']

export async function DELETE(request, { params }) {
  const { id } = await params

  if (!ehUuid(id)) {
    return NextResponse.json({ erro: 'Identificador inválido' }, { status: 400 })
  }

  const escopo = new URL(request.url).searchParams.get('escopo') ?? 'tentativa'
  if (!ESCOPOS.includes(escopo)) {
    return NextResponse.json(
      { erro: `Escopo inválido: use ${ESCOPOS.join(' ou ')}` },
      { status: 400 }
    )
  }

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (error) {
    console.error('[admin/resultados] Supabase não configurado:', error.message)
    return NextResponse.json({ erro: 'Servidor não configurado' }, { status: 500 })
  }

  // Lê antes de apagar. Serve para dois propósitos: distinguir "não existe"
  // (404) de "falhou" (500), e descobrir o email quando o escopo é o candidato
  // inteiro — o cliente manda o id de uma tentativa, nunca o email, que não
  // deve viajar na URL.
  const { data: alvo, error: erroBusca } = await supabase
    .from('raven_resultados')
    .select('id, email, nome')
    .eq('id', id)
    .maybeSingle()

  if (erroBusca) {
    console.error('[admin/resultados] Falha ao localizar:', erroBusca)
    return NextResponse.json({ erro: 'Falha ao localizar o resultado' }, { status: 500 })
  }
  if (!alvo) {
    return NextResponse.json({ erro: 'Resultado não encontrado' }, { status: 404 })
  }

  const consulta =
    escopo === 'candidato'
      ? supabase.from('raven_resultados').delete().eq('email', alvo.email)
      : supabase.from('raven_resultados').delete().eq('id', id)

  const { data: apagadas, error } = await consulta.select('id')

  if (error) {
    console.error('[admin/resultados] Falha ao excluir:', error)
    return NextResponse.json({ erro: 'Falha ao excluir' }, { status: 500 })
  }

  // Fica no log do servidor: exclusão de dado pessoal é o tipo de ação que
  // alguém vai querer reconstituir depois. O email não entra — o id basta para
  // saber o que aconteceu sem repetir o dado que acabou de ser removido.
  console.info(
    `[admin/resultados] escopo=${escopo} alvo=${id} removidas=${apagadas?.length ?? 0}`
  )

  return NextResponse.json({ removidas: apagadas?.length ?? 0, escopo })
}
