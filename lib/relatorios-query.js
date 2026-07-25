// Tradução de `?q=`, `?ordem=` e `?dir=` para uma consulta ao Supabase.
//
// Vive fora do componente porque é a única parte do dashboard com regra de
// verdade — o que é uma ordem válida, o que fazer com lixo na URL, como não
// deixar um termo de busca quebrar a sintaxe do PostgREST. O componente só
// desenha o que sai daqui.

// Cada chave é o que aparece na URL; a coluna é detalhe interno da view.
export const ORDENS = {
  nome: { coluna: 'nome', rotulo: 'Candidato', direcaoInicial: 'asc' },
  data: { coluna: 'data_fim', rotulo: 'Conclusão', direcaoInicial: 'desc' },
  tempo: { coluna: 'tempo_total_segundos', rotulo: 'Tempo', direcaoInicial: 'asc' },
  // "Pontos" e não "Pontuação": o cabeçalho ocupa 1 de 12 colunas e a palavra
  // inteira transborda por cima de "Classificação".
  pontuacao: { coluna: 'pontuacao_total', rotulo: 'Pontos', direcaoInicial: 'desc' },
}

export const ORDEM_PADRAO = 'data'
export const DIRECAO_PADRAO = 'desc'

// Ordem ou direção fora do previsto cai no padrão em vez de quebrar a tela:
// a URL é editável pelo usuário e não é contrato.
export function normalizarOrdem(ordem, direcao) {
  const chave = Object.hasOwn(ORDENS, ordem) ? ordem : ORDEM_PADRAO
  const dir = direcao === 'asc' || direcao === 'desc' ? direcao : DIRECAO_PADRAO

  return {
    ordem: chave,
    direcao: dir,
    coluna: ORDENS[chave].coluna,
    ascendente: dir === 'asc',
  }
}

export function normalizarBusca(q) {
  return typeof q === 'string' ? q.trim() : ''
}

// Monta o filtro `or` do PostgREST para buscar em nome OU email.
//
// Duas escapadas diferentes, na ordem certa:
//   1. `%` e `_` são curingas do LIKE — escapamos para que a busca seja
//      literal, senão procurar por "50%" casaria com qualquer coisa.
//   2. `,` `.` `(` `)` e `:` são separadores da própria sintaxe do `or` —
//      resolvidos envolvendo o valor em aspas duplas, o que por sua vez exige
//      escapar aspas e barras invertidas.
export function filtroBusca(termo) {
  if (!termo) return null

  const literal = termo.replace(/[\\%_]/g, '\\$&')
  const entreAspas = `"%${literal.replace(/["\\]/g, '\\$&')}%"`

  return `nome.ilike.${entreAspas},email.ilike.${entreAspas}`
}

// Ponto único onde busca e ordenação viram consulta. A tela e os testes
// chamam esta função, então o que é testado é o que roda em produção.
export function aplicarFiltros(query, { busca, ordenacao }) {
  const filtro = filtroBusca(busca)
  if (filtro) query = query.or(filtro)

  // `id` como desempate deixa a ordem estável entre recargas quando duas
  // linhas empatam — sem isso, o Postgres pode devolver ordens diferentes.
  return query
    .order(ordenacao.coluna, { ascending: ordenacao.ascendente })
    .order('id', { ascending: true })
}

// Preserva o estado atual da tela ao trocar um parâmetro. Sem isso, ordenar
// jogaria fora a busca e vice-versa.
export function construirHref({ busca, ordem, direcao }) {
  const params = new URLSearchParams()
  if (busca) params.set('q', busca)
  if (ordem !== ORDEM_PADRAO) params.set('ordem', ordem)
  if (direcao !== DIRECAO_PADRAO) params.set('dir', direcao)

  const query = params.toString()
  return query ? `/relatorios?${query}` : '/relatorios'
}

// Clicar na coluna já ativa inverte; clicar em outra começa pela direção que
// faz sentido para aquele dado (nota alta primeiro, nome de A a Z).
export function proximaDirecao(chave, ordemAtiva, direcaoAtiva) {
  if (chave === ordemAtiva) return direcaoAtiva === 'asc' ? 'desc' : 'asc'
  return ORDENS[chave].direcaoInicial
}
