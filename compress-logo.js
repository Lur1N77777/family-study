const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'logo_transparent_cropped(1).png');
const outputPath = path.join(__dirname, 'public', 'logo.png');

sharp(inputPath)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png({ quality: 80, compressionLevel: 9 })
  .toFile(outputPath)
  .then(() => {
    console.log('压缩完成！');
    return sharp(inputPath).metadata();
  })
  .then(info => {
    console.log(`原始尺寸: ${info.width}x${info.height}`);
  })
  .catch(err => {
    console.error('压缩失败:', err);
  });
