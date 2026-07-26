import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { series } from '@/lib/quiz-data'
import { gabarito } from '@/lib/gabarito-servidor'

// Testes do coração do sistema: o gabarito e a contagem de acertos, que vivem
// dentro do Postgres (PRD seção 8.2). Só leem — chamam as funções IMMUTABLE via
// RPC e nunca inserem nada, então rodar contra o projeto real é seguro e não
// suja o dashboard do RH.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
const temCredenciais = Boolean(url && chave)

if (!temCredenciais) {
  console.warn(
    '\n[tests/db] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes — ' +
      'os testes de pontuação foram PULADOS, não aprovados.\n'
  )
}

const supabase = temCredenciais
  ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

async function acertos(respostas, qInicio, qFim) {
  const { data, error } = await supabase.rpc('raven_acertos', {
    respostas,
    q_inicio: qInicio,
    q_fim: qFim,
  })
  if (error) throw new Error(`raven_acertos falhou: ${error.message}`)
  return data
}

// Erra de propósito mantendo a resposta dentro do intervalo válido da questão:
// rodar 1 posição no ciclo de opções nunca cai de volta na correta.
const errarTodas = (corretas, opcoes) => corretas.map((c) => (c % opcoes) + 1)

describe.skipIf(!temCredenciais)('raven_gabarito', () => {
  it('bate exatamente com o gabarito que o app usa para exibir o resultado', async () => {
    const { data, error } = await supabase.rpc('raven_gabarito')
    expect(error).toBeNull()

    // Se este teste falhar, candidato e banco discordam sobre o que é acerto —
    // a tela mostra um número e a base guarda outro.
    expect(data).toEqual(gabarito)
  })
})

describe.skipIf(!temCredenciais)('raven_acertos', () => {
  it('conta 60/60 quando as respostas são o próprio gabarito', async () => {
    expect(await acertos(gabarito, 1, 60)).toBe(60)
  })

  it('conta 12/12 em cada série quando as respostas são o próprio gabarito', async () => {
    for (const [letra, { inicio, fim }] of Object.entries(series)) {
      expect(await acertos(gabarito, inicio, fim), `série ${letra}`).toBe(12)
    }
  })

  it('conta 0 quando toda resposta está errada', async () => {
    const todasErradas = gabarito.map((correta, i) => {
      const opcoes = i < 24 ? 6 : 8
      return (correta % opcoes) + 1
    })
    expect(await acertos(todasErradas, 1, 60)).toBe(0)
  })

  it('isola a série A: zerá-la dá 48/60 no total e 0 na própria série', async () => {
    const respostas = [...gabarito]
    const { inicio, fim, opcoes } = series.A
    const erradas = errarTodas(gabarito.slice(inicio - 1, fim), opcoes)
    respostas.splice(inicio - 1, erradas.length, ...erradas)

    expect(await acertos(respostas, 1, 60)).toBe(48)
    expect(await acertos(respostas, series.A.inicio, series.A.fim)).toBe(0)
    expect(await acertos(respostas, series.B.inicio, series.B.fim)).toBe(12)
    expect(await acertos(respostas, series.E.inicio, series.E.fim)).toBe(12)
  })

  it('conta uma pontuação parcial conhecida: 3 acertos plantados na série C', async () => {
    const { inicio, fim, opcoes } = series.C
    const respostas = [...gabarito]
    const errada = (c) => (c % opcoes) + 1

    // Erra a série C inteira, depois devolve o gabarito em 3 posições.
    for (let n = inicio; n <= fim; n++) respostas[n - 1] = errada(gabarito[n - 1])
    for (const n of [inicio, inicio + 5, fim]) respostas[n - 1] = gabarito[n - 1]

    expect(await acertos(respostas, inicio, fim)).toBe(3)
    expect(await acertos(respostas, 1, 60)).toBe(51)
  })
})
