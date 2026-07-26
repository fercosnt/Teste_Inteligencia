import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { series } from '@/lib/quiz-data'
import { gabarito } from '@/lib/gabarito-servidor'
import { aplicarFiltros, normalizarOrdem } from '@/lib/relatorios-query'

// Busca e ordenação contra o Postgres de verdade.
//
// Os testes unitários em tests/lib provam o *formato* do filtro; só o PostgREST
// prova o significado — que a vírgula não partiu o `or` e que o `%` foi tratado
// como texto. Um erro aqui é silencioso: a tela lista dados, só que os errados.
//
// Diferente dos outros testes de banco, este PRECISA escrever. As linhas usam o
// TLD reservado `.invalid`, que nunca é um email real, e são removidas no fim.
// O beforeAll também limpa sobras de uma execução anterior interrompida, para
// que uma queda no meio não deixe candidatos falsos no dashboard do RH.

const DOMINIO = '@teste-automatizado.invalid'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
const temCredenciais = Boolean(url && chave)

if (!temCredenciais) {
  console.warn(
    '\n[tests/db] Credenciais ausentes — os testes de busca foram PULADOS, não aprovados.\n'
  )
}

const supabase = temCredenciais
  ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

const errar = (correta, opcoes) => (correta % opcoes) + 1
const todasErradas = gabarito.map((c, i) => errar(c, i < 24 ? 6 : 8))
const serieAZerada = gabarito.map((c, i) => (i < 12 ? errar(c, series.A.opcoes) : c))

// Três candidatos com nomes escolhidos a dedo: um nome traz vírgula e "%",
// os dois caracteres capazes de quebrar o filtro de formas diferentes.
const CANDIDATOS = [
  {
    nome: 'Maria Silva',
    email: `maria.silva${DOMINIO}`,
    telefone: '11900000001',
    tempo_total_segundos: 1800,
    respostas: gabarito,
    esperado: { pontuacao: 60 },
  },
  {
    nome: 'João Pereira',
    email: `joao.pereira${DOMINIO}`,
    telefone: '11900000002',
    tempo_total_segundos: 3600,
    respostas: serieAZerada,
    esperado: { pontuacao: 48 },
  },
  {
    nome: 'Ana, 100% Maria',
    email: `ana.especial${DOMINIO}`,
    telefone: '11900000003',
    tempo_total_segundos: 600,
    respostas: todasErradas,
    esperado: { pontuacao: 0 },
  },
]

const limpar = () => supabase.from('raven_resultados').delete().like('email', `%${DOMINIO}`)

async function buscar(busca, ordem, direcao) {
  const query = aplicarFiltros(
    supabase.from('raven_resultados_detalhe').select('*').like('email', `%${DOMINIO}`),
    { busca, ordenacao: normalizarOrdem(ordem, direcao) }
  )

  const { data, error } = await query
  if (error) throw new Error(`consulta falhou: ${error.message}`)
  return data
}

const nomes = (linhas) => linhas.map((l) => l.nome)

beforeAll(async () => {
  if (!temCredenciais) return

  await limpar()

  const fim = new Date('2026-07-20T18:00:00.000Z')
  const linhas = CANDIDATOS.map((c, i) => ({
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    // Datas distintas e de ordem conhecida, para checar a ordenação por data.
    data_inicio: new Date(fim.getTime() - (i + 1) * 86400000 - c.tempo_total_segundos * 1000),
    data_fim: new Date(fim.getTime() - (i + 1) * 86400000),
    tempo_total_segundos: c.tempo_total_segundos,
    respostas: c.respostas,
  }))

  const { error } = await supabase.from('raven_resultados').insert(linhas)
  if (error) throw new Error(`não consegui preparar os dados de teste: ${error.message}`)
})

afterAll(async () => {
  if (temCredenciais) await limpar()
})

describe.skipIf(!temCredenciais)('busca por nome ou email', () => {
  it('o banco pontuou as linhas de teste como esperado', async () => {
    const linhas = await buscar('', 'pontuacao', 'desc')
    expect(linhas.map((l) => l.pontuacao_total)).toEqual([60, 48, 0])
  })

  it('sem termo, devolve todos', async () => {
    expect(await buscar('')).toHaveLength(3)
  })

  it('termo parcial no nome devolve o subconjunto correspondente', async () => {
    expect(nomes(await buscar('maria', 'nome', 'asc'))).toEqual(['Ana, 100% Maria', 'Maria Silva'])
    expect(nomes(await buscar('pereira'))).toEqual(['João Pereira'])
  })

  it('ignora maiúsculas e minúsculas', async () => {
    expect(await buscar('MARIA')).toHaveLength(2)
    expect(await buscar('mArIa')).toHaveLength(2)
  })

  it('busca também no email, não só no nome', async () => {
    // "joao.pereira" só existe no email; o nome tem "João" com til.
    expect(nomes(await buscar('joao.pereira'))).toEqual(['João Pereira'])
    expect(nomes(await buscar('ana.especial'))).toEqual(['Ana, 100% Maria'])
  })

  it('termo inexistente devolve vazio, sem erro', async () => {
    expect(await buscar('zzz-nao-existe-zzz')).toEqual([])
  })

  it('vírgula no termo não vira separador do filtro', async () => {
    // Se a vírgula escapasse, o `or` viraria três condições e traria demais.
    expect(nomes(await buscar('Ana, 100%'))).toEqual(['Ana, 100% Maria'])
    expect(await buscar('Silva, Maria')).toEqual([])
  })

  it('trata % como texto, não como curinga', async () => {
    // Curinga solto casaria com os 3; literal casa só com quem tem "%" no nome.
    expect(nomes(await buscar('%'))).toEqual(['Ana, 100% Maria'])
  })

  it('trata _ como texto, não como "qualquer caractere"', async () => {
    // Curinga casaria com os 3, já que todo nome tem ao menos um caractere.
    expect(await buscar('_')).toEqual([])
  })

  it('aspas e barras no termo não quebram a consulta', async () => {
    expect(await buscar('a"b')).toEqual([])
    expect(await buscar('a\\b')).toEqual([])
    expect(await buscar('%,"\\_')).toEqual([])
  })
})

describe.skipIf(!temCredenciais)('ordenação da lista', () => {
  it('ordena por pontuação, do maior para o menor', async () => {
    expect(nomes(await buscar('', 'pontuacao', 'desc'))).toEqual([
      'Maria Silva',
      'João Pereira',
      'Ana, 100% Maria',
    ])
  })

  it('inverte a pontuação quando pedida crescente', async () => {
    expect(nomes(await buscar('', 'pontuacao', 'asc'))).toEqual([
      'Ana, 100% Maria',
      'João Pereira',
      'Maria Silva',
    ])
  })

  it('ordena por tempo, do mais rápido ao mais lento', async () => {
    expect(nomes(await buscar('', 'tempo', 'asc'))).toEqual([
      'Ana, 100% Maria', // 600s
      'Maria Silva', // 1800s
      'João Pereira', // 3600s
    ])
  })

  it('ordena por data de conclusão, mais recente primeiro', async () => {
    expect(nomes(await buscar('', 'data', 'desc'))).toEqual([
      'Maria Silva',
      'João Pereira',
      'Ana, 100% Maria',
    ])
  })

  it('ordem inválida na URL cai no padrão em vez de quebrar', async () => {
    const padrao = nomes(await buscar('', 'data', 'desc'))
    expect(nomes(await buscar('', 'coluna_que_nao_existe', 'desc'))).toEqual(padrao)
    expect(nomes(await buscar('', 'pontuacao_total; drop table', 'lixo'))).toEqual(padrao)
  })

  it('ordenação e busca se combinam sem se anular', async () => {
    // Filtra 2 de 3 e ordena o subconjunto — as duas coisas ao mesmo tempo.
    expect(nomes(await buscar('maria', 'pontuacao', 'desc'))).toEqual([
      'Maria Silva',
      'Ana, 100% Maria',
    ])
    expect(nomes(await buscar('maria', 'pontuacao', 'asc'))).toEqual([
      'Ana, 100% Maria',
      'Maria Silva',
    ])
  })
})
