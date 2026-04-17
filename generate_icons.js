import sharp from 'sharp';
import fs from 'fs';

const svgBuffer = fs.readFileSync('./public/icon.svg');

sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('./public/icon-192x192.png')
  .then(() => console.log('192x192 generated'))
  .catch(err => console.error(err));

sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('./public/icon-512x512.png')
  .then(() => console.log('512x512 generated'))
  .catch(err => console.error(err));
