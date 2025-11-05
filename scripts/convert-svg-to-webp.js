const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const mascaraDir = path.join(__dirname, '../public/images/Mascara');

async function convertSvgToWebp(svgPath) {
  const webpPath = svgPath.replace(/\.svg$/, '.webp');
  
  try {
    await sharp(svgPath)
      .webp({ quality: 90 })
      .toFile(webpPath);
    
    console.log(`✓ Convertido: ${path.basename(svgPath)} → ${path.basename(webpPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Erro ao converter ${path.basename(svgPath)}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Iniciando conversão de SVG para WebP...\n');
  
  if (!fs.existsSync(mascaraDir)) {
    console.error(`Erro: Pasta ${mascaraDir} não encontrada!`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(mascaraDir);
  const svgFiles = files.filter(file => file.endsWith('.svg'));
  
  if (svgFiles.length === 0) {
    console.error('Nenhum arquivo SVG encontrado na pasta Mascara!');
    process.exit(1);
  }
  
  console.log(`Encontrados ${svgFiles.length} arquivos SVG para converter.\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(mascaraDir, svgFile);
    const success = await convertSvgToWebp(svgPath);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Conversão concluída!`);
  console.log(`✓ Sucesso: ${successCount}`);
  console.log(`✗ Erros: ${errorCount}`);
  console.log(`${'='.repeat(50)}`);
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});


