import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, config, COOKIE_DASHBOARD, hashSenha } from '@/middleware'
import { BOM } from '@/lib/csv'

// A rota entrega nome, email e telefone de todo candidato num arquivo só, então
// a checagem que importa é a da porta: sem cookie, nada sai.

const CANDIDATOS = [
  {
    nome: 'Maria Silva',
    email: 'maria@exemplo.com',
    telefone: '11999998888',
    data_inicio: '2026-07-19T17:30:00.000Z',
    data_fim: '2026-07-19T18:00:00.000Z',
    tempo_total_segundos: 1800,
    tempo_total_minutos: 30,
    acertos_serie_a: 12,
    acertos_serie_b: 12,
    acertos_serie_c: 12,
    acertos_serie_d: 12,
    acertos_serie_e: 12,
    pontuacao_total: 60,
    percentual_acertos: 100,
    classificacao: '🏆 Excepcional (95%+)',
  },
]

let consultas = []

// Dublê que registra o que foi pedido: o que interessa testar é que o export
// aplica os mesmos filtros da tela, não que o PostgREST funciona.
function criarQuery() {
  const registro = { filtro: null, ordens: [] }
  consultas.push(registro)

  const query = {
    select: () => query,
    or: (filtro) => ((registro.filtro = filtro), query),
    order: (coluna, opcoes) => (registro.ordens.push({ coluna, ...opcoes }), query),
    then: (resolver) => resolver({ data: CANDIDATOS, error: null }),
  }
  return query
}

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({ from: () => criarQuery() }),
}))

const { GET } = await import('@/app/api/resultados/export/route')

const pedir = (query = '') => GET(new Request(`http://localhost/api/resultados/export${query}`))

beforeEach(() => {
  consultas = []
})

describe('middleware — quem pode baixar o export', () => {
  const requisicao = (caminho, cookie) => {
    const req = new NextRequest(new Request(`http://localhost${caminho}`))
    if (cookie) req.cookies.set(COOKIE_DASHBOARD, cookie)
    return req
  }

  it('protege a rota de export sem deixar a gravação do candidato fechada', () => {
    // Um matcher amplo demais (ex.: /api/resultados/:path*) derrubaria o teste
    // inteiro: ninguém conseguiria enviar as respostas.
    expect(config.matcher).toContain('/api/resultados/export')
    expect(config.matcher).not.toContain('/api/resultados')
    expect(config.matcher).not.toContain('/api/resultados/:path*')
  })

  it('sem cookie, manda para o login em vez de entregar o arquivo', async () => {
    const resposta = await middleware(requisicao('/api/resultados/export'))

    expect(resposta.status).toBe(307)
    const destino = new URL(resposta.headers.get('location'))
    expect(destino.pathname).toBe('/login')
    expect(destino.searchParams.get('redirect')).toBe('/api/resultados/export')
  })

  it('com cookie errado, também manda para o login', async () => {
    const resposta = await middleware(requisicao('/api/resultados/export', 'hash-inventado'))
    expect(resposta.status).toBe(307)
  })

  it('com o cookie certo, deixa passar', async () => {
    const cookie = await hashSenha(process.env.DASHBOARD_PASSWORD)
    const resposta = await middleware(requisicao('/api/resultados/export', cookie))

    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('location')).toBeNull()
  })
})

describe('GET /api/resultados/export', () => {
  it('responde como arquivo CSV para download', async () => {
    const resposta = await pedir()

    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(resposta.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="resultados-raven-\d{4}-\d{2}-\d{2}\.csv"$/
    )
  })

  it('não deixa dado pessoal em cache', async () => {
    expect((await pedir()).headers.get('Cache-Control')).toBe('no-store')
  })

  it('entrega cabeçalho e uma linha por candidato', async () => {
    const texto = await (await pedir()).text()

    // Sem o BOM: `.text()` remove um BOM inicial ao decodificar, por spec —
    // por isso ele é conferido nos bytes crus, no teste abaixo.
    expect(texto.trimEnd().split('\r\n')).toHaveLength(2)
    expect(texto).toContain('Maria Silva;maria@exemplo.com;11999998888')
  })

  it('põe o BOM nos bytes, senão o Excel estraga os acentos', async () => {
    const bytes = new Uint8Array(await (await pedir()).arrayBuffer())

    // Nos bytes, e não na string: tanto `.text()` quanto o TextDecoder padrão
    // engolem o BOM ao decodificar. Quem vê o arquivo como o Excel vê é isto.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes).startsWith(BOM)).toBe(true)
  })

  it('sem parâmetros, usa a mesma ordenação padrão da tela', async () => {
    await pedir()

    expect(consultas[0].filtro).toBeNull()
    expect(consultas[0].ordens[0]).toMatchObject({ coluna: 'data_fim', ascending: false })
  })

  it('aplica a busca recebida na URL', async () => {
    await pedir('?q=maria')
    expect(consultas[0].filtro).toBe('nome.ilike."%maria%",email.ilike."%maria%"')
  })

  it('aplica a ordenação recebida na URL', async () => {
    await pedir('?ordem=pontuacao&dir=asc')
    expect(consultas[0].ordens[0]).toMatchObject({ coluna: 'pontuacao_total', ascending: true })
  })

  it('ordem inválida na URL cai no padrão em vez de quebrar o download', async () => {
    const resposta = await pedir('?ordem=coluna_inventada&dir=lixo')

    expect(resposta.status).toBe(200)
    expect(consultas[0].ordens[0]).toMatchObject({ coluna: 'data_fim', ascending: false })
  })
})
