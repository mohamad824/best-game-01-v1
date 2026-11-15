// SALTWIND CARAVAN — entrypoint for make.fun best-game-01.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts. Node 22, standard library only.
// Both runs must write identical bytes: files are copied in sorted
// order, directory mtimes are never recorded, and the dossier is the
// canonical JSON buildDossier writes from the copied files.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

function copyTreeSorted(srcDir, dstDir) {
  mkdirSync(dstDir, { recursive: true });
  const names = readdirSync(srcDir).sort();
  for (const name of names) {
    const src = join(srcDir, name);
    const dst = join(dstDir, name);
    if (statSync(src).isDirectory()) copyTreeSorted(src, dst);
    else cpSync(src, dst);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

function main() {
  const gameSrc = join(REPO_ROOT, 'game');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('missing game/ directory in repository');
  if (!existsSync(join(gameSrc, 'index.html'))) throw new Error('missing game/index.html');
  if (!existsSync(shotsSrc)) throw new Error('missing screenshots/ directory in repository');
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  copyTreeSorted(gameSrc, join(OUT_DIR, 'game'));
  copyTreeSorted(shotsSrc, join(OUT_DIR, 'screenshots'));
  const dossier = buildDossier(OUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
  const gameFiles = countFiles(join(OUT_DIR, 'game'));
  const shotFiles = countFiles(join(OUT_DIR, 'screenshots'));
  console.log(`wrote ${OUT_DIR}: ${gameFiles} game files, ${shotFiles} screenshots, dossier ${dossier.length} bytes`);
}

main();
