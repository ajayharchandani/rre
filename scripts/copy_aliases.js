const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GENERATED_DIR = path.join(ROOT, 'storage', 'generated_assets');
const SOURCE_DIR = path.join(ROOT, 'storage', 'source_photos');

const generated = fs.readdirSync(GENERATED_DIR);
const sources = fs.readdirSync(SOURCE_DIR);

let copied = 0;
for (const gen of generated) {
  const ext = path.extname(gen);
  const baseGen = path.basename(gen, ext).toLowerCase();
  for (const src of sources) {
    if (src.toLowerCase() === gen.toLowerCase()) continue;
    const srcExt = path.extname(src);
    const baseSrc = path.basename(src, srcExt).toLowerCase();

    // Check if baseSrc contains baseGen as a token
    const parts = baseSrc.split('_');
    if (parts.includes(baseGen)) {
      const dest = path.join(GENERATED_DIR, src);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(GENERATED_DIR, gen), dest);
        console.log(`Copied ${gen} -> ${src}`);
        copied++;
      }
    }
  }
}
console.log(`Total alias copies made: ${copied}`);
