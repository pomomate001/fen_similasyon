/**
 * Karakterler. Yerel koordinat: ayaklar (0,0), karakter sağa bakar.
 * flip=true → sola bakar.
 */
export type KidPose = 'stand' | 'push' | 'pull' | 'lift';

export interface KidProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  pose?: KidPose;
  shirt?: string;
  pants?: string;
  hair?: string;
  skin?: string;
  /** 'lift' pozunda ellerin yüksekliği (yerel, negatif yukarı) */
  handY?: number;
  /** Öne/arkaya eğilme (derece) */
  lean?: number;
  hairStyle?: 'short' | 'long' | 'curly';
}

export function Kid({
  x,
  y,
  s = 1,
  flip = false,
  pose = 'stand',
  shirt = '#5aa9a0',
  pants = '#3e4a63',
  hair = '#3b2a20',
  skin = '#f2c7a5',
  handY = -205,
  lean,
  hairStyle = 'short',
}: KidProps) {
  const l = lean ?? (pose === 'push' ? 12 : pose === 'pull' ? -14 : 0);
  const sx = flip ? -s : s;
  const shoulder = { x: 6, y: -192 };
  let handA: { x: number; y: number };
  let handB: { x: number; y: number };
  switch (pose) {
    case 'push':
      handA = { x: 92, y: -186 };
      handB = { x: 86, y: -168 };
      break;
    case 'pull':
      handA = { x: 84, y: -150 };
      handB = { x: 62, y: -146 };
      break;
    case 'lift':
      handA = { x: 34, y: handY };
      handB = { x: 18, y: handY + 6 };
      break;
    default:
      handA = { x: 18, y: -112 };
      handB = { x: -12, y: -112 };
  }
  const elbow = (h: { x: number; y: number }, bend: number) => ({
    x: (shoulder.x + h.x) / 2 - bend,
    y: (shoulder.y + h.y) / 2 + Math.abs(bend) * 0.6,
  });
  const eA = elbow(handA, pose === 'lift' ? -10 : 8);
  const eB = elbow(handB, pose === 'lift' ? -6 : 14);
  const legBack = pose === 'pull' ? 'M-6 -104 C -10 -60, -40 -40, -46 -6' : 'M-6 -104 C -10 -60, -26 -36, -24 -6';
  const legFront = pose === 'push' ? 'M8 -104 C 16 -70, 28 -40, 34 -6' : pose === 'pull' ? 'M8 -104 C 20 -70, 26 -38, 22 -6' : 'M8 -104 C 12 -64, 16 -36, 16 -6';

  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${s})`}>
      <ellipse cx={0} cy={2} rx={58} ry={9} fill="#000" opacity={0.12} />
      <g transform={`rotate(${l} 0 0)`}>
        {/* arka kol */}
        <path d={`M${shoulder.x} ${shoulder.y} Q ${eB.x} ${eB.y} ${handB.x} ${handB.y}`} stroke={darken(shirt)} strokeWidth={19} fill="none" strokeLinecap="round" />
        <circle cx={handB.x} cy={handB.y} r={11} fill={darken(skin, 0.08)} />
        {/* bacaklar */}
        <path d={legBack} stroke={darken(pants, 0.1)} strokeWidth={24} fill="none" strokeLinecap="round" />
        <path d={legFront} stroke={pants} strokeWidth={24} fill="none" strokeLinecap="round" />
        <ellipse cx={pose === 'pull' ? -50 : -26} cy={-5} rx={21} ry={10} fill="#2b2f3a" />
        <ellipse cx={pose === 'push' ? 40 : pose === 'pull' ? 28 : 22} cy={-5} rx={21} ry={10} fill="#2b2f3a" />
        {/* gövde */}
        <rect x={-33} y={-210} width={68} height={116} rx={26} fill={shirt} />
        <path d="M-33 -150 h68" stroke={darken(shirt, 0.08)} strokeWidth={4} opacity={0.5} />
        {/* boyun + baş */}
        <rect x={-6} y={-226} width={18} height={22} rx={6} fill={darken(skin, 0.06)} />
        <circle cx={6} cy={-258} r={42} fill={skin} />
        <Hair style={hairStyle} color={hair} />
        <circle cx={27} cy={-262} r={4.6} fill="#2a2320" />
        <path d="M22 -240 q 9 6 17 -1" stroke="#7d3f2b" strokeWidth={3.4} fill="none" strokeLinecap="round" />
        <circle cx={14} cy={-246} r={7} fill="#f19a8b" opacity={0.45} />
        <ellipse cx={-30} cy={-256} rx={8} ry={11} fill={darken(skin, 0.05)} />
        {/* ön kol */}
        <path d={`M${shoulder.x + 4} ${shoulder.y + 4} Q ${eA.x} ${eA.y} ${handA.x} ${handA.y}`} stroke={shirt} strokeWidth={20} fill="none" strokeLinecap="round" />
        <circle cx={handA.x} cy={handA.y} r={12} fill={skin} />
      </g>
    </g>
  );
}

function Hair({ style, color }: { style: 'short' | 'long' | 'curly'; color: string }) {
  if (style === 'long')
    return (
      <path
        d="M-38 -250 C -46 -300, 20 -322, 46 -282 C 52 -272, 50 -262, 44 -262 C 24 -282, -4 -284, -14 -270 C -22 -250, -24 -220, -40 -196 C -54 -214, -46 -236, -38 -250 Z"
        fill={color}
      />
    );
  if (style === 'curly')
    return (
      <g fill={color}>
        {[
          [-30, -276, 17],
          [-12, -293, 17],
          [10, -298, 17],
          [31, -288, 15],
          [-36, -254, 14],
          [44, -272, 11],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    );
  return (
    <path d="M-36 -258 C -40 -300, 22 -318, 46 -282 C 48 -276, 46 -270, 40 -270 C 22 -284, 0 -282, -16 -276 C -22 -268, -26 -258, -36 -246 Z" fill={color} />
  );
}

/** Rengi biraz koyulaştırır (#rrggbb). */
export function darken(hex: string, amt = 0.15): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** İten robot. Yerel: tekerlek tabanı (0,0), sağa bakar; eller (92,-170). */
export function Robot({ x, y, s = 1, glow = false }: { x: number; y: number; s?: number; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={3} rx={70} ry={9} fill="#000" opacity={0.12} />
      <rect x={-52} y={-40} width={104} height={30} rx={14} fill="#3b4354" />
      <circle cx={-30} cy={-14} r={15} fill="#252b37" />
      <circle cx={30} cy={-14} r={15} fill="#252b37" />
      <circle cx={-30} cy={-14} r={5} fill="#8a94a6" />
      <circle cx={30} cy={-14} r={5} fill="#8a94a6" />
      <rect x={-46} y={-190} width={92} height={150} rx={26} fill="#515b70" />
      <rect x={-30} y={-160} width={60} height={56} rx={12} fill="#3b4354" />
      <circle cx={0} cy={-132} r={14} fill={glow ? '#ffd166' : '#ffc93c'} opacity={glow ? 1 : 0.85} />
      <path d="M-46 -176 C 10 -186, 60 -182, 92 -178" stroke="#6a748a" strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d="M-40 -150 C 10 -158, 60 -156, 90 -158" stroke="#5f687d" strokeWidth={16} fill="none" strokeLinecap="round" />
      <rect x={80} y={-192} width={22} height={46} rx={8} fill="#ffc93c" />
      <rect x={-6} y={-212} width={12} height={24} rx={4} fill="#3b4354" />
      <rect x={-42} y={-290} width={96} height={82} rx={28} fill="#646f86" />
      <rect x={-22} y={-272} width={66} height={36} rx={16} fill="#1f2633" />
      <circle cx={0} cy={-254} r={7} fill="#5be0b3" />
      <circle cx={26} cy={-254} r={7} fill="#5be0b3" />
      <line x1={6} y1={-290} x2={6} y2={-312} stroke="#646f86" strokeWidth={6} strokeLinecap="round" />
      <circle cx={6} cy={-318} r={9} fill="#ffc93c" />
    </g>
  );
}
