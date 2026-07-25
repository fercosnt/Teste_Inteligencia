import { describe, it, expect } from 'vitest'
import { gerarCsv, escaparCampo, numeroBr, nomeArquivoCsv, COLUNAS, BOM } from '@/lib/csv'

const candidato = (extra = {}) => ({
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  telefone: '11999998888',
  data_inicio: '2026-07-19T17:30:00.000Z',
  data_fim: '2026-07-19T18:00:00.000Z',
  tempo_total_segundos: 1800,
  tempo_total_minutos: '30.00',
  acertos_serie_a: 12,
  acertos_serie_b: 10,
  acertos_serie_c: 9,
  acertos_serie_d: 8,
  acertos_serie_e: 7,
  pontuacao_total: 46,
  percentual_acertos: '76.67',
  classificacao: '🟢 Muito Bom (75-89%)',
  ...extra,
})

// O CSV é lido pelo Excel, então a separação real das células importa mais que
// a string bruta: estas funções reproduzem o parser (RFC 4180) para checar
// onde cada valor cai de verdade.
const linhas = (csv) => csv.replace(BOM, '').trimEnd().split('\r\n')

function celulas(linha) {
  const saida = []
  let atual = ''
  let entreAspas = false

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (entreAspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else if (c === '"') entreAspas = false
      else atual += c
    } else if (c === '"') entreAspas = true
    else if (c === ';') {
      saida.push(atual)
      atual = ''
    } else atual += c
  }
  saida.push(atual)
  return saida
}

describe('escaparCampo', () => {
  it('deixa texto simples em paz', () => {
    expect(escaparCampo('Maria Silva')).toBe('Maria Silva')
  })

  it('trata ausência de valor como célula vazia', () => {
    expect(escaparCampo(null)).toBe('')
    expect(escaparCampo(undefined)).toBe('')
  })

  it('protege o separador, a aspa e a quebra de linha', () => {
    expect(escaparCampo('a;b')).toBe('"a;b"')
    expect(escaparCampo('diz "oi"')).toBe('"diz ""oi"""')
    expect(escaparCampo('linha1\nlinha2')).toBe('"linha1\nlinha2"')
  })

  it('neutraliza campo que a planilha leria como fórmula', () => {
    // Nome e email vêm de quem faz o teste: sem isso, um candidato escolhe o
    // que roda quando o RH abre o arquivo.
    expect(escaparCampo('=1+1')).toBe("'=1+1")
    expect(escaparCampo('=HYPERLINK("http://x","clique")')).toBe(
      '"\'=HYPERLINK(""http://x"",""clique"")"'
    )
    for (const inicio of ['=', '+', '-', '@']) {
      expect(escaparCampo(`${inicio}cmd`), inicio).toBe(`'${inicio}cmd`)
    }
  })

  it('não mexe no que só tem esses caracteres no meio', () => {
    expect(escaparCampo('11-99999-8888')).toBe('11-99999-8888')
    expect(escaparCampo('maria@exemplo.com')).toBe('maria@exemplo.com')
  })
})

describe('numeroBr', () => {
  it('usa vírgula decimal, que é o que a planilha pt-BR entende', () => {
    expect(numeroBr('76.67')).toBe('76,67')
    expect(numeroBr(30)).toBe('30')
    expect(numeroBr(null)).toBe('')
  })
})

describe('gerarCsv', () => {
  it('começa com BOM, sem o qual o Excel estraga os acentos', () => {
    expect(gerarCsv([])).toMatch(/^﻿/)
  })

  it('traz o cabeçalho mesmo sem nenhum candidato', () => {
    expect(linhas(gerarCsv([]))).toHaveLength(1)
    expect(celulas(linhas(gerarCsv([]))[0])).toEqual(COLUNAS.map((c) => c.titulo))
  })

  it('escreve uma linha por candidato', () => {
    expect(linhas(gerarCsv([candidato(), candidato(), candidato()]))).toHaveLength(4)
  })

  it('preenche as colunas do candidato com os valores certos', () => {
    const [, linha] = linhas(gerarCsv([candidato()]))
    const valores = Object.fromEntries(
      celulas(linha).map((valor, i) => [COLUNAS[i].titulo, valor])
    )

    expect(valores).toMatchObject({
      Nome: 'Maria Silva',
      Email: 'maria@exemplo.com',
      Telefone: '11999998888',
      Tempo: '00:30:00',
      'Tempo (min)': '30,00',
      'Acertos Série A': '12',
      'Acertos Série E': '7',
      'Pontuação Total': '46',
      'Percentual (%)': '76,67',
      Classificação: '🟢 Muito Bom (75-89%)',
    })
  })

  it('mostra as datas no fuso de São Paulo', () => {
    const [, linha] = linhas(gerarCsv([candidato()]))
    const valores = celulas(linha)

    // 18:00 UTC é 15:00 em São Paulo.
    expect(valores[COLUNAS.findIndex((c) => c.titulo === 'Conclusão')]).toBe('19/07/2026, 15:00')
  })

  it('um nome com vírgula não muda a contagem de colunas', () => {
    const [cabecalho, linha] = linhas(gerarCsv([candidato({ nome: 'Silva, Maria' })]))

    expect(celulas(linha)).toHaveLength(celulas(cabecalho).length)
    expect(celulas(linha)[0]).toBe('Silva, Maria')
  })

  it('nome com ponto e vírgula, aspas ou quebra de linha também não desloca colunas', () => {
    const nomes = ['Ltda; SA', 'A "Grande" Silva', 'Maria\nSilva', 'tudo: ; " \n junto']

    for (const nome of nomes) {
      const [cabecalho, ...resto] = linhas(gerarCsv([candidato({ nome })]))
      // Quebra de linha dentro de aspas: o registro continua sendo um só.
      const linha = resto.join('\r\n')

      expect(celulas(linha), nome).toHaveLength(celulas(cabecalho).length)
      expect(celulas(linha)[0], nome).toBe(nome)
    }
  })

  it('campo nulo vira célula vazia sem comer a coluna seguinte', () => {
    const [cabecalho, linha] = linhas(gerarCsv([candidato({ telefone: null })]))
    const valores = celulas(linha)

    expect(valores).toHaveLength(celulas(cabecalho).length)
    expect(valores[2]).toBe('')
    expect(valores[3]).not.toBe('')
  })

  it('termina cada linha com CRLF, como o Excel espera', () => {
    expect(gerarCsv([candidato()])).toMatch(/\r\n$/)
  })
})

describe('nomeArquivoCsv', () => {
  it('carrega a data para o arquivo não sobrescrever o do dia anterior', () => {
    expect(nomeArquivoCsv(new Date('2026-07-25T10:00:00.000Z'))).toBe(
      'resultados-raven-2026-07-25.csv'
    )
  })
})
