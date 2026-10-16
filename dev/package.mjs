// Crée dist/maison-nette-theme.zip, prêt à téléverser dans Shopify
// (Boutique en ligne › Thèmes › Ajouter un thème › Importer un fichier zip).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const out = path.join(root, 'dist', `maison-nette-theme-${pkg.version}.zip`);
const dirs = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

fs.mkdirSync(path.dirname(out), { recursive: true });
if (fs.existsSync(out)) fs.unlinkSync(out);
execFileSync('zip', ['-r', '-q', '-X', out, ...dirs, '-x', '*.DS_Store'], { cwd: root, stdio: 'inherit' });
console.log(`Thème empaqueté : ${path.relative(root, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} Ko)`);
