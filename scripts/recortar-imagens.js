// Recorta as imagens do teste para o conteúdo real.
//
// Os arquivos originais são telas de 500x500 com o desenho ocupando uma região
// pequena e centralizada: ~31% na matriz da questão, ~3% nas opções. A tela
// compensava isso com `object-cover scale-[1.4]` e `scale-[3.0]` dentro de
// caixas quadradas — o que produzia faixas cinza em volta da figura e uma caixa
// de 672px de altura que sozinha estourava a tela.
//
// Recortando na origem, a tela passa a usar `object-contain` sem número mágico
// nenhum, e o caso especial da questão 59 (cujo arquivo já vinha recortado)
// deixa de ser necessário.
//
// REGRA IMPORTANTE PARA AS OPÇÕES: as opções de uma mesma questão são
// recortadas numa caixa COMUM, não cada uma na sua. Recortar individualmente
// normalizaria o tamanho de cada figura e faria o candidato perceber diferenças
// de escala que não existem no teste original — num teste de percepção, isso
// mudaria o que está sendo medido.
//
// Uso:
//   node scripts/recortar-imagens.js          # gera em Mascara-recortado/
//   node scripts/recortar-imagens.js --aplicar # gera e substitui os originais

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ORIGEM = path.join(__dirname, '../public/images/Mascara')
const DESTINO = path.join(__dirname, '../public/images/Mascara-recortado')

const TOTAL_QUESTOES = 60
const LIMIAR = 10 // tolerância de "quase branco" ao detectar a borda do desenho
const MARGEM = 0.04 // respiro proporcional, para o traço não encostar na borda

const arquivoQuestao = (n) => `A${n}.webp`
const arquivoOpcao = (n, o) => `A${n}.${o}.webp`

// Lê do disco em vez de assumir 6 ou 8 por série. Foi assim que apareceram a
// opção 8 da Q29 com nome errado (A29.99) e as questões 12 e 53, onde a
// quantidade de arquivos não bate com o que a tela desenha.
function opcoesDaQuestao(n) {
  return fs
    .readdirSync(ORIGEM)
    .map((arquivo) => arquivo.match(new RegExp(`^A${n}\\.(\\d+)\\.webp$`)))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b)
}

// Onde o desenho começa e termina dentro do arquivo.
async function conteudo(caminho) {
  const { info } = await sharp(caminho).trim({ threshold: LIMIAR }).toBuffer({ resolveWithObject: true })
  const esquerda = -info.trimOffsetLeft
  const topo = -info.trimOffsetTop
  return { esquerda, topo, direita: esquerda + info.width, base: topo + info.height }
}

const unir = (caixas) => ({
  esquerda: Math.min(...caixas.map((c) => c.esquerda)),
  topo: Math.min(...caixas.map((c) => c.topo)),
  direita: Math.max(...caixas.map((c) => c.direita)),
  base: Math.max(...caixas.map((c) => c.base)),
})

async function recortar(origem, destino, caixa) {
  const { width, height } = await sharp(origem).metadata()

  const respiro = Math.round(Math.max(caixa.direita - caixa.esquerda, caixa.base - caixa.topo) * MARGEM)
  const esquerda = Math.max(0, caixa.esquerda - respiro)
  const topo = Math.max(0, caixa.topo - respiro)

  await sharp(origem)
    .extract({
      left: esquerda,
      top: topo,
      width: Math.min(width - esquerda, caixa.direita - caixa.esquerda + respiro * 2),
      height: Math.min(height - topo, caixa.base - caixa.topo + respiro * 2),
    })
    .webp({ quality: 92 })
    .toFile(destino)
}

async function principal() {
  const aplicar = process.argv.includes('--aplicar')
  fs.mkdirSync(DESTINO, { recursive: true })

  let bytesAntes = 0
  let bytesDepois = 0
  let arquivos = 0

  for (let n = 1; n <= TOTAL_QUESTOES; n++) {
    // Matriz: recorte próprio, não há com o que comparar.
    const matrizOrigem = path.join(ORIGEM, arquivoQuestao(n))
    const matrizDestino = path.join(DESTINO, arquivoQuestao(n))
    await recortar(matrizOrigem, matrizDestino, await conteudo(matrizOrigem))

    // Opções: uma caixa só para todas, preservando a escala relativa.
    const opcoes = opcoesDaQuestao(n)
    const caminhos = opcoes.map((o) => path.join(ORIGEM, arquivoOpcao(n, o)))
    const caixaComum = unir(await Promise.all(caminhos.map(conteudo)))

    for (const [i, o] of opcoes.entries()) {
      await recortar(caminhos[i], path.join(DESTINO, arquivoOpcao(n, o)), caixaComum)
    }

    for (const arquivo of [arquivoQuestao(n), ...opcoes.map((o) => arquivoOpcao(n, o))]) {
      bytesAntes += fs.statSync(path.join(ORIGEM, arquivo)).size
      bytesDepois += fs.statSync(path.join(DESTINO, arquivo)).size
      arquivos++
    }

    if (n % 10 === 0) console.log(`  ${n}/${TOTAL_QUESTOES} questões`)
  }

  const mb = (b) => (b / 1024 / 1024).toFixed(2)
  console.log(`\n${arquivos} arquivos recortados`)
  console.log(`peso: ${mb(bytesAntes)} MB → ${mb(bytesDepois)} MB (-${(100 - (bytesDepois / bytesAntes) * 100).toFixed(0)}%)`)

  if (aplicar) {
    for (const arquivo of fs.readdirSync(DESTINO)) {
      fs.renameSync(path.join(DESTINO, arquivo), path.join(ORIGEM, arquivo))
    }
    fs.rmdirSync(DESTINO)
    console.log('\noriginais substituídos')
  } else {
    console.log(`\ngerado em ${path.relative(process.cwd(), DESTINO)} — rode com --aplicar para substituir`)
  }
}

principal().catch((erro) => {
  console.error('falhou:', erro.message)
  process.exit(1)
})
