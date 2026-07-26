import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, COOKIE_DASHBOARD, hashSenha } from '@/middleware'
import { construirHref } from '@/lib/relatorios-query'

// A porta e o 404 da tela do candidato.
//
// Duas coisas podem dar errado numa rota nova sob /relatorios e nenhuma delas
// aparece olhando a tela funcionar:
//
//   1. a rota nascer aberta — o middleware protege por padrão, mas "por padrão"
//      é uma promessa que só vale enquanto alguém a testa;
//   2. um id que não existe virar "erro ao carregar" em vez de 404, o que faz
//      um link velho parecer sistema quebrado.
//
// `notFound` é dublado para um erro nomeado: o que interessa provar é que a
// página *decide* chamá-lo, não como o Next sinaliza 404 nesta versão.

const NAO_ENCONTRADO = 'NEXT_NOT_FOUND'

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error(NAO_ENCONTRADO)
  },
}))

const ID_VALIDO = '3f2a1c9e-8b7d-4e6f-9a1b-2c3d4e5f6a7b'

const CANDIDATO = {
  id: ID_VALIDO,
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  telefone: '11999998888',
  data_inicio: '2026-07-19T17:30:00.000Z',
  data_fim: '2026-07-19T18:00:00.000Z',
  tempo_total_segundos: 1800,
  acertos_serie_a: 11,
  acertos_serie_b: 10,
  acertos_serie_c: 9,
  acertos_serie_d: 9,
  acertos_serie_e: 8,
  percentual_serie_a: 91.7,
  percentual_serie_b: 83.3,
  percentual_serie_c: 75,
  percentual_serie_d: 75,
  percentual_serie_e: 66.7,
  pontuacao_total: 47,
  percentual_acertos: 78.3,
  classificacao: '🟡 Superior',
  classificacao_descricao: 'Bom nível de inteligência fluida.',
  classificacao_ordem: 3,
  respostas: Array.from({ length: 60 }, () => 1),
}

const RESUMO = { total_candidatos: 12, tempo_medio_minutos: 40, pontuacao_media: 38.5 }

const ESCALA = [
  { ordem: 1, classificacao: '🔵 Excepcional', pontuacao_minima: 57, pontuacao_maxima: 60 },
  { ordem: 3, classificacao: '🟡 Superior', pontuacao_minima: 45, pontuacao_maxima: 53 },
]

// O que cada tabela devolve nesta execução. Os testes reescrevem o que precisam.
let respostasDoBanco = {}
let consultas = []

function criarQuery(tabela) {
  const registro = { tabela, filtros: {}, ordens: [] }
  consultas.push(registro)

  const resultado = () => respostasDoBanco[tabela] ?? { data: null, error: null }

  const query = {
    select: () => query,
    eq: (coluna, valor) => ((registro.filtros[coluna] = valor), query),
    order: (coluna) => (registro.ordens.push(coluna), query),
    maybeSingle: () => Promise.resolve(resultado()),
    then: (resolver) => resolver(resultado()),
  }
  return query
}

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({ from: (tabela) => criarQuery(tabela) }),
}))

const { default: Candidato } = await import('@/app/relatorios/[id]/page')

const abrir = (id, consulta = {}) =>
  Candidato({ params: Promise.resolve({ id }), searchParams: Promise.resolve(consulta) })

beforeEach(() => {
  consultas = []
  respostasDoBanco = {
    raven_resultados_detalhe: { data: CANDIDATO, error: null },
    raven_dashboard_resumo: { data: RESUMO, error: null },
    raven_escala_classificacao: { data: ESCALA, error: null },
  }
})

describe('middleware — quem abre a ficha de um candidato', () => {
  const requisicao = (caminho, cookie) => {
    const req = new NextRequest(new Request(`http://localhost${caminho}`))
    if (cookie) req.cookies.set(COOKIE_DASHBOARD, cookie)
    return req
  }

  it('sem cookie, manda para o login em vez de mostrar o candidato', async () => {
    const resposta = await middleware(requisicao(`/relatorios/${ID_VALIDO}`))

    expect(resposta.status).toBe(307)
    const destino = new URL(resposta.headers.get('location'))
    expect(destino.pathname).toBe('/login')
    // O redirect volta para a ficha depois do login, não para a lista.
    expect(destino.searchParams.get('redirect')).toBe(`/relatorios/${ID_VALIDO}`)
  })

  it('com cookie errado, também manda para o login', async () => {
    const resposta = await middleware(requisicao(`/relatorios/${ID_VALIDO}`, 'hash-inventado'))
    expect(resposta.status).toBe(307)
  })

  it('com o cookie certo, deixa passar', async () => {
    const cookie = await hashSenha(process.env.DASHBOARD_PASSWORD)
    const resposta = await middleware(requisicao(`/relatorios/${ID_VALIDO}`, cookie))

    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('location')).toBeNull()
  })
})

describe('/relatorios/[id] — id que não leva a lugar nenhum', () => {
  it('id fora do formato uuid dá 404 sem consultar o banco', async () => {
    await expect(abrir('nao-e-uuid')).rejects.toThrow(NAO_ENCONTRADO)

    // Barrar antes da consulta importa: um id torto chegaria ao Postgres como
    // erro de sintaxe e viraria "falha ao carregar", que é a mensagem errada.
    expect(consultas).toHaveLength(0)
  })

  it('recusa também os formatos que quase passam', async () => {
    const quaseUuid = [
      '3f2a1c9e8b7d4e6f9a1b2c3d4e5f6a7b', // sem hífens
      '3f2a1c9e-8b7d-4e6f-9a1b-2c3d4e5f6a7', // um dígito a menos
      '3f2a1c9e-8b7d-4e6f-9a1b-2c3d4e5f6a7z', // caractere fora do hexa
      `${ID_VALIDO} or 1=1`,
      '',
    ]

    for (const id of quaseUuid) {
      await expect(abrir(id), id).rejects.toThrow(NAO_ENCONTRADO)
    }
  })

  it('uuid válido sem linha no banco dá 404, não erro', async () => {
    respostasDoBanco.raven_resultados_detalhe = { data: null, error: null }

    await expect(abrir(ID_VALIDO)).rejects.toThrow(NAO_ENCONTRADO)
  })

  it('falha do banco não vira 404 — 404 mentiria sobre o candidato existir', async () => {
    respostasDoBanco.raven_resultados_detalhe = {
      data: null,
      error: { message: 'conexão recusada' },
    }

    // Renderiza a mensagem de erro em vez de sumir com o candidato.
    await expect(abrir(ID_VALIDO)).resolves.toBeTruthy()
  })
})

describe('/relatorios/[id] — o que a página busca', () => {
  it('lê o candidato, os agregados da base e a escala normativa', async () => {
    await abrir(ID_VALIDO)

    const tabelas = consultas.map((c) => c.tabela)
    expect(tabelas).toContain('raven_resultados_detalhe')
    expect(tabelas).toContain('raven_dashboard_resumo')
    expect(tabelas).toContain('raven_escala_classificacao')
  })

  it('filtra o candidato pelo id da rota', async () => {
    await abrir(ID_VALIDO)

    const detalhe = consultas.find((c) => c.tabela === 'raven_resultados_detalhe')
    expect(detalhe.filtros.id).toBe(ID_VALIDO)
  })

  it('pede a escala em ordem, senão a régua sai embaralhada', async () => {
    await abrir(ID_VALIDO)

    const escala = consultas.find((c) => c.tabela === 'raven_escala_classificacao')
    expect(escala.ordens).toContain('ordem')
  })

  it('não quebra quando a base ainda não tem agregados', async () => {
    // Primeiro candidato do processo: sem média com que comparar, a tela ainda
    // precisa abrir e mostrar o que é dele.
    respostasDoBanco.raven_dashboard_resumo = { data: null, error: null }

    await expect(abrir(ID_VALIDO)).resolves.toBeTruthy()
  })
})

describe('ida e volta entre a lista e a ficha', () => {
  it('o link da lista carrega busca e ordenação para dentro da ficha', () => {
    expect(
      construirHref({
        busca: 'maria',
        ordem: 'pontuacao',
        direcao: 'asc',
        base: `/relatorios/${ID_VALIDO}`,
      })
    ).toBe(`/relatorios/${ID_VALIDO}?q=maria&ordem=pontuacao&dir=asc`)
  })

  it('sem busca nem ordenação fora do padrão, o link fica limpo', () => {
    expect(
      construirHref({ busca: '', ordem: 'data', direcao: 'desc', base: `/relatorios/${ID_VALIDO}` })
    ).toBe(`/relatorios/${ID_VALIDO}`)
  })

  it('o voltar da ficha reconstrói a lista com o mesmo filtro', () => {
    // Mesmos parâmetros, base de volta na lista: é isso que faz o RH não perder
    // a busca que acabou de montar ao abrir um candidato e voltar.
    expect(construirHref({ busca: 'maria', ordem: 'pontuacao', direcao: 'asc' })).toBe(
      '/relatorios?q=maria&ordem=pontuacao&dir=asc'
    )
  })
})
