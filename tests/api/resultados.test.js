import { describe, it, expect, beforeEach, vi } from 'vitest'
import { gabarito, calcularPontuacao, series } from '@/lib/quiz-data'

// Testes da fronteira de confiança do sistema (PRD seção 7b).
//
// O Supabase é dublê aqui de propósito: o que esta rota promete é *o que ela
// manda gravar*, não o que o Postgres devolve — isso já é coberto, contra o
// banco real, em tests/db/pontuacao.test.js. Dublar também evita inserir
// candidatos falsos na tabela que o RH lê.

const insertsCapturados = []

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      insert: (linha) => {
        insertsCapturados.push(linha)
        return {
          select: () => ({
            // Emula as colunas GENERATED: a nota sai das respostas gravadas,
            // exatamente como o banco faz.
            single: async () => ({
              data: {
                id: '00000000-0000-4000-8000-000000000000',
                pontuacao_total: calcularPontuacao(linha.respostas),
                percentual_acertos:
                  Math.round((calcularPontuacao(linha.respostas) / 60) * 10000) / 100,
              },
              error: null,
            }),
          }),
        }
      },
    }),
  }),
}))

const { POST } = await import('@/app/api/resultados/route')

const INICIO = '2026-07-24T14:00:00.000Z'
const FIM = '2026-07-24T14:42:00.000Z'

const payloadValido = (extra = {}) => ({
  nome: 'Maria Teste',
  email: 'maria@exemplo.com',
  telefone: '11999998888',
  dataInicio: INICIO,
  dataFim: FIM,
  respostas: [...gabarito],
  ...extra,
})

const postar = (body) =>
  POST(
    new Request('http://localhost/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  )

beforeEach(() => {
  insertsCapturados.length = 0
})

describe('POST /api/resultados — validação do payload', () => {
  it('aceita um payload completo e responde 201', async () => {
    const resposta = await postar(payloadValido())
    expect(resposta.status).toBe(201)
    expect(insertsCapturados).toHaveLength(1)
  })

  it('rejeita 59 respostas com 400 e não grava nada', async () => {
    const resposta = await postar(payloadValido({ respostas: gabarito.slice(0, 59) }))

    expect(resposta.status).toBe(400)
    expect((await resposta.json()).erro).toMatch(/59/)
    expect(insertsCapturados).toHaveLength(0)
  })

  it('rejeita 61 respostas com 400 e não grava nada', async () => {
    const resposta = await postar(payloadValido({ respostas: [...gabarito, 1] }))

    expect(resposta.status).toBe(400)
    expect(insertsCapturados).toHaveLength(0)
  })

  it('rejeita a opção 7 na série A, que só tem 6 opções', async () => {
    const respostas = [...gabarito]
    respostas[0] = 7

    const resposta = await postar(payloadValido({ respostas }))

    expect(resposta.status).toBe(400)
    expect((await resposta.json()).erro).toMatch(/questão 1/)
    expect(insertsCapturados).toHaveLength(0)
  })

  it('aceita a opção 7 na série C, que tem 8 opções — o limite é por série', async () => {
    const respostas = [...gabarito]
    respostas[series.C.inicio - 1] = 7

    expect((await postar(payloadValido({ respostas }))).status).toBe(201)
  })

  it('rejeita dataFim anterior a dataInicio', async () => {
    const resposta = await postar(payloadValido({ dataInicio: FIM, dataFim: INICIO }))

    expect(resposta.status).toBe(400)
    expect((await resposta.json()).erro).toMatch(/dataFim/)
    expect(insertsCapturados).toHaveLength(0)
  })

  it('rejeita resposta não-inteira e resposta zero', async () => {
    for (const invalida of [0, -1, 2.5, null, '3']) {
      const respostas = [...gabarito]
      respostas[0] = invalida
      expect((await postar(payloadValido({ respostas }))).status, `resposta ${invalida}`).toBe(400)
    }
    expect(insertsCapturados).toHaveLength(0)
  })

  it('rejeita nome vazio e email sem @', async () => {
    expect((await postar(payloadValido({ nome: '   ' }))).status).toBe(400)
    expect((await postar(payloadValido({ email: 'maria.exemplo.com' }))).status).toBe(400)
    expect(insertsCapturados).toHaveLength(0)
  })

  it('rejeita JSON malformado com 400', async () => {
    expect((await postar('{isso não é json')).status).toBe(400)
  })
})

describe('POST /api/resultados — pontuação forjada pelo cliente', () => {
  it('ignora "pontuacao: 60" e grava a nota real das respostas erradas', async () => {
    // Erra tudo, mantendo cada resposta dentro do intervalo válido da questão.
    const todasErradas = gabarito.map((correta, i) => (correta % (i < 24 ? 6 : 8)) + 1)

    const resposta = await postar(
      payloadValido({ respostas: todasErradas, pontuacao: 60, percentualAcertos: 100 })
    )

    expect(resposta.status).toBe(201)
    expect((await resposta.json()).pontuacao).toBe(0)

    // O número forjado não pode nem chegar ao INSERT: o gabarito só existe no banco.
    const [linha] = insertsCapturados
    expect(linha).not.toHaveProperty('pontuacao')
    expect(linha).not.toHaveProperty('percentual_acertos')
    expect(linha.respostas).toEqual(todasErradas)
  })

  it('ignora tempoTotalSegundos do cliente e deriva das datas no servidor', async () => {
    await postar(payloadValido({ tempoTotalSegundos: 1 }))

    // 14:00 → 14:42 são 42 minutos, independente do que o cliente afirme.
    expect(insertsCapturados[0].tempo_total_segundos).toBe(42 * 60)
  })
})
