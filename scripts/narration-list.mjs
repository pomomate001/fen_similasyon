// Seslendirme listesi: kimlik + EMA'ya gidecek metin (kesme işaretleri kaldırılmış).
// Kullanım: node --experimental-strip-types scripts/narration-list.mjs [sadece-eksikler]
import { readFileSync, existsSync } from 'node:fs';
import { toTtsText } from '../src/engine/narration.ts';

const manifest = JSON.parse(readFileSync(new URL('../src/sims/bileske-kuvvet/narration.tr.json', import.meta.url), 'utf8'));
const onlyMissing = process.argv[2] === 'eksik';
const out = [];
for (const [id, line] of Object.entries(manifest)) {
  const file = new URL(`../public/audio/bileske-kuvvet/${id}.mp3`, import.meta.url);
  if (onlyMissing && existsSync(file)) continue;
  out.push({ id, tts: toTtsText(line) });
}
console.log(JSON.stringify(out, null, 1));
