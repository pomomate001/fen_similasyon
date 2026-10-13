/**
 * Doğa illüstrasyonları. Arka plan bilinçli olarak düşük doygunlukta tutulur;
 * böylece göz önce yüksek doygunluktaki kuvvet oklarını görür.
 */
import type { Ref, SVGProps } from 'react';

export function SkyDefs() {
  return (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bfe0ee" />
        <stop offset="0.65" stopColor="#e4f1ee" />
        <stop offset="1" stopColor="#f3f1e4" />
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6cf" />
        <stop offset="0.55" stopColor="#ffeaa6" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffe9a0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b9d9b7" />
        <stop offset="1" stopColor="#a6cda6" />
      </linearGradient>
      <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9fca94" />
        <stop offset="1" stopColor="#8dbd85" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8d08a" />
        <stop offset="1" stopColor="#92bf74" />
      </linearGradient>
      <radialGradient id="apple" cx="0.36" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#e65a5f" />
        <stop offset="0.55" stopColor="#c2283a" />
        <stop offset="1" stopColor="#8a1626" />
      </radialGradient>
      <radialGradient id="leafy" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#7dbb6d" />
        <stop offset="1" stopColor="#4f8d4b" />
      </radialGradient>
      <radialGradient id="leafyDark" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#68a85d" />
        <stop offset="1" stopColor="#3f7840" />
      </radialGradient>
      <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7a4e33" />
        <stop offset="0.5" stopColor="#946143" />
        <stop offset="1" stopColor="#6c4329" />
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

export function Sky({ width = 1920, height = 1080 }: { width?: number; height?: number }) {
  return <rect width={width} height={height} fill="url(#sky)" />;
}

export function Sun({ x, y, r = 110 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2} fill="url(#sun)" />
      <circle cx={x} cy={y} r={r * 0.6} fill="#fff4c9" />
    </g>
  );
}

export function Cloud({ x, y, s = 1, opacity = 0.9 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <path
        d="M-120 30 C-150 30 -150 -10 -115 -12 C-110 -48 -55 -55 -38 -25 C-20 -62 50 -60 58 -18 C95 -30 125 0 108 30 Z"
        fill="#ffffff"
      />
    </g>
  );
}

export function Hills({ groundY = 860 }: { groundY?: number }) {
  return (
    <g>
      <path
        d={`M0 ${groundY - 190} C 260 ${groundY - 300}, 520 ${groundY - 210}, 760 ${groundY - 250} C 1000 ${groundY - 290}, 1260 ${groundY - 180}, 1500 ${groundY - 240} C 1700 ${groundY - 285}, 1840 ${groundY - 230}, 1920 ${groundY - 250} L1920 ${groundY} L0 ${groundY} Z`}
        fill="url(#hillFar)"
      />
      <path
        d={`M0 ${groundY - 90} C 300 ${groundY - 170}, 640 ${groundY - 60}, 980 ${groundY - 120} C 1300 ${groundY - 175}, 1600 ${groundY - 80}, 1920 ${groundY - 130} L1920 ${groundY} L0 ${groundY} Z`}
        fill="url(#hillNear)"
      />
    </g>
  );
}

export function Ground({ y = 860, height = 220 }: { y?: number; height?: number }) {
  return (
    <g>
      <rect x={0} y={y} width={1920} height={height} fill="url(#ground)" />
      <path d={`M0 ${y} H1920`} stroke="#86b46c" strokeWidth={4} />
      {Array.from({ length: 34 }, (_, i) => {
        const gx = 30 + i * 57 + ((i * 37) % 23);
        const gy = y + 26 + ((i * 53) % 90);
        return (
          <path
            key={i}
            d={`M${gx} ${gy} q4 -16 9 -20 M${gx + 6} ${gy} q2 -13 -4 -18`}
            stroke="#7fae64"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

export function Flower({ x, y, color = '#f6c34a', s = 1 }: { x: number; y: number; color?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V-34" stroke="#5f9550" strokeWidth={4} strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-44} rx={7} ry={11} fill={color} transform={`rotate(${a} 0 -36)`} />
      ))}
      <circle cx={0} cy={-36} r={6} fill="#fff1c1" />
    </g>
  );
}

/** Elma: (0,0) merkezli, yaklaşık 104 px genişlik. */
export function Apple({
  x = 0,
  y = 0,
  s = 1,
  stem = true,
  ...rest
}: { x?: number; y?: number; s?: number; stem?: boolean } & SVGProps<SVGGElement>) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...rest}>
      <ellipse cx={0} cy={56} rx={34} ry={7} fill="#000" opacity={0} />
      <path
        d="M0 -30 C 24 -50 56 -34 53 4 C 51 40 26 62 0 55 C -26 62 -51 40 -53 4 C -56 -34 -24 -50 0 -30 Z"
        fill="url(#apple)"
        stroke="#7c1422"
        strokeWidth={2.5}
      />
      <ellipse cx={-22} cy={-10} rx={10} ry={17} fill="#fff" opacity={0.35} transform="rotate(20 -22 -10)" />
      {stem && (
        <>
          <path d="M0 -30 C 1 -42 4 -50 8 -58" stroke="#6b4429" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M6 -48 C 20 -64 42 -60 46 -52 C 34 -42 16 -42 6 -48 Z" fill="#6aa553" stroke="#4d8a3f" strokeWidth={2} />
        </>
      )}
    </g>
  );
}

/**
 * Elma ağacı. Elmanın asılı olduğu dal ucu: (appleX, appleY - 58).
 * Parçalar ref ile verilir; sahne bunları sırayla "çizerek" oluşturur.
 */
export interface TreeRefs {
  trunk?: Ref<SVGGElement>;
  branches?: Ref<SVGGElement>;
  canopy?: Ref<SVGGElement>;
}

export function AppleTree({
  baseX,
  groundY,
  branchTip,
  refs = {},
}: {
  baseX: number;
  groundY: number;
  branchTip: { x: number; y: number };
  refs?: TreeRefs;
}) {
  const bx = baseX;
  const top = groundY - 470;
  const blobs: Array<[number, number, number, string]> = [
    [bx - 210, top + 10, 120, 'url(#leafyDark)'],
    [bx + 170, top - 10, 130, 'url(#leafyDark)'],
    [bx - 80, top - 120, 150, 'url(#leafy)'],
    [bx + 90, top - 140, 140, 'url(#leafy)'],
    [bx - 170, top - 40, 120, 'url(#leafy)'],
    [bx + 220, top - 70, 110, 'url(#leafy)'],
    [bx, top - 30, 160, 'url(#leafy)'],
    [bx - 40, top - 230, 110, 'url(#leafy)'],
    [bx + 120, top + 40, 100, 'url(#leafyDark)'],
  ];
  return (
    <g>
      <g ref={refs.trunk}>
        <ellipse cx={bx} cy={groundY + 6} rx={150} ry={20} fill="#6f9a57" opacity={0.45} />
        <path
          d={`M${bx - 46} ${groundY} C ${bx - 30} ${groundY - 140}, ${bx - 40} ${groundY - 300}, ${bx - 22} ${top + 40} L ${bx + 26} ${top + 40} C ${bx + 40} ${groundY - 300}, ${bx + 32} ${groundY - 140}, ${bx + 50} ${groundY} Z`}
          fill="url(#trunk)"
        />
        <path d={`M${bx - 8} ${groundY - 60} c 6 -40 -4 -90 4 -140`} stroke="#6a422b" strokeWidth={4} fill="none" opacity={0.6} />
      </g>
      <g ref={refs.branches} fill="none" stroke="#7d5136" strokeLinecap="round">
        <path className="ink" d={`M${bx + 10} ${top + 120} C ${bx + 110} ${top + 80}, ${branchTip.x - 160} ${branchTip.y - 6}, ${branchTip.x + 30} ${branchTip.y - 10}`} strokeWidth={20} />
        <path className="ink" d={`M${bx - 10} ${top + 110} C ${bx - 90} ${top + 60}, ${bx - 170} ${top + 40}, ${bx - 230} ${top - 10}`} strokeWidth={18} />
        <path className="ink" d={`M${branchTip.x - 120} ${branchTip.y + 6} c 30 -40 60 -60 90 -66`} strokeWidth={9} />
      </g>
      <g ref={refs.canopy}>
        {blobs.map(([cx, cy, r, f], i) => (
          <circle key={i} className="blob" cx={cx} cy={cy} r={r} fill={f} />
        ))}
        {/* yaprak dokusu */}
        <g className="blob">
          {Array.from({ length: 46 }, (_, i) => {
            const a = (i * 137.5 * Math.PI) / 180;
            const d = 40 + ((i * 53) % 190);
            const lx = bx + Math.cos(a) * d * 1.25;
            const ly = top - 70 + Math.sin(a) * d * 0.8;
            return (
              <ellipse
                key={i}
                cx={lx}
                cy={ly}
                rx={15}
                ry={8}
                fill={i % 3 === 0 ? '#8cc77a' : '#3f7a3f'}
                opacity={i % 3 === 0 ? 0.55 : 0.35}
                transform={`rotate(${(i * 47) % 180} ${lx} ${ly})`}
              />
            );
          })}
        </g>
        {/* yaprak kümeleri dal ucunda */}
        <g className="blob">
          <ellipse cx={branchTip.x + 26} cy={branchTip.y - 26} rx={38} ry={20} fill="#69a65a" transform={`rotate(-25 ${branchTip.x + 26} ${branchTip.y - 26})`} />
          <ellipse cx={branchTip.x - 30} cy={branchTip.y - 30} rx={34} ry={18} fill="#5c9a50" transform={`rotate(20 ${branchTip.x - 30} ${branchTip.y - 30})`} />
          <ellipse cx={branchTip.x + 58} cy={branchTip.y - 2} rx={30} ry={16} fill="#77b367" transform={`rotate(10 ${branchTip.x + 58} ${branchTip.y - 2})`} />
        </g>
      </g>
    </g>
  );
}
