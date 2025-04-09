import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsDir = path.join(__dirname, '../public/cards');
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

// Get all PNG files
const files = fs.readdirSync(cardsDir).filter(file => file.endsWith('.png'));

// Rename files
let fileIndex = 0;
for (const suit of suits) {
  for (let value = 1; value <= 13; value++) {
    if (fileIndex >= files.length) break;
    const oldPath = path.join(cardsDir, files[fileIndex]);
    const newPath = path.join(cardsDir, `${value}_of_${suit}.png`);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${files[fileIndex]} to ${value}_of_${suit}.png`);
    fileIndex++;
  }
}

// Rename the last file to back.png
if (fileIndex < files.length) {
  const oldPath = path.join(cardsDir, files[fileIndex]);
  const newPath = path.join(cardsDir, 'back.png');
  fs.renameSync(oldPath, newPath);
  console.log(`Renamed ${files[fileIndex]} to back.png`);
} 