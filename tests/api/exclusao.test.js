import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, config, COOKIE_DASHBOARD, hashSenha } from '@/middleware'

// A rota que apaga dados de candidato.
//
// Duas coisas aqui são mais perigosas que o resto do sistema junto:
//
//   1. a rota nascer aberta. O matcher do middleware é deliberadamente estreito
//      para /api/resultados continuar público (é por onde o candidato grava o
//      teste). Uma rota de exclusão que não seja listada fica exposta — e uma
//      exclusão exposta é qualquer um na internet apagando o processo seletivo.
//
//   2. o escopo escapar. "Apagar esta tentativa" que apaga o candidato inteiro
//      destrói dado que ninguém mandou destruir, e não há de onde voltar.

const ID = '3f2a1c9e-8b7d-4e6f-9a1b-2c3d4e5f6a7b'

const ALVO = { id: ID, email: 'maria@exemplo.com', nome: 'Maria Silva' }

let linhaAlvo = null
let deletes = []

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => {
      const registro = { filtros: {}, apagou: false }
      const consulta = {
        select: () => consulta,
        delete: () => ((registro.apagou = true), deletes.push(registro), consulta),
        eq: (coluna, valor) => ((registro.filtros[coluna] = valor), consulta),
        maybeSingle: async () => ({ data: linhaAlvo, error: null }),
        then: (resolver) => resolver({ data: registro.apagou ? [{ id: ID }] : null, error: null }),
      }
      return consulta
    },
  }),
}))

const { DELETE } = await import('@/app/api/admin/resultados/[id]/route')

const excluir = (id = ID, escopo) =>
  DELETE(
    new Request(
      `http://localhost/api/admin/resultados/${id}${escopo ? `?escopo=${escopo}` : ''}`,
      { method: 'DELETE' }
    ),
    { params: Promise.resolve({ id }) }
  )

beforeEach(() => {
  linhaAlvo = ALVO
  deletes = []
})

describe('middleware — a rota de exclusão está fechada', () => {
  const requisicao = (caminho, cookie) => {
    const req = new NextRequest(new Request(`http://localhost${caminho}`, { method: 'DELETE' }))
    if (cookie) req.cookies.set(COOKIE_DASHBOARD, cookie)
    return req
  }

  it('o matcher cobre /api/admin sem cobrir a gravação do candidato', () => {
    expect(config.matcher).toContain('/api/admin/:path*')

    // Se alguém "simplificar" o matcher para /api/resultados/:path*, isto
    // quebra — e é o que impediria qualquer candidato de concluir o teste.
    expect(config.matcher).not.toContain('/api/resultados/:path*')
    expect(config.matcher).not.toContain('/api/:path*')
  })

  it('sem cookie, não deixa apagar nada', async () => {
    const resposta = await middleware(requisicao(`/api/admin/resultados/${ID}`))

    expect(resposta.status).toBe(307)
    expect(new URL(resposta.headers.get('location')).pathname).toBe('/login')
  })

  it('com cookie errado, também não', async () => {
    const resposta = await middleware(requisicao(`/api/admin/resultados/${ID}`, 'hash-inventado'))
    expect(resposta.status).toBe(307)
  })

  it('com o cookie certo, passa', async () => {
    const cookie = await hashSenha(process.env.DASHBOARD_PASSWORD)
    const resposta = await middleware(requisicao(`/api/admin/resultados/${ID}`, cookie))

    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('location')).toBeNull()
  })

  it('a gravação do candidato continua aberta', async () => {
    // A regressão mais cara possível: proteger demais e ninguém consegue mais
    // fazer o teste.
    const caminhos = ['/api/resultados', '/quiz/1', '/instrucoes', '/']
    for (const caminho of caminhos) {
      const casa = config.matcher.some((m) =>
        new RegExp(`^${m.replace('/:path*', '(/.*)?')}$`).test(caminho)
      )
      expect(casa, `${caminho} não pode estar atrás do login`).toBe(false)
    }
  })
})

describe('DELETE — escopo', () => {
  it('por padrão apaga só a tentativa, filtrando por id', async () => {
    const resposta = await excluir(ID)
    expect(resposta.status).toBe(200)

    expect(deletes).toHaveLength(1)
    expect(deletes[0].filtros).toEqual({ id: ID })
    expect(deletes[0].filtros.email).toBeUndefined()
  })

  it('com escopo=candidato apaga por email, alcançando todas as tentativas', async () => {
    await excluir(ID, 'candidato')

    expect(deletes[0].filtros).toEqual({ email: ALVO.email })
  })

  it('o email vem do banco, nunca da URL', async () => {
    // Aceitar email por parâmetro deixaria qualquer um apagar qualquer pessoa
    // conhecendo só o endereço — e colocaria dado pessoal no log de acesso.
    const resposta = await DELETE(
      new Request(
        `http://localhost/api/admin/resultados/${ID}?escopo=candidato&email=outra@vitima.com`,
        { method: 'DELETE' }
      ),
      { params: Promise.resolve({ id: ID }) }
    )

    expect(resposta.status).toBe(200)
    expect(deletes[0].filtros.email).toBe(ALVO.email)
  })

  it('escopo desconhecido é recusado, sem apagar nada', async () => {
    const resposta = await excluir(ID, 'tudo')

    expect(resposta.status).toBe(400)
    expect(deletes).toHaveLength(0)
  })
})

describe('DELETE — alvo inexistente ou inválido', () => {
  it('id fora do formato uuid dá 400 e não consulta o banco', async () => {
    const resposta = await excluir('nao-e-uuid')

    expect(resposta.status).toBe(400)
    expect(deletes).toHaveLength(0)
  })

  it('id válido que não existe dá 404, sem apagar', async () => {
    linhaAlvo = null

    const resposta = await excluir(ID)

    expect(resposta.status).toBe(404)
    expect(deletes).toHaveLength(0)
  })
})
