// Theme Check (outil officiel Shopify) sur le thème à la racine du dépôt.
// Usage : npm run check   — échoue s'il reste une erreur ; affiche aussi avertissements et infos.
import path from 'node:path';
import { themeCheckRun } from '@shopify/theme-check-node';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { offenses } = await themeCheckRun(root, undefined, () => {});
const sev = ['erreur', 'avertissement', 'info'];
const rel = (u) => u.replace('file://' + root + '/', '');
const shown = offenses.filter((o) => !/^file:\/\/.*\/(dev|docs|node_modules)\//.test(o.uri));
for (const o of shown.sort((a, b) => a.severity - b.severity)) {
  console.log(`${sev[o.severity].padEnd(13)} ${rel(o.uri)}:${o.start.line + 1}  [${o.check}] ${o.message}`);
}
const errors = shown.filter((o) => o.severity === 0).length;
console.log(`\n${errors} erreur(s), ${shown.filter((o) => o.severity === 1).length} avertissement(s), ${shown.filter((o) => o.severity === 2).length} info(s)`);
if (errors) process.exitCode = 1;
