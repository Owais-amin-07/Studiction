import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const targets = [
  { file: 'ftlogo.png', maxWidth: 300 },
  { file: 'bglogo.png', maxWidth: 600 },
  { file: 'moon.png',   maxWidth: 400 },
];

const publicDir = path.resolve('public');

for (const { file, maxWidth } of targets) {
  const input = path.join(publicDir, file);
  const outputName = file.replace(/\.png$/, '.webp');
  const output = path.join(publicDir, outputName);

  await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(output);

  const beforeKB = (fs.statSync(input).size / 1024).toFixed(1);
  const afterKB  = (fs.statSync(output).size / 1024).toFixed(1);
  console.log(`${file}: ${beforeKB}KB → ${outputName}: ${afterKB}KB`);
}