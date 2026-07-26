import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { gabarito } from '@/lib/gabarito-servidor'
import { montarEscala, proximaFaixa } from '@/lib/relatorios-candidato'

// A régua normativa da tela do candidato, contra o Postgres de verdade.
//
// A tela afirma duas coisas ao mesmo tempo sobre a mesma pessoa: um rótulo
// ("🟡 Superior", que vem pronto da view de detalhe) e uma posição desenhada na
// régua (que o JavaScript calcula a partir de raven_escala_classificacao). Se
// as duas fontes divergirem, a tela se contradiz sozinha — escreve "Superior" e
// aponta para o segmento de "Médio-superior" — e nada explode para avisar.
//
// Por isso o teste não se contenta em conferir o formato da view: ele grava um
// candidato dentro de cada uma das sete faixas e exige que o desenho concorde
// com o rótulo que o próprio banco atribuiu àquela linha.
//
// Como tests/db/busca.test.js, este PRECISA escrever. Mesmo domínio `.invalid`,
// mesma limpeza no começo e no fim.

const DOMINIO = '@teste-automatizado.invalid'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
const temCredenciais = Boolean(url && chave)

if (!temCredenciais) {
  console.warn(
    '\n[tests/db] Credenciais ausentes — os testes da escala foram PULADOS, não aprovados.\n'
  )
}

const supabase = temCredenciais
  ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

// Os cortes da escala normativa do SPM. Duplicados de propósito: se alguém
// mexer em raven_classificacao() no banco, é aqui que o alarme toca, e a
// mensagem lembra de atualizar também o fixture de tests/lib.
const CORTES_ESPERADOS = [
  { ordem: 1, minima: 57, maxima: 60 },
  { ordem: 2, minima: 54, maxima: 56 },
  { ordem: 3, minima: 45, maxima: 53 },
  { ordem: 4, minima: 36, maxima: 44 },
  { ordem: 5, minima: 25, maxima: 35 },
  { ordem: 6, minima: 20, maxima: 24 },
  { ordem: 7, minima: 0, maxima: 19 },
]

// Uma pontuação representativa dentro de cada faixa, incluindo os dois extremos
// da tabela (60 e 0) e os primeiros acertos de duas faixas — 45 e 25 são os
// pontos onde um off-by-one na régua apareceria.
const PONTUACOES = [60, 57, 55, 45, 47, 36, 25, 30, 22, 19, 0]

const errar = (correta, opcoes) => (correta % opcoes) + 1
const respostasCom = (acertos) =>
  gabarito.map((c, i) => (i < acertos ? c : errar(c, i < 24 ? 6 : 8)))

const limpar = () => supabase.from('raven_resultados').delete().like('email', `%${DOMINIO}`)

let faixas = []
let candidatos = []

beforeAll(async () => {
  if (!temCredenciais) return

  await limpar()

  const escala = await supabase.from('raven_escala_classificacao').select('*').order('ordem')
  if (escala.error) throw new Error(`não consegui ler a escala: ${escala.error.message}`)
  faixas = escala.data

  const fim = new Date('2026-07-21T18:00:00.000Z')
  const linhas = PONTUACOES.map((p, i) => ({
    nome: `Escala ${p}`,
    email: `escala.${p}${DOMINIO}`,
    data_inicio: new Date(fim.getTime() - i * 3600000 - 1800000),
    data_fim: new Date(fim.getTime() - i * 3600000),
    tempo_total_segundos: 1800,
    respostas: respostasCom(p),
  }))

  const { error } = await supabase.from('raven_resultados').insert(linhas)
  if (error) throw new Error(`não consegui preparar os dados de teste: ${error.message}`)

  const lidos = await supabase
    .from('raven_resultados_detalhe')
    .select('nome, pontuacao_total, classificacao, classificacao_ordem')
    .like('email', `%${DOMINIO}`)

  if (lidos.error) throw new Error(`não consegui ler os candidatos: ${lidos.error.message}`)
  candidatos = lidos.data
})

afterAll(async () => {
  if (temCredenciais) await limpar()
})

describe.skipIf(!temCredenciais)('view raven_escala_classificacao', () => {
  it('entrega as sete faixas da escala, da melhor para a pior', () => {
    expect(faixas).toHaveLength(7)
    expect(faixas.map((f) => f.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('mantém os cortes da tabela normativa do SPM', () => {
    const cortes = faixas.map((f) => ({
      ordem: f.ordem,
      minima: f.pontuacao_minima,
      maxima: f.pontuacao_maxima,
    }))

    expect(
      cortes,
      'a escala do banco mudou — atualize também o fixture FAIXAS em tests/lib/relatorios-candidato.test.js'
    ).toEqual(CORTES_ESPERADOS)
  })

  it('cobre 0 a 60 sem buraco e sem sobreposição', () => {
    // Um buraco deixaria uma pontuação sem faixa e a régua sem marcador; uma
    // sobreposição marcaria duas faixas para o mesmo candidato.
    const doPiorAoMelhor = [...faixas].sort((a, b) => b.ordem - a.ordem)

    expect(doPiorAoMelhor[0].pontuacao_minima).toBe(0)
    expect(doPiorAoMelhor.at(-1).pontuacao_maxima).toBe(60)

    for (let i = 1; i < doPiorAoMelhor.length; i++) {
      expect(doPiorAoMelhor[i].pontuacao_minima).toBe(doPiorAoMelhor[i - 1].pontuacao_maxima + 1)
    }
  })

  it('declara uma amplitude coerente com o próprio intervalo', () => {
    for (const f of faixas) {
      expect(f.amplitude, f.classificacao).toBe(f.pontuacao_maxima - f.pontuacao_minima + 1)
    }
  })

  it('traz a descrição de cada faixa, para a tela não ficar só com o rótulo', () => {
    for (const f of faixas) {
      expect(f.classificacao_descricao, f.classificacao).toBeTruthy()
    }
  })
})

describe.skipIf(!temCredenciais)('a régua concorda com a classificação do banco', () => {
  it('gravou um candidato em cada pontuação pedida', () => {
    expect(candidatos.map((c) => c.pontuacao_total).sort((a, b) => a - b)).toEqual(
      [...PONTUACOES].sort((a, b) => a - b)
    )
  })

  it('a faixa que a régua destaca é a mesma que o banco rotulou', () => {
    for (const c of candidatos) {
      const destacada = montarEscala(faixas, c.pontuacao_total).find((f) => f.atual)

      expect(destacada, `pontuação ${c.pontuacao_total} ficou sem faixa`).toBeDefined()
      expect(destacada.classificacao, `pontuação ${c.pontuacao_total}`).toBe(c.classificacao)
      expect(destacada.ordem, `pontuação ${c.pontuacao_total}`).toBe(c.classificacao_ordem)
    }
  })

  it('a distância para a faixa de cima bate com o corte real', () => {
    for (const c of candidatos) {
      const proxima = proximaFaixa(faixas, c.pontuacao_total)

      if (c.classificacao_ordem === 1) {
        expect(proxima, `pontuação ${c.pontuacao_total} está no topo`).toBeNull()
        continue
      }

      const acima = faixas.find((f) => f.ordem === c.classificacao_ordem - 1)
      expect(proxima.classificacao, `pontuação ${c.pontuacao_total}`).toBe(acima.classificacao)
      expect(proxima.faltam, `pontuação ${c.pontuacao_total}`).toBe(
        acima.pontuacao_minima - c.pontuacao_total
      )
      expect(proxima.faltam, `pontuação ${c.pontuacao_total}`).toBeGreaterThan(0)
    }
  })
})
