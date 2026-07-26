// A aritmética da tela do candidato.
//
// Vive fora do componente pela mesma razão que lib/relatorios-query.js: é a
// parte com regra de verdade. A tela do candidato não mostra só números do
// banco — ela afirma coisas ("17% mais rápido que a média", "faltam 2 acertos
// para Superior"). Cada afirmação dessas é uma conta, e conta errada aqui não
// quebra a página: ela desenha normalmente com o número errado.
//
// Este módulo é puro de propósito: não importa React, não fala com o Supabase,
// não conhece o gabarito. Assim os testes chamam exatamente o que roda.

export const LETRAS_SERIES = ['A', 'B', 'C', 'D', 'E']

export const NOMES_SERIES = {
  A: 'Percepção Visual',
  B: 'Raciocínio Analógico',
  C: 'Raciocínio de Padrões',
  D: 'Raciocínio Quantitativo',
  E: 'Raciocínio Abstrato',
}

export const QUESTOES_POR_SERIE = 12
export const TOTAL_QUESTOES = 60

// A régua cobre 0 a 60 acertos — 61 posições, não 60. O off-by-one importa:
// é ele que faz o marcador de quem tirou 60 parar dentro da barra.
const POSICOES_NA_ESCALA = TOTAL_QUESTOES + 1

// Abaixo destes limites a diferença é ruído da base pequena, não desempenho.
// Sem eles a tela diria "2% mais lento que a média" para quem empatou, o que é
// tecnicamente verdade e praticamente mentira.
const RUIDO_TEMPO_PERCENTUAL = 5
const RUIDO_PONTUACAO_ACERTOS = 0.5

const arredondar = (n, casas = 1) => {
  const fator = 10 ** casas
  return Math.round(n * fator) / fator
}

// O `id` da rota vem da URL, que é digitável. Sem esta guarda, um id fora do
// formato chega ao Postgres e volta como erro de sintaxe de uuid — a tela
// mostraria "falha ao carregar" para o que é, na verdade, um endereço que não
// existe. Barrando aqui, /relatorios/qualquer-coisa dá 404, que é a verdade.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ehUuid(valor) {
  return typeof valor === 'string' && FORMATO_UUID.test(valor)
}

export function formatarDuracao(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

// O Postgres devolve numeric como 78.33 e o React imprime o ponto. Na mesma
// tela em que "média da base 31,2" sai com vírgula, isso vira duas convenções
// decimais lado a lado — parece erro de dado, não de formatação.
export function formatarNumero(valor) {
  // Ausente é travessão, nunca zero. `Number(null)` é 0, e um percentual que
  // não veio virando "0%" na tela lê como "errou tudo" — a leitura mais cara
  // que um dado faltando poderia ganhar numa tela de contratação.
  if (valor === null || valor === undefined || valor === '') return '—'

  const n = Number(valor)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Compara o tempo deste candidato com a média da base.
//
// `null` quando não há com que comparar — base vazia ou este é o primeiro
// candidato. A tela usa esse null para omitir o bloco em vez de mostrar uma
// comparação contra zero.
export function compararTempo(segundos, tempoMedioMinutos) {
  const mediaMinutos = Number(tempoMedioMinutos) || 0
  if (mediaMinutos <= 0) return null

  const mediaSegundos = Math.round(mediaMinutos * 60)
  const diferencaSegundos = Math.round(Number(segundos) || 0) - mediaSegundos
  const percentual = arredondar((Math.abs(diferencaSegundos) / mediaSegundos) * 100)

  return {
    mediaSegundos,
    diferencaSegundos,
    percentual,
    sentido:
      percentual < RUIDO_TEMPO_PERCENTUAL ? 'media' : diferencaSegundos < 0 ? 'rapido' : 'lento',
  }
}

export function compararPontuacao(pontuacao, mediaPontuacao) {
  const media = Number(mediaPontuacao)
  if (!Number.isFinite(media) || media <= 0) return null

  const diferenca = arredondar(Number(pontuacao) - media)

  return {
    media,
    diferenca,
    sentido:
      Math.abs(diferenca) < RUIDO_PONTUACAO_ACERTOS ? 'media' : diferenca > 0 ? 'acima' : 'abaixo',
  }
}

// As cinco séries do candidato, cada uma já emparelhada com a média da base.
//
// O percentual vem da view em vez de ser recalculado aqui: o banco arredonda
// de um jeito, e refazer a conta produziria dois números ligeiramente
// diferentes para a mesma coisa na mesma tela.
export function montarSeries(candidato, resumo) {
  return LETRAS_SERIES.map((letra) => {
    const chave = letra.toLowerCase()
    const acertos = Number(candidato[`acertos_serie_${chave}`]) || 0
    const bruta = resumo?.[`media_serie_${chave}`]
    const media = bruta === null || bruta === undefined ? null : arredondar(Number(bruta))

    return {
      letra,
      nome: NOMES_SERIES[letra],
      acertos,
      percentual: Number(candidato[`percentual_serie_${chave}`]) || 0,
      media,
      diferenca: media === null ? null : arredondar(acertos - media),
    }
  })
}

// A régua normativa inteira, com a faixa do candidato marcada.
//
// `largura` é proporcional ao tamanho do intervalo de cada faixa, não igual
// para todas: "Muito inferior" cobre 20 acertos e "Muito superior" cobre 3, e
// desenhá-las do mesmo tamanho mentiria sobre a distância entre elas.
export function montarEscala(faixas, pontuacao) {
  const p = Number(pontuacao)

  return faixas.map((faixa) => {
    const minima = Number(faixa.pontuacao_minima)
    const maxima = Number(faixa.pontuacao_maxima)

    return {
      ...faixa,
      atual: p >= minima && p <= maxima,
      largura: ((maxima - minima + 1) / POSICOES_NA_ESCALA) * 100,
    }
  })
}

// Quantos acertos faltavam para a faixa imediatamente acima.
//
// `ordem` cresce para baixo na escala (1 é o topo), então a faixa de cima é a
// de ordem menor. Devolve null para quem já está no topo — prometer uma faixa
// acima de "Excepcional" seria inventar.
export function proximaFaixa(faixas, pontuacao) {
  const p = Number(pontuacao)
  const atual = faixas.find((f) => p >= Number(f.pontuacao_minima) && p <= Number(f.pontuacao_maxima))
  if (!atual) return null

  const acima = faixas.find((f) => Number(f.ordem) === Number(atual.ordem) - 1)
  if (!acima) return null

  return {
    classificacao: acima.classificacao,
    faltam: Number(acima.pontuacao_minima) - p,
  }
}

// Onde cravar o marcador na barra, em % da largura.
//
// Mira o *meio* da fatia da pontuação, não a borda: com 61 fatias, apontar
// para a borda deixaria quem tirou 45 (primeiro acerto de "Superior") em cima
// da divisa com "Médio-superior", parecendo estar na faixa de baixo.
export function posicaoNaEscala(pontuacao) {
  const p = Math.min(TOTAL_QUESTOES, Math.max(0, Number(pontuacao) || 0))
  return ((p + 0.5) / POSICOES_NA_ESCALA) * 100
}
