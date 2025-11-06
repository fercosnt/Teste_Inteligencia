const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/images/Mascara/A59.svg');
const outputPath = path.join(__dirname, '../public/images/Mascara/A59_cropped.webp');

async function recortarImagem() {
  try {
    // Obter dimensões da imagem
    const metadata = await sharp(inputPath).metadata();
    console.log(`Dimensões originais: ${metadata.width}x${metadata.height}`);
    
    // Recortar a parte inferior da imagem (mostrar quadrado principal)
    // Ajustar esses valores conforme necessário
    const cropTop = Math.floor(metadata.height * 0.15); // Remover 15% do topo
    const cropHeight = metadata.height - cropTop;
    
    const cropped = await sharp(inputPath)
      .extract({
        left: 0,
        top: cropTop,
        width: metadata.width,
        height: cropHeight
      })
      .webp({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✓ Imagem recortada salva em: ${outputPath}`);
    console.log(`  Dimensões: ${cropped.width}x${cropped.height}`);
    console.log(`\nPara aplicar, substitua A59.webp por A59_cropped.webp`);
    
  } catch (error) {
    console.error('Erro ao recortar imagem:', error.message);
    console.log('\nTentando método alternativo...');
    
    // Método alternativo: aplicar transformação
    try {
      const metadata = await sharp(inputPath).metadata();
      const newHeight = Math.floor(metadata.height * 0.85);
      
      await sharp(inputPath)
        .resize(metadata.width, newHeight, {
          position: 'bottom'
        })
        .webp({ quality: 90 })
        .toFile(outputPath);
        
      console.log(`✓ Imagem processada salva em: ${outputPath}`);
    } catch (err) {
      console.error('Erro no método alternativo:', err.message);
    }
  }
}

recortarImagem();

