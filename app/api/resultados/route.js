import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getNumeroOpcoes, TOTAL_QUESTOES } from '@/lib/quiz-data'

export const dynamic = 'force-dynamic'

// Valida o payload vindo do navegador.
// Repare no que NÃO é aceito: pontuação. O gabarito vive só no banco
// (raven_gabarito / raven_acertos), então nem este endpoint nem o cliente
// conseguem influenciar a nota. Ver PRD seção 8.2.
function validar(body) {
  if (!body || typeof body !== 'object') return 'Payload ausente ou inválido'

  const { nome, email, respostas, dataInicio, dataFim } = body

  if (typeof nome !== 'string' || nome.trim().length === 0) {
    return 'Nome é obrigatório'
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return 'Email inválido'
  }

  if (!Array.isArray(respostas)) {
    return 'Respostas devem ser um array'
  }
  if (respostas.length !== TOTAL_QUESTOES) {
    return `Esperadas ${TOTAL_QUESTOES} respostas, recebidas ${respostas.length}`
  }

  for (let i = 0; i < respostas.length; i++) {
    const numeroQuestao = i + 1
    const resposta = respostas[i]
    const maxOpcoes = getNumeroOpcoes(numeroQuestao)

    if (!Number.isInteger(resposta) || resposta < 1 || resposta > maxOpcoes) {
      return `Resposta inválida na questão ${numeroQuestao}: esperado inteiro entre 1 e ${maxOpcoes}, recebido ${JSON.stringify(resposta)}`
    }
  }

  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)

  if (Number.isNaN(inicio.getTime())) return 'dataInicio inválida'
  if (Number.isNaN(fim.getTime())) return 'dataFim inválida'
  if (fim < inicio) return 'dataFim não pode ser anterior a dataInicio'

  return null
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 })
  }

  const erroValidacao = validar(body)
  if (erroValidacao) {
    return NextResponse.json({ erro: erroValidacao }, { status: 400 })
  }

  const inicio = new Date(body.dataInicio)
  const fim = new Date(body.dataFim)

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (error) {
    console.error('[resultados] Supabase não configurado:', error.message)
    return NextResponse.json(
      { erro: 'Servidor não configurado para gravar resultados' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('raven_resultados')
    .insert({
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      telefone: body.telefone?.trim() || null,
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      // Derivado das datas no servidor — não confiamos no número do cliente.
      tempo_total_segundos: Math.max(0, Math.floor((fim - inicio) / 1000)),
      respostas: body.respostas,
    })
    .select('id, pontuacao_total, percentual_acertos')
    .single()

  if (error) {
    console.error('[resultados] Falha ao gravar:', error)
    return NextResponse.json({ erro: 'Falha ao gravar o resultado' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      pontuacao: data.pontuacao_total,
      percentual: data.percentual_acertos,
    },
    { status: 201 }
  )
}
