import { describe, it, expect, beforeEach, vi } from 'vitest'
import { gabarito } from '@/lib/gabarito-servidor'

// O que a rota faz quando a mesma execução chega duas vezes.
//
// Reenvio não é hipótese: aconteceu 48 vezes no sistema antigo (um candidato
// acumulou 29 linhas do mesmo teste) e 2 vezes no novo, porque a tela de
// resultado regravava o payload a cada visita. O conserto tem duas camadas —
// o cliente limpa o localStorage, e o banco recusa (email, data_inicio)
// repetido. Este arquivo cobre a terceira: como a API responde quando a trava
// do banco dispara.
//
// A resposta importa. Um 500 aqui faria a tela dizer "falha ao gravar" a um
// candidato cujo teste está salvo — e um candidato que vê falha tenta de novo.

const INICIO = '2026-07-24T14:00:00.000Z'
const FIM = '2026-07-24T14:42:00.000Z'

const EXISTENTE = {
  id: '11111111-1111-4111-8111-111111111111',
  pontuacao_total: 47,
  percentual_acertos: 78.33,
}

// Controla o que o banco dublê faz neste teste.
let erroDoInsert = null
let linhaExistente = null
let buscas = []

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => {
      const filtros = {}
      const consulta = {
        insert: () => ({
          select: () => ({
            single: async () =>
              erroDoInsert
                ? { data: null, error: erroDoInsert }
                : { data: EXISTENTE, error: null },
          }),
        }),
        select: () => consulta,
        eq: (coluna, valor) => ((filtros[coluna] = valor), consulta),
        maybeSingle: async () => {
          buscas.push({ ...filtros })
          return { data: linhaExistente, error: null }
        },
      }
      return consulta
    },
  }),
}))

const { POST } = await import('@/app/api/resultados/route')

const postar = (extra = {}) =>
  POST(
    new Request('http://localhost/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Maria Teste',
        email: 'Maria@Exemplo.com',
        telefone: '11999998888',
        dataInicio: INICIO,
        dataFim: FIM,
        respostas: [...gabarito],
        ...extra,
      }),
    })
  )

beforeEach(() => {
  erroDoInsert = null
  linhaExistente = null
  buscas = []
})

describe('POST /api/resultados — primeira gravação', () => {
  it('grava e responde 201', async () => {
    const resposta = await postar()
    expect(resposta.status).toBe(201)

    const corpo = await resposta.json()
    expect(corpo.id).toBe(EXISTENTE.id)
    expect(corpo.pontuacao).toBe(47)
    // Só o reenvio carrega esta marca.
    expect(corpo.jaRegistrado).toBeUndefined()
  })
})

describe('POST /api/resultados — reenvio da mesma execução', () => {
  beforeEach(() => {
    // 23505: violação de unicidade — o índice (email, data_inicio) disparou.
    erroDoInsert = { code: '23505', message: 'duplicate key value violates unique constraint' }
    linhaExistente = EXISTENTE
  })

  it('responde 200, e não 500 — o teste do candidato está salvo', async () => {
    const resposta = await postar()

    expect(resposta.status).toBe(200)
    expect(resposta.status).not.toBe(500)
  })

  it('devolve a nota que já estava gravada, não uma nota nova', async () => {
    const corpo = await (await postar()).json()

    expect(corpo).toMatchObject({
      id: EXISTENTE.id,
      pontuacao: 47,
      percentual: 78.33,
      jaRegistrado: true,
    })
  })

  it('procura a linha existente pela sessão, não pelo email sozinho', async () => {
    // Buscar só por email traria a tentativa errada de quem fez o teste duas
    // vezes — e a tela mostraria ao candidato a nota da outra tentativa.
    await postar()

    expect(buscas).toHaveLength(1)
    expect(buscas[0]).toEqual({ email: 'maria@exemplo.com', data_inicio: INICIO })
  })

  it('normaliza o email antes de procurar, como faz ao gravar', async () => {
    // O insert grava em minúsculas; procurar com o que veio do cliente
    // ("Maria@Exemplo.com") não acharia a linha e cairia em 500.
    await postar({ email: '  MARIA@exemplo.COM  ' })

    expect(buscas[0].email).toBe('maria@exemplo.com')
  })

  it('se a busca não achar a linha, aí sim é erro de verdade', async () => {
    // Unicidade violada mas nada encontrado significa que o 23505 veio de
    // outra restrição — algo que não entendemos, e que não pode virar sucesso.
    linhaExistente = null

    const resposta = await postar()
    expect(resposta.status).toBe(500)
  })
})

describe('POST /api/resultados — outras falhas do banco', () => {
  it('continuam sendo 500, sem procurar linha nenhuma', async () => {
    erroDoInsert = { code: '08006', message: 'connection failure' }

    const resposta = await postar()

    expect(resposta.status).toBe(500)
    expect(buscas).toHaveLength(0)
  })
})
