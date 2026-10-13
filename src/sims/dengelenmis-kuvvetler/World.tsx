import { memo } from 'react';
import { INK } from './Kid';

/**
 * Dünya (piksel, y aşağı doğru artar). Yol yüzeyi y = 0.
 * Okul solda; yol EDGE_X'te uçurumla biter; uçurumun karşı kenarı FAR_X'tedir.
 * Kamera öğrenciyi dikeyde izlediği için gökyüzü ve kaya duvarları
 * TILE yüksekliğinde döşemeler hâlinde, gerektiği kadar üretilir.
 */
export const EDGE_X = 2400;
export const FAR_X = 3500;
const X_MIN = -300;
const X_MAX = 4300;
export const TILE = 600;

/** Belirlenimci rastgele sayı [0, 1) */
function rnd(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function ramp(y: number) {
  return Math.min(1, Math.max(0, y / 70));
}

export function leftFace(y: number): number {
  if (y <= 0) return EDGE_X;
  return EDGE_X - (18 + 16 * Math.sin(y / 97) + 9 * Math.sin(y / 37 + 1.3)) * ramp(y);
}

export function rightFace(y: number): number {
  if (y <= 0) return FAR_X;
  return FAR_X + (20 + 14 * Math.sin(y / 89 + 2) + 8 * Math.sin(y / 29)) * ramp(y);
}

const f1 = (n: number) => n.toFixed(1);

/** Bir kaya duvarı döşemesi: tabakalar, yüzeye yakın tarama, çatlaklar */
const RockTile = memo(function RockTile({ j }: { j: number }) {
  const y0 = j * TILE;
  const y1 = y0 + TILE;
  const ys: number[] = [];
  for (let y = y0; y <= y1 + 0.1; y += 20) ys.push(y);
  const lf = ys.map((y) => `${f1(leftFace(y))},${y}`);
  const rf = ys.map((y) => `${f1(rightFace(y))},${y}`);

  // Uçurum içi: derinleştikçe koyulaşan gri
  const depth = Math.max(0, y0) / 2400;
  const shade = Math.round(244 - Math.min(1, depth) * 34);
  const gap = `rgb(${shade},${shade},${shade - 3})`;

  const strata: string[] = [];
  const marks: string[] = [];
  for (let k = 0; k < 5; k++) {
    const by = y0 + (k + 0.5) * (TILE / 5) + (rnd(j, k) - 0.5) * 50;
    if (by < 46) continue;
    const ph = rnd(j, k + 20) * 6;
    // sol kütle
    const pts: string[] = [];
    const lfx = leftFace(by);
    for (let x = X_MIN; x < lfx - 30; x += 70) {
      pts.push(`${x},${f1(by + 9 * Math.sin(x / 160 + ph) + 5 * Math.sin(x / 47 + ph * 2))}`);
    }
    pts.push(`${f1(lfx)},${f1(by + 9 * Math.sin(lfx / 160 + ph))}`);
    strata.push(`M${pts.join(' L')}`);
    // sağ kütle
    const rfx = rightFace(by);
    const rp: string[] = [`${f1(rfx)},${f1(by + 9 * Math.sin(rfx / 160 + ph))}`];
    for (let x = Math.ceil(rfx / 70) * 70 + 30; x < X_MAX; x += 70) {
      rp.push(`${x},${f1(by + 9 * Math.sin(x / 160 + ph) + 5 * Math.sin(x / 47 + ph * 2))}`);
    }
    strata.push(`M${rp.join(' L')}`);
  }
  // yüzeye yakın kısa tarama çizgileri (gölge)
  for (let i = 0; i < 26; i++) {
    const y = y0 + rnd(j, 100 + i) * TILE;
    if (y < 30) continue;
    const len = 26 + rnd(j, 200 + i) * 40;
    const lx = leftFace(y) - 10 - rnd(j, 300 + i) * 26;
    marks.push(`M${f1(lx - len)},${f1(y + 10)} L${f1(lx)},${f1(y - 6)}`);
    const rx = rightFace(y) + 10 + rnd(j, 400 + i) * 26;
    marks.push(`M${f1(rx)},${f1(y - 6)} L${f1(rx + len)},${f1(y + 10)}`);
  }
  // çatlaklar ve küçük taşlar
  const cracks: string[] = [];
  const pebbles: Array<[number, number, number]> = [];
  for (let i = 0; i < 9; i++) {
    const y = y0 + rnd(j, 500 + i) * TILE;
    if (y < 60) continue;
    const left = i % 2 === 0;
    const x = left ? leftFace(y) - 120 - rnd(j, 600 + i) * 700 : rightFace(y) + 90 + rnd(j, 600 + i) * 260;
    const a = rnd(j, 700 + i) * 12;
    cracks.push(`M${f1(x)},${f1(y)} l${f1(14 + a)},${f1(12)} l${f1(-6)},${f1(16 + a)} l${f1(12)},${f1(10)}`);
    pebbles.push([x + 40, y - 20 + a, 5 + a / 3]);
  }

  return (
    <g data-tile={j}>
      <path
        d={`M${lf.join(' L')} L${rf.slice().reverse().join(' L')} Z`}
        fill={gap}
      />
      {/* uzak duvar: soluk düşey çizgiler */}
      <g stroke="#c9c9c4" strokeWidth={2} opacity={0.55}>
        {Array.from({ length: 7 }, (_, i) => {
          const x = EDGE_X + 120 + rnd(j, 800 + i) * (FAR_X - EDGE_X - 240);
          const yy = y0 + rnd(j, 900 + i) * TILE;
          if (yy < 80) return null;
          return <path key={i} d={`M${f1(x)},${f1(yy)} l0,${f1(60 + rnd(j, 950 + i) * 120)}`} />;
        })}
      </g>
      <path d={`M${lf.join(' L')}`} stroke={INK} strokeWidth={5} fill="none" strokeLinejoin="round" />
      <path d={`M${rf.join(' L')}`} stroke={INK} strokeWidth={5} fill="none" strokeLinejoin="round" />
      <path d={strata.join(' ')} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d={marks.join(' ')} stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={cracks.join(' ')} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      {pebbles.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r} fill="#fff" stroke={INK} strokeWidth={2.2} opacity={0.75} />
      ))}
    </g>
  );
});

function cloudPath(cx: number, cy: number, s: number, seed: number): string {
  const w = 190 * s;
  const n = 5;
  let d = `M${f1(cx - w / 2)},${f1(cy)}`;
  for (let i = 0; i < n; i++) {
    const x0 = cx - w / 2 + (w / n) * i;
    const x1 = x0 + w / n;
    const h = (34 + rnd(seed, i) * 34) * s;
    d += ` C${f1(x0)},${f1(cy - h)} ${f1(x1)},${f1(cy - h)} ${f1(x1)},${f1(cy)}`;
  }
  return `${d} Z`;
}

const SkyTile = memo(function SkyTile({ j }: { j: number }) {
  const y0 = j * TILE;
  const clouds: Array<{ x: number; y: number; s: number; seed: number }> = [];
  for (let k = 0; k < 7; k++) {
    const y = y0 + rnd(j, k + 40) * TILE;
    if (y > -380) continue;
    clouds.push({ x: X_MIN + rnd(j, k) * (X_MAX - X_MIN), y, s: 0.7 + rnd(j, k + 80) * 0.8, seed: j * 31 + k });
  }
  const birds: Array<[number, number, number]> = [];
  for (let k = 0; k < 3; k++) {
    const y = y0 + rnd(j, k + 140) * TILE;
    if (y > -480 || rnd(j, k + 160) < 0.45) continue;
    birds.push([X_MIN + rnd(j, k + 120) * (X_MAX - X_MIN), y, 0.7 + rnd(j, k + 180) * 0.6]);
  }
  return (
    <g data-tile={j}>
      {clouds.map((c, i) => (
        <g key={i}>
          <path d={cloudPath(c.x, c.y, c.s, c.seed)} fill="#fff" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path
            d={`M${f1(c.x - 60 * c.s)},${f1(c.y - 10 * c.s)} l${f1(40 * c.s)},0 M${f1(c.x)},${f1(c.y - 18 * c.s)} l${f1(50 * c.s)},0`}
            stroke={INK}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.5}
          />
        </g>
      ))}
      {birds.map(([x, y, s], i) => (
        <path
          key={i}
          d={`M${f1(x - 18 * s)},${f1(y - 8 * s)} Q${f1(x - 8 * s)},${f1(y - 12 * s)} ${f1(x)},${f1(y)} Q${f1(x + 8 * s)},${f1(y - 12 * s)} ${f1(x + 18 * s)},${f1(y - 8 * s)}`}
          stroke={INK}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
});

function Tree({ x, s = 1 }: { x: number; s?: number }) {
  const c: string[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.push(`${f1(x + Math.cos(a) * 110 * s)},${f1(-300 * s + Math.sin(a) * 95 * s)}`);
  }
  // tırtıklı taç
  let d = `M${c[0]}`;
  for (let i = 0; i < 9; i++) {
    const [ax, ay] = c[i].split(',').map(Number);
    const [bx, by] = c[(i + 1) % 9].split(',').map(Number);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const ox = (mx - x) * 0.32;
    const oy = (my + 300 * s) * 0.32;
    d += ` Q${f1(mx + ox)},${f1(my + oy)} ${f1(bx)},${f1(by)}`;
  }
  return (
    <g>
      <path d={`M${x - 14 * s},0 L${x - 10 * s},${-220 * s} L${x + 10 * s},${-220 * s} L${x + 14 * s},0 Z`} fill="#fff" stroke={INK} strokeWidth={4} />
      <path d={`M${x},${-200 * s} L${x + 46 * s},${-250 * s} M${x},${-170 * s} L${x - 40 * s},${-226 * s}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d={d} fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" opacity={0.55}>
        <path d={`M${x + 20 * s},${-250 * s} q14,-8 26,0 M${x - 60 * s},${-300 * s} q14,-8 26,0 M${x + 40 * s},${-340 * s} q14,-8 26,0 M${x - 30 * s},${-370 * s} q12,-8 24,0`} fill="none" />
      </g>
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g stroke={INK} strokeWidth={4} fill="#fff" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x - 16},0 L${x + 16},0 L${x + 10},-22 L${x - 10},-22 Z`} />
      <path d={`M${x},-22 L${x},-380 Q${x},-410 ${x + 30},-410 L${x + 56},-410`} fill="none" strokeWidth={7} />
      <path d={`M${x + 40},-412 L${x + 80},-412 L${x + 72},-394 L${x + 48},-394 Z`} />
    </g>
  );
}

function School() {
  const windows: Array<[number, number]> = [];
  for (const wy of [-470, -340]) for (const wx of [150, 270, 450, 570]) windows.push([wx, wy]);
  windows.push([150, -210], [570, -210]);
  return (
    <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
      <rect x={100} y={-520} width={600} height={520} fill="#fff" strokeWidth={5} />
      <path d="M86,-520 L714,-520 M86,-540 L714,-540 L714,-520 M86,-540 L86,-520" strokeWidth={5} fill="none" />
      <path d="M300,-540 L400,-610 L500,-540" fill="#fff" strokeWidth={5} />
      <circle cx={400} cy={-568} r={22} fill="#fff" strokeWidth={4} />
      <path d="M400,-568 L400,-582 M400,-568 L410,-562" strokeWidth={3} />
      {/* tuğla dokusu */}
      <g strokeWidth={2} opacity={0.35}>
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${120 + (i % 4) * 150},${-500 + Math.floor(i / 4) * 160} l40,0 m-20,14 l40,0`} />
        ))}
      </g>
      {windows.map(([wx, wy], i) => (
        <g key={i}>
          <rect x={wx} y={wy} width={80} height={96} fill={i % 3 === 0 ? 'url(#dg-hill)' : '#fff'} strokeWidth={4} />
          <path d={`M${wx + 40},${wy} L${wx + 40},${wy + 96} M${wx},${wy + 44} L${wx + 80},${wy + 44}`} strokeWidth={3} />
          <path d={`M${wx - 6},${wy + 100} L${wx + 86},${wy + 100}`} strokeWidth={4} />
        </g>
      ))}
      <rect x={320} y={-196} width={160} height={40} rx={6} fill="#fff" strokeWidth={4} />
      <text x={400} y={-166} textAnchor="middle" fontSize={28} fontWeight={750} fill={INK} stroke="none" fontFamily="var(--font)" letterSpacing="4">
        OKUL
      </text>
      <rect x={340} y={-142} width={120} height={142} fill="#fff" strokeWidth={4} />
      <path d="M400,-142 L400,0" strokeWidth={3} />
      <circle cx={388} cy={-70} r={4} fill={INK} />
      <circle cx={412} cy={-70} r={4} fill={INK} />
      <path d="M320,0 L320,-10 L480,-10 L480,0" fill="#fff" strokeWidth={4} />
      {/* bahçe çiti ve açık kapı */}
      <g strokeWidth={3.5} fill="#fff">
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M${712 + i * 14},0 L${712 + i * 14},-70 L${718 + i * 14},-80 L${724 + i * 14},-70 L${724 + i * 14},0`} />
        ))}
        <path d="M704,-24 L802,-24 M704,-56 L802,-56" fill="none" />
        <rect x={800} y={-104} width={18} height={104} />
        <rect x={900} y={-104} width={18} height={104} />
        <path d="M918,-90 L966,-120 L966,-14 L918,-8 Z" />
      </g>
    </g>
  );
}

/** Zemin seviyesindeki sabit dekor: tepeler, okul, ağaçlar, yol, uyarı levhası */
export const GroundProps = memo(function GroundProps() {
  const hill: string[] = [];
  for (let x = X_MIN; x <= X_MAX; x += 50) {
    hill.push(`${x},${f1(-150 - 70 * Math.sin(x / 400) - 40 * Math.sin(x / 170 + 1))}`);
  }
  const ticks: string[] = [];
  for (let x = X_MIN + 20; x < EDGE_X - 20; x += 64) ticks.push(`M${x},0 L${x},12`);
  for (let x = FAR_X + 40; x < X_MAX; x += 64) ticks.push(`M${x},0 L${x},12`);
  const grass: string[] = [];
  for (let x = X_MIN; x < X_MAX; x += 37) {
    if (x > EDGE_X - 20 && x < FAR_X + 20) continue;
    if (rnd(x, 7) < 0.45) continue;
    grass.push(`M${x},0 l-5,-14 M${x + 6},0 l2,-18 M${x + 12},0 l7,-12`);
  }
  return (
    <g>
      <path d={`M${X_MIN},0 L${hill.join(' L')} L${X_MAX},0 Z`} fill="url(#dg-hill)" stroke="#9c9c97" strokeWidth={3} strokeLinejoin="round" />
      <School />
      <Tree x={1180} />
      <Tree x={1760} s={0.85} />
      <Tree x={3880} s={1.05} />
      <Lamp x={1440} />
      <Lamp x={2060} />
      {/* uyarı levhası */}
      <g stroke={INK} strokeWidth={4} strokeLinejoin="round" data-testid="warning-sign">
        <rect x={2240} y={-230} width={12} height={230} fill="#fff" />
        <path d="M2246,-330 L2310,-216 L2182,-216 Z" fill="#fff" strokeWidth={6} />
        <path d="M2246,-296 L2246,-252" strokeWidth={9} strokeLinecap="round" />
        <circle cx={2246} cy={-234} r={5} fill={INK} stroke="none" />
      </g>
      {/* yol / kaldırım */}
      <rect x={X_MIN} y={0} width={EDGE_X - X_MIN} height={22} fill="#fff" />
      <rect x={FAR_X} y={0} width={X_MAX - FAR_X} height={22} fill="#fff" />
      <path d={`M${X_MIN},0 L${EDGE_X},0 M${FAR_X},0 L${X_MAX},0`} stroke={INK} strokeWidth={6} />
      <path d={`M${X_MIN},22 L${leftFace(22)},22 M${rightFace(22)},22 L${X_MAX},22`} stroke={INK} strokeWidth={3} />
      <path d={ticks.join(' ')} stroke={INK} strokeWidth={2.5} />
      <path d={grass.join(' ')} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
});

export function WorldTiles({ camY }: { camY: number }) {
  const first = Math.floor(camY / TILE);
  const last = Math.floor((camY + 1080) / TILE);
  const sky: number[] = [];
  const rock: number[] = [];
  for (let j = first; j <= last; j++) {
    if (j < 0) sky.push(j);
    else rock.push(j);
  }
  return (
    <>
      {sky.map((j) => (
        <SkyTile key={`s${j}`} j={j} />
      ))}
      {rock.map((j) => (
        <RockTile key={`r${j}`} j={j} />
      ))}
    </>
  );
}
