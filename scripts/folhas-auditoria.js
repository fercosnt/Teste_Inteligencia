// Gera uma folha de conferência por questão: as opções como estão no PDF
// oficial em cima, as imagens que o app serve embaixo, numeradas e com o
// gabarito destacado.
//
// Serve para a auditoria que o método automático não deu conta: comparar as
// figuras uma a uma. Duas tentativas de comparar pixel a pixel falharam porque
// o contorno da etiqueta é idêntico em toda opção e dominava a métrica — então
// a conferência é visual mesmo, e isto só arruma o material para ela.
//
// Requer o PDF do teste em material-teste/ (fora do git, por ser licenciado) e
// o pdftoppm do poppler: brew install poppler
//
// Uso: node scripts/folhas-auditoria.js [questão inicial] [questão final]

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const RAIZ = path.join(__dirname, '..')
const PDF = path.join(RAIZ, 'material-teste', 'matrizes - SPM.pdf')
const IMAGENS = path.join(RAIZ, 'public', 'images', 'Mascara')
const SAIDA = path.join(RAIZ, 'material-teste', 'auditoria')
const TEMP = path.join(SAIDA, '.paginas')

// Gabarito oficial, para marcar qual opção deveria ser a certa.
const GABARITO = [
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5, 2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2, 3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5,
]

const colunasDa = (q) => (q <= 24 ? 3 : 4)
const opcoesDa = (q) => (q <= 24 ? 6 : 8)

// A grade de opções é regular: acho a caixa da área e divido pelas colunas
// conhecidas. Detectar cada figura sozinha se mostrou frágil.
async function celulasDoPdf(pagina, colunas) {
  const meta = await sharp(pagina).metadata()
  const area = {
    left: Math.round(meta.width * 0.06),
    top: Math.round(meta.height * 0.52),
    width: Math.round(meta.width * 0.9),
    height: Math.round(meta.height * 0.46),
  }
  // O trim aperta a caixa em volta das figuras, mas aborta em páginas onde a
  // amostra de fundo não é limpa. Quando isso acontece, a área proporcional
  // bruta já serve — a folha é para olho humano, não precisa de precisão.
  let caixa
  try {
    const { info } = await sharp(pagina).extract(area).trim({ threshold: 40 })
      .toBuffer({ resolveWithObject: true })
    caixa = {
      x0: area.left - info.trimOffsetLeft,
      y0: area.top - info.trimOffsetTop,
      largura: info.width,
      altura: info.height,
    }
  } catch {
    caixa = { x0: area.left, y0: area.top, largura: area.width, altura: area.height }
  }

  const { x0, y0 } = caixa
  const cw = caixa.largura / colunas
  const ch = caixa.altura / 2

  // Recorte sempre dentro da página: o trim pode devolver deslocamentos que,
  // somados, passam da borda — e o sharp aborta a folha inteira quando isso
  // acontece.
  const dentro = (valor, minimo, maximo) => Math.max(minimo, Math.min(valor, maximo))

  const saida = []
  for (let linha = 0; linha < 2; linha++)
    for (let coluna = 0; coluna < colunas; coluna++) {
      // Célula inteira, incluindo o número que o próprio PDF imprime acima da
      // figura. Tentar isolar só o desenho desalinhava a segunda fileira — e o
      // número do PDF visível é justamente o que se quer conferir.
      // As duas fileiras se sobrepõem um pouco de propósito: dividir a caixa
      // exatamente ao meio cortava o topo das figuras de baixo, porque o
      // número impresso acima delas rouba altura.
      const left = dentro(Math.round(x0 + coluna * cw), 0, meta.width - 1)
      const top = dentro(Math.round(y0 + linha * ch * 0.94), 0, meta.height - 1)
      saida.push({
        left,
        top,
        width: dentro(Math.round(cw), 1, meta.width - left),
        height: dentro(Math.round(ch * 0.94), 1, meta.height - top),
      })
    }
  return saida
}

async function folha(q) {
  const pagina = path.join(TEMP, `p-${String(q).padStart(2, '0')}.png`)
  const opcoes = opcoesDa(q)
  const certa = GABARITO[q - 1]
  const celulas = await celulasDoPdf(pagina, colunasDa(q))

  const CELULA = 150
  const largura = CELULA * opcoes
  const alturaLinha = CELULA + 26
  const altura = 44 + alturaLinha * 2

  const rotulos = []
  for (let i = 0; i < opcoes; i++) {
    const destaque = i + 1 === certa
    const cor = destaque ? '#0a7d2c' : '#666'
    const marca = destaque ? ' ✓' : ''
    rotulos.push(
      `<text x="${i * CELULA + 8}" y="62" font-size="15" font-weight="bold" fill="${cor}">${i + 1}${marca}</text>`,
      `<text x="${i * CELULA + 8}" y="${62 + alturaLinha}" font-size="15" font-weight="bold" fill="${cor}">${i + 1}${marca}</text>`
    )
  }
  const svg = Buffer.from(
    `<svg width="${largura}" height="${altura}">
       <text x="8" y="26" font-size="19" font-weight="bold" fill="#111">Questão ${q} — gabarito: opção ${certa}</text>
       <text x="${largura - 230}" y="26" font-size="14" fill="#888">PDF em cima · app embaixo</text>
       ${rotulos.join('')}
     </svg>`
  )

  const partes = [{ input: svg, left: 0, top: 0 }]
  for (let i = 0; i < opcoes; i++) {
    partes.push({
      input: await sharp(pagina).extract(celulas[i])
        .resize(CELULA - 12, CELULA - 12, { fit: 'contain', background: '#fff' }).png().toBuffer(),
      left: i * CELULA + 6, top: 68,
    })
    const nosso = path.join(IMAGENS, `A${q}.${i + 1}.webp`)
    if (fs.existsSync(nosso))
      partes.push({
        input: await sharp(nosso)
          .resize(CELULA - 12, CELULA - 12, { fit: 'contain', background: '#fff' }).png().toBuffer(),
        left: i * CELULA + 6, top: 68 + alturaLinha,
      })
  }

  await sharp({ create: { width: largura, height: altura, channels: 3, background: '#ffffff' } })
    .composite(partes).png()
    .toFile(path.join(SAIDA, `q${String(q).padStart(2, '0')}.png`))
}

async function principal() {
  if (!fs.existsSync(PDF)) {
    console.error(`PDF não encontrado em ${path.relative(RAIZ, PDF)}`)
    console.error('É material licenciado, fica fora do git. Coloque o arquivo lá e rode de novo.')
    process.exit(1)
  }

  const de = Number(process.argv[2]) || 1
  const ate = Number(process.argv[3]) || 60

  fs.mkdirSync(TEMP, { recursive: true })
  console.log(`renderizando páginas ${de}-${ate} do PDF...`)
  execFileSync('pdftoppm', ['-r', '150', '-png', '-f', String(de), '-l', String(ate), PDF, path.join(TEMP, 'p')])

  for (let q = de; q <= ate; q++) {
    await folha(q)
    if (q % 10 === 0) console.log(`  ${q}/${ate}`)
  }

  fs.rmSync(TEMP, { recursive: true, force: true })
  console.log(`\nfolhas em ${path.relative(RAIZ, SAIDA)}/  (q01.png … q60.png)`)
  console.log('Confira: a figura de cima e a de baixo têm que ser a mesma, em cada número.')
}

principal().catch((e) => { console.error('falhou:', e.message); process.exit(1) })
