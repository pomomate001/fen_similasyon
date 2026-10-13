import { Apple } from './nature';

export function ObjectDefs() {
  return (
    <defs>
      <radialGradient id="ballGrad" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff0a6" />
        <stop offset="0.5" stopColor="#ffc93c" />
        <stop offset="1" stopColor="#e09a12" />
      </radialGradient>
      <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#d5dbe6" />
        <stop offset="0.45" stopColor="#ffffff" />
        <stop offset="1" stopColor="#c4ccd9" />
      </linearGradient>
      <linearGradient id="rocketAccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1f9b8d" />
        <stop offset="0.5" stopColor="#34c0ae" />
        <stop offset="1" stopColor="#178074" />
      </linearGradient>
      <radialGradient id="flame" cx="0.5" cy="0.15" r="0.9">
        <stop offset="0" stopColor="#fffbe0" />
        <stop offset="0.35" stopColor="#ffd34d" />
        <stop offset="0.8" stopColor="#ff9a2e" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9a86c" />
        <stop offset="1" stopColor="#b9864b" />
      </linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9aa6b8" />
        <stop offset="1" stopColor="#6e7a8e" />
      </linearGradient>
      <radialGradient id="ocean" cx="0.38" cy="0.32" r="0.8">
        <stop offset="0" stopColor="#b9e2f4" />
        <stop offset="1" stopColor="#6fb2d6" />
      </radialGradient>
      <pattern id="ropeTwist" width="22" height="16" patternUnits="userSpaceOnUse">
        <rect width="22" height="16" fill="#d8b77e" />
        <path d="M-4 16 L10 0 M7 16 L21 0 M18 16 L32 0" stroke="#b48d50" strokeWidth="4" />
      </pattern>
    </defs>
  );
}

/** Top: (0,0) merkez, yarıçap 34·s */
export function Ball({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <circle r={34} fill="url(#ballGrad)" stroke="#b97a0c" strokeWidth={2.5} />
      <path d="M-34 0 C -14 -12, 14 -12, 34 0" stroke="#1f9b8d" strokeWidth={7} fill="none" />
      <path d="M-30 16 C -10 6, 10 6, 30 16" stroke="#fff" strokeWidth={6} fill="none" opacity={0.85} />
      <ellipse cx={-12} cy={-16} rx={9} ry={6} fill="#fff" opacity={0.6} />
    </g>
  );
}

/**
 * Oyuncak roket. Yerel (0,0) = alt orta (rampa üstü).
 * Kütle merkezi yaklaşık (0, -140). Burun ucu (0, -290).
 */
export const ROCKET_CENTER_Y = -140;
export function Rocket({ x, y, s = 1, flame = 0 }: { x: number; y: number; s?: number; flame?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {flame > 0 && (
        <g transform={`translate(0 -8) scale(${0.7 + flame * 0.3} ${flame})`}>
          <path d="M-26 0 C -30 50, -6 110, 0 140 C 6 110, 30 50, 26 0 Z" fill="url(#flame)" />
          <path d="M-13 0 C -14 30, -4 64, 0 82 C 4 64, 14 30, 13 0 Z" fill="#fffbe0" opacity={0.9} />
        </g>
      )}
      <path d="M-24 -30 L-30 0 H30 L24 -30 Z" fill="#4a5366" />
      <path d="M-42 -150 C -78 -120, -86 -60, -84 -20 L -42 -46 Z" fill="url(#rocketAccent)" />
      <path d="M42 -150 C 78 -120, 86 -60, 84 -20 L 42 -46 Z" fill="url(#rocketAccent)" />
      <rect x={-42} y={-222} width={84} height={196} rx={18} fill="url(#rocketBody)" stroke="#aab4c4" strokeWidth={2} />
      <path d="M-42 -214 C -40 -262, -14 -286, 0 -292 C 14 -286, 40 -262, 42 -214 Z" fill="url(#rocketAccent)" />
      <rect x={-42} y={-74} width={84} height={14} fill="#34c0ae" opacity={0.9} />
      <circle cx={0} cy={-168} r={21} fill="#2c3a55" stroke="#dfe5ee" strokeWidth={6} />
      <circle cx={-6} cy={-174} r={6} fill="#fff" opacity={0.65} />
      <path d="M-6 -46 V -26 M6 -46 V -26" stroke="#4a5366" strokeWidth={3} />
    </g>
  );
}

export function LaunchPad({ x, y, groundY }: { x: number; y: number; groundY: number }) {
  return (
    <g>
      <path d={`M${x - 90} ${y + 16} L${x - 120} ${groundY} M${x + 90} ${y + 16} L${x + 120} ${groundY}`} stroke="#6e7a8e" strokeWidth={12} strokeLinecap="round" />
      <path d={`M${x - 104} ${y + 70} L${x + 104} ${y + 70}`} stroke="#6e7a8e" strokeWidth={8} />
      <rect x={x - 140} y={y} width={280} height={22} rx={8} fill="url(#metal)" />
      <rect x={x - 140} y={y} width={280} height={6} rx={3} fill="#c3ccd8" />
    </g>
  );
}

/**
 * Tekerlekli taşıma arabası. Yerel (0,0) = alt orta (zemin).
 * Arka tutamak x = -150; orta nokta (0, -105).
 */
export const CART_CENTER_Y = -105;
export function Cart({ x, y, s = 1, wheelRot = 0, tint = '#d9a86c' }: { x: number; y: number; s?: number; wheelRot?: number; tint?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={170} ry={10} fill="#000" opacity={0.13} />
      <rect x={-118} y={-182} width={110} height={90} rx={8} fill={tint} stroke="#a7783f" strokeWidth={3} />
      <path d="M-118 -137 h110 M-63 -182 v90" stroke="#a7783f" strokeWidth={3} />
      <rect x={6} y={-160} width={96} height={68} rx={8} fill="#c58f53" stroke="#a7783f" strokeWidth={3} />
      <path d="M6 -126 h96" stroke="#a7783f" strokeWidth={3} />
      <rect x={-150} y={-96} width={300} height={40} rx={10} fill="url(#metal)" />
      <rect x={-150} y={-96} width={300} height={8} rx={4} fill="#c3ccd8" />
      <path d="M-148 -96 L-160 -190" stroke="#6e7a8e" strokeWidth={12} strokeLinecap="round" />
      <path d="M-170 -192 h22" stroke="#3b4354" strokeWidth={14} strokeLinecap="round" />
      {[-100, 100].map((wx) => (
        <g key={wx} transform={`translate(${wx} -30) rotate(${wheelRot})`}>
          <circle r={30} fill="#2b313d" />
          <circle r={14} fill="#9aa6b8" />
          <path d="M0 -26 V26 M-26 0 H26" stroke="#5c6576" strokeWidth={4} />
        </g>
      ))}
    </g>
  );
}

/** Ahşap kasa: (0,0) merkez */
export function Crate({ x, y, size = 160 }: { x: number; y: number; size?: number }) {
  const h = size / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={h + 4} rx={h * 1.05} ry={9} fill="#000" opacity={0.13} />
      <rect x={-h} y={-h} width={size} height={size} rx={10} fill="url(#wood)" stroke="#9b6b35" strokeWidth={4} />
      <rect x={-h + 12} y={-h + 12} width={size - 24} height={size - 24} rx={6} fill="none" stroke="#a87a42" strokeWidth={4} />
      <path d={`M${-h + 14} ${-h + 14} L${h - 14} ${h - 14}`} stroke="#a87a42" strokeWidth={10} />
    </g>
  );
}

/** Dünya küresi: merkez (x,y), yarıçap r */
export function Globe({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="url(#ocean)" stroke="#4f8fb5" strokeWidth={4} />
      <g fill="#8cc47a" stroke="#6ca85c" strokeWidth={2}>
        <path d={`M${-r * 0.55} ${-r * 0.45} c ${r * 0.2} ${-r * 0.25} ${r * 0.55} ${-r * 0.2} ${r * 0.6} ${r * 0.05} c ${-r * 0.05} ${r * 0.2} ${-r * 0.3} ${r * 0.15} ${-r * 0.35} ${r * 0.35} c ${-r * 0.15} ${r * 0.05} ${-r * 0.3} ${-r * 0.2} ${-r * 0.25} ${-r * 0.4} z`} />
        <path d={`M${r * 0.15} ${r * 0.1} c ${r * 0.25} ${-r * 0.1} ${r * 0.5} ${r * 0.05} ${r * 0.45} ${r * 0.3} c ${-r * 0.05} ${r * 0.2} ${-r * 0.3} ${r * 0.3} ${-r * 0.42} ${r * 0.18} c ${-r * 0.1} ${-r * 0.12} ${-r * 0.1} ${-r * 0.35} ${-r * 0.03} ${-r * 0.48} z`} />
        <path d={`M${-r * 0.6} ${r * 0.25} c ${r * 0.12} ${-r * 0.05} ${r * 0.25} ${r * 0.08} ${r * 0.2} ${r * 0.22} c ${-r * 0.1} ${r * 0.1} ${-r * 0.25} ${r * 0.02} ${-r * 0.2} ${-r * 0.22} z`} />
      </g>
      <circle r={r} fill="none" stroke="#fff" strokeWidth={3} opacity={0.35} />
    </g>
  );
}

/** File torbada n elma. (0,0) merkez. Torbanın kendi kütlesi ihmal edilir. */
export function AppleBag({ x, y, n }: { x: number; y: number; n: 1 | 2 | 3 }) {
  const pos: Array<[number, number]> =
    n === 1 ? [[0, 0]] : n === 2 ? [[-30, 6], [32, 0]] : [[-44, 14], [44, 12], [0, -28]];
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 ${n === 3 ? -96 : -70} V ${n === 3 ? -130 : -110}`} stroke="#8a7b66" strokeWidth={4} />
      <circle cx={0} cy={n === 3 ? -138 : -118} r={9} fill="none" stroke="#8a7b66" strokeWidth={4} />
      {pos.map(([ax, ay], i) => (
        <Apple key={i} x={ax} y={ay} s={0.62} stem={false} />
      ))}
      <path
        d={n === 1 ? 'M-40 -36 Q0 -70 40 -36 Q50 20 0 44 Q-50 20 -40 -36' : n === 2 ? 'M-72 -30 Q0 -76 72 -30 Q86 30 0 52 Q-86 30 -72 -30' : 'M-86 -40 Q0 -100 86 -40 Q98 34 0 62 Q-98 34 -86 -40'}
        fill="none"
        stroke="#8a7b66"
        strokeWidth={3}
        strokeDasharray="7 7"
      />
    </g>
  );
}

/** Halat: x1'den x2'ye, y yüksekliğinde; ortadaki şerit konumu marker */
export function Rope({ x1, x2, y, marker }: { x1: number; x2: number; y: number; marker: number }) {
  return (
    <g>
      <rect x={x1} y={y - 8} width={x2 - x1} height={16} rx={8} fill="url(#ropeTwist)" stroke="#a07c43" strokeWidth={2} />
      <g transform={`translate(${marker} ${y})`}>
        <rect x={-9} y={-12} width={18} height={24} rx={4} fill="#ffc93c" stroke="#c99512" strokeWidth={2} />
        <path d="M0 12 L0 60" stroke="#c99512" strokeWidth={4} />
        <path d="M0 26 L34 38 L0 50 Z" fill="#ffc93c" stroke="#c99512" strokeWidth={2} />
      </g>
    </g>
  );
}
