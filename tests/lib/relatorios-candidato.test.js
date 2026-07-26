import { describe, it, expect } from 'vitest'
import {
  formatarDuracao,
  formatarNumero,
  compararTempo,
  compararPontuacao,
  montarSeries,
  montarEscala,
  proximaFaixa,
  posicaoNaEscala,
} from '@/lib/relatorios-candidato'

// A aritmética da tela do candidato, sem React e sem banco.
//
// Tudo o que a tela afirma sobre o candidato — "17% mais rápido que a média",
// "faltam 2 acertos para Superior", a largura de cada faixa na régua — sai
// daqui. Um erro nestas contas não quebra a página: ela desenha, bonita, com o
// número errado, e alguém decide uma contratação em cima disso.

// Espelha public.raven_escala_classificacao. Os intervalos são os cortes reais
// da escala normativa do SPM; tests/db/escala.test.js prova que continuam iguais
// aos do banco, então aqui podemos tratá-los como dado fixo.
const FAIXAS = [
  { ordem: 1, classificacao: '🔵 Excepcional', pontuacao_minima: 57, pontuacao_maxima: 60 },
  { ordem: 2, classificacao: '🟢 Muito superior', pontuacao_minima: 54, pontuacao_maxima: 56 },
  { ordem: 3, classificacao: '🟡 Superior', pontuacao_minima: 45, pontuacao_maxima: 53 },
  { ordem: 4, classificacao: '🟠 Médio-superior', pontuacao_minima: 36, pontuacao_maxima: 44 },
  { ordem: 5, classificacao: '🔴 Médio-inferior', pontuacao_minima: 25, pontuacao_maxima: 35 },
  { ordem: 6, classificacao: '⚪ Inferior', pontuacao_minima: 20, pontuacao_maxima: 24 },
  { ordem: 7, classificacao: '⚫ Muito inferior', pontuacao_minima: 0, pontuacao_maxima: 19 },
]

const TODAS_AS_PONTUACOES = Array.from({ length: 61 }, (_, p) => p)

describe('formatarDuracao', () => {
  it('formata como hh:mm:ss com dois dígitos em cada campo', () => {
    expect(formatarDuracao(0)).toBe('00:00:00')
    expect(formatarDuracao(59)).toBe('00:00:59')
    expect(formatarDuracao(3661)).toBe('01:01:01')
    expect(formatarDuracao(2130)).toBe('00:35:30')
  })

  it('não quebra com tempo ausente', () => {
    expect(formatarDuracao(null)).toBe('00:00:00')
    expect(formatarDuracao(undefined)).toBe('00:00:00')
  })
})

describe('formatarNumero', () => {
  it('usa vírgula decimal, como o resto da tela', () => {
    // O Postgres devolve numeric como 78.33; imprimir cru deixaria "78.33%"
    // ao lado de "média da base 31,2" no mesmo cartão.
    expect(formatarNumero(78.33)).toBe('78,33')
    expect(formatarNumero(91.7)).toBe('91,7')
    expect(formatarNumero(20)).toBe('20')
  })

  it('aceita o número em texto, que é como o PostgREST às vezes entrega', () => {
    expect(formatarNumero('31.2')).toBe('31,2')
  })

  it('não imprime "NaN" quando o valor falta', () => {
    expect(formatarNumero(null)).toBe('—')
    expect(formatarNumero(undefined)).toBe('—')
    expect(formatarNumero('nada')).toBe('—')
  })
})

describe('compararTempo', () => {
  it('reconhece quem foi mais rápido que a média', () => {
    // 30min contra média de 40min = 25% mais rápido.
    const r = compararTempo(1800, 40)
    expect(r.sentido).toBe('rapido')
    expect(r.percentual).toBe(25)
    expect(r.mediaSegundos).toBe(2400)
  })

  it('reconhece quem foi mais lento que a média', () => {
    const r = compararTempo(3000, 40)
    expect(r.sentido).toBe('lento')
    expect(r.percentual).toBe(25)
  })

  it('trata diferença pequena como "na média" em vez de falsa precisão', () => {
    // 2% de diferença num n pequeno é ruído, não é ser mais rápido.
    expect(compararTempo(2352, 40).sentido).toBe('media')
    expect(compararTempo(2400, 40).sentido).toBe('media')
  })

  it('devolve null quando não há média com que comparar', () => {
    // Primeiro candidato da base, ou base recém-limpa: não há comparação
    // honesta a fazer, e a tela precisa saber disso para omitir o bloco.
    expect(compararTempo(1800, 0)).toBeNull()
    expect(compararTempo(1800, null)).toBeNull()
    expect(compararTempo(1800, undefined)).toBeNull()
  })
})

describe('compararPontuacao', () => {
  it('mede a distância em acertos, com sinal', () => {
    const acima = compararPontuacao(47, 38.5)
    expect(acima.sentido).toBe('acima')
    expect(acima.diferenca).toBe(8.5)

    const abaixo = compararPontuacao(30, 38.5)
    expect(abaixo.sentido).toBe('abaixo')
    expect(abaixo.diferenca).toBe(-8.5)
  })

  it('trata menos de meio acerto de diferença como "na média"', () => {
    expect(compararPontuacao(38, 38.2).sentido).toBe('media')
  })

  it('devolve null sem média', () => {
    expect(compararPontuacao(47, null)).toBeNull()
  })
})

describe('montarSeries', () => {
  const candidato = {
    acertos_serie_a: 11,
    acertos_serie_b: 10,
    acertos_serie_c: 9,
    acertos_serie_d: 8,
    acertos_serie_e: 7,
    percentual_serie_a: 91.7,
    percentual_serie_b: 83.3,
    percentual_serie_c: 75,
    percentual_serie_d: 66.7,
    percentual_serie_e: 58.3,
  }

  const resumo = {
    media_serie_a: 9.5,
    media_serie_b: 8.5,
    media_serie_c: 7.5,
    media_serie_d: 6.5,
    media_serie_e: 5.5,
  }

  it('devolve as cinco séries na ordem A→E, com nome e acertos', () => {
    const s = montarSeries(candidato, resumo)
    expect(s.map((x) => x.letra)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(s.map((x) => x.acertos)).toEqual([11, 10, 9, 8, 7])
    expect(s[0].nome).toBe('Percepção Visual')
  })

  it('lê o percentual da view, sem recalcular', () => {
    // A view arredonda de um jeito; recalcular aqui criaria dois números
    // ligeiramente diferentes para a mesma coisa na mesma tela.
    expect(montarSeries(candidato, resumo)[0].percentual).toBe(91.7)
  })

  it('anexa a média da base e a diferença de cada série', () => {
    const s = montarSeries(candidato, resumo)
    expect(s[0].media).toBe(9.5)
    expect(s[0].diferenca).toBe(1.5)
    expect(s[4].diferenca).toBe(1.5)
  })

  it('sem resumo, entrega as séries sem comparação em vez de quebrar', () => {
    const s = montarSeries(candidato, null)
    expect(s).toHaveLength(5)
    expect(s[0].acertos).toBe(11)
    expect(s[0].media).toBeNull()
    expect(s[0].diferenca).toBeNull()
  })
})

describe('montarEscala', () => {
  it('marca exatamente uma faixa como a do candidato, para qualquer pontuação', () => {
    for (const p of TODAS_AS_PONTUACOES) {
      const atuais = montarEscala(FAIXAS, p).filter((f) => f.atual)
      expect(atuais, `pontuação ${p}`).toHaveLength(1)
    }
  })

  it('acerta a faixa nos limites de cada corte', () => {
    const faixaDe = (p) => montarEscala(FAIXAS, p).find((f) => f.atual).classificacao
    expect(faixaDe(60)).toBe('🔵 Excepcional')
    expect(faixaDe(57)).toBe('🔵 Excepcional')
    expect(faixaDe(56)).toBe('🟢 Muito superior')
    expect(faixaDe(45)).toBe('🟡 Superior')
    expect(faixaDe(44)).toBe('🟠 Médio-superior')
    expect(faixaDe(20)).toBe('⚪ Inferior')
    expect(faixaDe(19)).toBe('⚫ Muito inferior')
    expect(faixaDe(0)).toBe('⚫ Muito inferior')
  })

  it('dá a cada faixa uma largura proporcional ao tamanho do intervalo', () => {
    const escala = montarEscala(FAIXAS, 47)
    const soma = escala.reduce((t, f) => t + f.largura, 0)
    expect(soma).toBeCloseTo(100, 6)

    // "Muito inferior" cobre 20 dos 61 acertos possíveis; "Muito superior", 3.
    const porOrdem = Object.fromEntries(escala.map((f) => [f.ordem, f.largura]))
    expect(porOrdem[7]).toBeGreaterThan(porOrdem[2])
    expect(porOrdem[7] / porOrdem[2]).toBeCloseTo(20 / 3, 6)
  })

  it('preserva a ordem da melhor para a pior faixa', () => {
    expect(montarEscala(FAIXAS, 47).map((f) => f.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe('proximaFaixa', () => {
  it('diz quantos acertos faltam para a faixa de cima', () => {
    expect(proximaFaixa(FAIXAS, 44)).toEqual({ classificacao: '🟡 Superior', faltam: 1 })
    expect(proximaFaixa(FAIXAS, 47)).toEqual({ classificacao: '🟢 Muito superior', faltam: 7 })
    expect(proximaFaixa(FAIXAS, 19)).toEqual({ classificacao: '⚪ Inferior', faltam: 1 })
  })

  it('não promete faixa acima de quem já está no topo', () => {
    expect(proximaFaixa(FAIXAS, 57)).toBeNull()
    expect(proximaFaixa(FAIXAS, 60)).toBeNull()
  })
})

describe('posicaoNaEscala', () => {
  it('mantém o marcador dentro da barra em toda a faixa possível', () => {
    for (const p of TODAS_AS_PONTUACOES) {
      const pos = posicaoNaEscala(p)
      expect(pos, `pontuação ${p}`).toBeGreaterThanOrEqual(0)
      expect(pos, `pontuação ${p}`).toBeLessThanOrEqual(100)
    }
  })

  it('avança da esquerda para a direita conforme a pontuação sobe', () => {
    const posicoes = TODAS_AS_PONTUACOES.map(posicaoNaEscala)
    const ordenadas = [...posicoes].sort((a, b) => a - b)
    expect(posicoes).toEqual(ordenadas)
    expect(posicaoNaEscala(0)).toBeLessThan(posicaoNaEscala(60))
  })

  it('cai dentro da faixa que a régua desenha para aquela pontuação', () => {
    // O marcador tem que pousar sobre o segmento certo — senão a tela diz
    // "Superior" no texto e aponta para "Médio-superior" no desenho.
    for (const p of TODAS_AS_PONTUACOES) {
      const escala = montarEscala(FAIXAS, p)
      let inicio = 0
      for (const faixa of [...escala].reverse()) {
        const fim = inicio + faixa.largura
        if (faixa.atual) {
          expect(posicaoNaEscala(p), `pontuação ${p}`).toBeGreaterThanOrEqual(inicio)
          expect(posicaoNaEscala(p), `pontuação ${p}`).toBeLessThanOrEqual(fim)
        }
        inicio = fim
      }
    }
  })
})
