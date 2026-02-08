import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'dist-extension');
const ext = join(root, 'extension');
const iconsOut = join(outDir, 'icons');

if (!existsSync(outDir)) {
  console.error('Run build first: pnpm run build:extension');
  process.exit(1);
}

copyFileSync(join(ext, 'manifest.json'), join(outDir, 'manifest.json'));
copyFileSync(join(ext, 'background.js'), join(outDir, 'background.js'));
copyFileSync(join(ext, 'content.js'), join(outDir, 'content.js'));
copyFileSync(join(ext, 'inpage.js'), join(outDir, 'inpage.js'));

mkdirSync(iconsOut, { recursive: true });
const logo = join(root, 'logo.png');
const extIcon128 = join(ext, 'icons', 'icon128.png');
if (existsSync(logo)) {
  copyFileSync(logo, join(iconsOut, 'icon128.png'));
  copyFileSync(logo, join(iconsOut, 'icon48.png'));
  copyFileSync(logo, join(iconsOut, 'icon16.png'));
} else if (existsSync(extIcon128)) {
  copyFileSync(extIcon128, join(iconsOut, 'icon128.png'));
  copyFileSync(extIcon128, join(iconsOut, 'icon48.png'));
  copyFileSync(extIcon128, join(iconsOut, 'icon16.png'));
}

console.log('Extension files copied to dist-extension/');
