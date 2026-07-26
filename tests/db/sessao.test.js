import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// A trava de sessão e a retenção, contra o Postgres de verdade.
//
// O índice único (email, data_inicio) precisa acertar uma distinção fina:
// barrar a mesma execução gravada duas vezes, sem impedir ninguém de refazer o
// teste. Errar para o lado apertado é pior que o bug original — um candidato
// legítimo veria "falha ao gravar" e não teria como concluir.
//
// Este arquivo escreve, como os outros de tests/db. Mesmo domínio `.invalid`,
// mesma limpeza no começo e no fim.

const DOMINIO = '@teste-automatizado.invalid'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
const temCredenciais = Boolean(url && chave)

if (!temCredenciais) {
  console.warn('\n[tests/db] Credenciais ausentes — os testes de sessão foram PULADOS.\n')
}

const supabase = temCredenciais
  ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

const EMAIL = `sessao${DOMINIO}`
const RESPOSTAS = Array.from({ length: 60 }, () => 1)

const limpar = () => supabase.from('raven_resultados').delete().like('email', `%${DOMINIO}`)

const gravar = (dataInicio, dataFim) =>
  supabase
    .from('raven_resultados')
    .insert({
      nome: 'Sessao Teste',
      email: EMAIL,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tempo_total_segundos: 1800,
      respostas: RESPOSTAS,
    })
    .select('id')

const contar = async () => (await supabase.from('raven_resultados').select('id').eq('email', EMAIL)).data.length

beforeAll(async () => {
  if (temCredenciais) await limpar()
})

afterAll(async () => {
  if (temCredenciais) await limpar()
})

describe.skipIf(!temCredenciais)('trava de sessão (email, data_inicio)', () => {
  it('aceita a primeira gravação de uma sessão', async () => {
    const { error } = await gravar('2026-07-26T18:00:00.000Z', '2026-07-26T18:30:00.000Z')
    expect(error).toBeNull()
    expect(await contar()).toBe(1)
  })

  it('recusa a mesma execução gravada de novo', async () => {
    // Isto é o F5 na tela de resultado. Sem esta trava, cada recarga virava
    // uma linha — foi assim que um candidato acumulou 29.
    const { error } = await gravar('2026-07-26T18:00:00.000Z', '2026-07-26T18:30:00.000Z')

    expect(error).not.toBeNull()
    expect(error.code).toBe('23505')
    expect(await contar()).toBe(1)
  })

  it('recusa mesmo se a data de fim vier diferente', async () => {
    // O que identifica a sessão é o início. Um reenvio com data_fim recalculada
    // pelo cliente continua sendo a mesma execução.
    const { error } = await gravar('2026-07-26T18:00:00.000Z', '2026-07-26T18:45:00.000Z')

    expect(error?.code).toBe('23505')
    expect(await contar()).toBe(1)
  })

  it('permite refazer o teste — outra sessão, outro data_inicio', async () => {
    // Refazer passa por /instrucoes, que grava um data_inicio novo. Se esta
    // asserção quebrar, a trava ficou apertada demais e impede um teste legítimo.
    const { error } = await gravar('2026-07-27T09:00:00.000Z', '2026-07-27T09:35:00.000Z')

    expect(error).toBeNull()
    expect(await contar()).toBe(2)
  })

  it('não confunde pessoas diferentes que começaram no mesmo instante', async () => {
    // Dois candidatos abrindo o teste ao mesmo tempo é plausível numa turma.
    const { error } = await supabase.from('raven_resultados').insert({
      nome: 'Outra Pessoa',
      email: `outra.sessao${DOMINIO}`,
      data_inicio: '2026-07-26T18:00:00.000Z',
      data_fim: '2026-07-26T18:30:00.000Z',
      tempo_total_segundos: 1800,
      respostas: RESPOSTAS,
    })

    expect(error).toBeNull()
  })
})

describe.skipIf(!temCredenciais)('política de retenção', () => {
  // Este bloco NÃO chama raven_anonimizar_antigos(). A função reescreve a
  // tabela inteira, e um teste que a dispara faria `npm test` executar o ciclo
  // de vida de dado pessoal de candidatos reais — efeito colateral que nenhuma
  // suíte deve ter. O prazo mora em raven_retencao_intervalo() justamente para
  // poder ser conferido sem escrever nada.

  it('o prazo é de 2 anos', async () => {
    const { data, error } = await supabase.rpc('raven_retencao_intervalo')

    expect(error).toBeNull()
    expect(data).toBe('2 years')
  })
})
