// Geração do CSV de resultados.
//
// O destino é o Excel em português, que é onde o RH abre o arquivo — não um
// parser genérico. Isso decide três coisas que fogem do RFC 4180:
//
//   separador `;`   o Excel pt-BR usa o separador de lista do sistema; com `,`
//                   ele joga a linha inteira numa coluna só
//   decimal `,`     `83.33` viraria texto (ou 8333) numa planilha pt-BR
//   BOM no início   sem ele o Excel lê UTF-8 como Latin-1 e "João" vira "JoÃ£o"
//
// Se algum dia isso precisar alimentar um script em vez de uma planilha, o
// lugar de mudar é aqui — o route handler não sabe nada de formato.

const SEPARADOR = ';'
export const BOM = '﻿'

// Um campo que começa com =, +, - ou @ é interpretado como fórmula ao abrir a
// planilha. Como nome e email vêm de quem faz o teste, sem tratamento isso
// seria execução de fórmula a partir de entrada de terceiro. O apóstrofo é a
// neutralização usual: some na exibição e o conteúdo continua legível.
const neutralizarFormula = (texto) =>
  /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto

export function escaparCampo(valor) {
  if (valor === null || valor === undefined) return ''

  const texto = neutralizarFormula(String(valor))

  // Aspas dobradas e o campo inteiro entre aspas, como manda o RFC — o que
  // resolve separador, quebra de linha e aspas de uma vez só.
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// pt-BR: 83.33 → "83,33". Number, não string, para não mexer no que já é texto.
export const numeroBr = (valor) =>
  valor === null || valor === undefined ? '' : String(valor).replace('.', ',')

const dataHoraBr = (iso) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

const duracao = (segundos) => {
  const s = Number(segundos) || 0
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

// A ordem aqui é a ordem das colunas no arquivo.
export const COLUNAS = [
  { titulo: 'Nome', valor: (c) => c.nome },
  { titulo: 'Email', valor: (c) => c.email },
  { titulo: 'Telefone', valor: (c) => c.telefone },
  { titulo: 'Início', valor: (c) => dataHoraBr(c.data_inicio) },
  { titulo: 'Conclusão', valor: (c) => dataHoraBr(c.data_fim) },
  { titulo: 'Tempo', valor: (c) => duracao(c.tempo_total_segundos) },
  { titulo: 'Tempo (min)', valor: (c) => numeroBr(c.tempo_total_minutos) },
  { titulo: 'Acertos Série A', valor: (c) => c.acertos_serie_a },
  { titulo: 'Acertos Série B', valor: (c) => c.acertos_serie_b },
  { titulo: 'Acertos Série C', valor: (c) => c.acertos_serie_c },
  { titulo: 'Acertos Série D', valor: (c) => c.acertos_serie_d },
  { titulo: 'Acertos Série E', valor: (c) => c.acertos_serie_e },
  { titulo: 'Pontuação Total', valor: (c) => c.pontuacao_total },
  { titulo: 'Percentual (%)', valor: (c) => numeroBr(c.percentual_acertos) },
  { titulo: 'Classificação', valor: (c) => c.classificacao },
]

export function gerarCsv(candidatos) {
  const linhas = [
    COLUNAS.map((coluna) => escaparCampo(coluna.titulo)).join(SEPARADOR),
    ...candidatos.map((c) =>
      COLUNAS.map((coluna) => escaparCampo(coluna.valor(c))).join(SEPARADOR)
    ),
  ]

  // CRLF: o RFC pede, e é o que o Excel espera.
  return BOM + linhas.join('\r\n') + '\r\n'
}

export function nomeArquivoCsv(agora) {
  const [data] = agora.toISOString().split('T')
  return `resultados-raven-${data}.csv`
}
