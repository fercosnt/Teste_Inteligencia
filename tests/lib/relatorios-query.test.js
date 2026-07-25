import { describe, it, expect } from 'vitest'
import {
  ORDENS,
  ORDEM_PADRAO,
  DIRECAO_PADRAO,
  normalizarOrdem,
  normalizarBusca,
  filtroBusca,
  construirHref,
  proximaDirecao,
} from '@/lib/relatorios-query'

describe('normalizarOrdem', () => {
  it('usa data decrescente quando a URL não diz nada', () => {
    expect(normalizarOrdem(undefined, undefined)).toMatchObject({
      ordem: ORDEM_PADRAO,
      direcao: DIRECAO_PADRAO,
      coluna: 'data_fim',
      ascendente: false,
    })
  })

  it('aceita cada ordem prevista', () => {
    for (const [chave, { coluna }] of Object.entries(ORDENS)) {
      expect(normalizarOrdem(chave, 'asc')).toMatchObject({ ordem: chave, coluna, ascendente: true })
    }
  })

  it('cai no padrão em vez de quebrar com ordem inválida', () => {
    for (const lixo of ['pontuacao_total; drop table', 'senha', '', null, 42, {}]) {
      expect(normalizarOrdem(lixo, 'asc').ordem, `ordem ${JSON.stringify(lixo)}`).toBe(ORDEM_PADRAO)
    }
  })

  it('não deixa uma chave herdada de Object virar coluna', () => {
    expect(normalizarOrdem('constructor', 'asc').ordem).toBe(ORDEM_PADRAO)
    expect(normalizarOrdem('toString', 'asc').ordem).toBe(ORDEM_PADRAO)
  })

  it('cai no padrão com direção inválida, preservando a ordem válida', () => {
    expect(normalizarOrdem('pontuacao', 'crescente')).toMatchObject({
      ordem: 'pontuacao',
      direcao: DIRECAO_PADRAO,
    })
  })
})

describe('normalizarBusca', () => {
  it('tira espaços das pontas e trata ausência como busca vazia', () => {
    expect(normalizarBusca('  maria  ')).toBe('maria')
    expect(normalizarBusca('   ')).toBe('')
    expect(normalizarBusca(undefined)).toBe('')
    expect(normalizarBusca(['maria'])).toBe('')
  })
})

describe('filtroBusca', () => {
  it('não filtra nada quando a busca está vazia', () => {
    expect(filtroBusca('')).toBeNull()
  })

  it('procura o termo em nome e em email', () => {
    expect(filtroBusca('maria')).toBe('nome.ilike."%maria%",email.ilike."%maria%"')
  })

  // As barras aparecem dobradas porque passam por duas camadas: o `\` que
  // protege o curinga do LIKE precisa, ele próprio, sobreviver ao parser de
  // valor entre aspas do PostgREST.
  it('trata curingas do LIKE como texto literal', () => {
    // Sem escapar, "50%" casaria com todo mundo e "_" com qualquer caractere.
    expect(filtroBusca('50%')).toContain(String.raw`"%50\\%%"`)
    expect(filtroBusca('a_b')).toContain(String.raw`"%a\\_b%"`)
  })

  it('não deixa vírgula do termo virar separador do filtro', () => {
    // Uma vírgula solta partiria o `or` em condições extras.
    const filtro = filtroBusca('Silva, Maria')
    expect(filtro.split('email.ilike')).toHaveLength(2)
    expect(filtro).toContain('"%Silva, Maria%"')
  })

  it('escapa aspas e barras, que fechariam o valor cedo demais', () => {
    expect(filtroBusca('a"b')).toContain(String.raw`"%a\"b%"`)
    expect(filtroBusca('a\\b')).toContain(String.raw`"%a\\\\b%"`)
  })
})

describe('construirHref', () => {
  it('omite os valores padrão para deixar a URL limpa', () => {
    expect(construirHref({ busca: '', ordem: ORDEM_PADRAO, direcao: DIRECAO_PADRAO })).toBe(
      '/relatorios'
    )
  })

  it('mantém a busca ao trocar a ordenação, e vice-versa', () => {
    const href = construirHref({ busca: 'maria', ordem: 'pontuacao', direcao: 'asc' })
    expect(href).toBe('/relatorios?q=maria&ordem=pontuacao&dir=asc')
  })

  it('codifica termo com caracteres especiais', () => {
    const href = construirHref({ busca: 'Silva, Maria & cia', ordem: ORDEM_PADRAO, direcao: DIRECAO_PADRAO })
    expect(href).toBe('/relatorios?q=Silva%2C+Maria+%26+cia')
    expect(new URL(href, 'http://x').searchParams.get('q')).toBe('Silva, Maria & cia')
  })
})

describe('proximaDirecao', () => {
  it('inverte quando se clica na coluna já ativa', () => {
    expect(proximaDirecao('pontuacao', 'pontuacao', 'desc')).toBe('asc')
    expect(proximaDirecao('pontuacao', 'pontuacao', 'asc')).toBe('desc')
  })

  it('começa pela direção que faz sentido para a coluna nova', () => {
    expect(proximaDirecao('pontuacao', 'data', 'desc')).toBe('desc') // nota alta primeiro
    expect(proximaDirecao('nome', 'data', 'desc')).toBe('asc') // A a Z
    expect(proximaDirecao('tempo', 'data', 'desc')).toBe('asc') // mais rápido primeiro
  })
})
