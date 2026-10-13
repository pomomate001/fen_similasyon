import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { toTtsText, type NarrationManifest } from '../../engine/narration';
import manifestJson from './narration.tr.json';

const manifest = manifestJson as NarrationManifest;
const root = resolve(process.cwd());
const audioDir = join(root, 'public/audio/bileske-kuvvet');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(d.name) && !d.name.endsWith('.test.ts') ? [p] : [];
  });
}

describe('anlatım manifesti', () => {
  const ids = Object.keys(manifest);

  it('her satırın metni var', () => {
    for (const id of ids) expect(manifest[id].text.trim().length, id).toBeGreaterThan(0);
  });

  it('EMA metinlerinde kesme işareti yok', () => {
    for (const id of ids) expect(toTtsText(manifest[id]), id).not.toMatch(/['’‘`]/);
  });

  it('her satırın ses dosyası ve gerçek süresi var', () => {
    for (const id of ids) {
      const line = manifest[id];
      expect(line.file, id).toBeTruthy();
      expect(existsSync(join(audioDir, line.file!)), `${id}: ${line.file}`).toBe(true);
      expect(line.duration ?? 0, id).toBeGreaterThan(0.8);
    }
  });

  it('kodda kullanılan her anlatım kimliği manifestte var', () => {
    const files = sourceFiles(join(root, 'src/sims/bileske-kuvvet'));
    const used = new Set<string>();
    const re = /['"`](s\d+\.[\w.]+)['"`]/g;
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(50);
    const missing = [...used].filter((id) => !manifest[id]);
    expect(missing).toEqual([]);
  });

  it('kullanılmayan anlatım satırı kalmadı', () => {
    const files = sourceFiles(join(root, 'src/sims/bileske-kuvvet'));
    const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    const unused = ids.filter((id) => !all.includes(`'${id}'`) && !all.includes(`"${id}"`));
    expect(unused).toEqual([]);
  });
});
