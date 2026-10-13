import type { ReactNode, Ref } from 'react';
import { Cloud, Flower, Ground, Hills, SkyDefs, Sky, Sun } from '../../art/nature';
import { ObjectDefs } from '../../art/objects';

export const GROUND_Y = 880;
/** Elma ağacı yerleşimi (S1–S3 ortak) */
export const TREE = { baseX: 560, branchTip: { x: 1040, y: 360 } };
/** Dalda asılı elmanın merkezi */
export const APPLE_HANG = { x: 1040, y: 418 };
/** Yerdeki elmanın merkezi (elmanın alt ucu zemine değer) */
export const APPLE_GROUND_Y = GROUND_Y - 52;

export function SceneSvg({ children, className, svgRef }: { children: ReactNode; className?: string; svgRef?: Ref<SVGSVGElement> }) {
  return (
    <svg ref={svgRef} className={`scene-svg ${className ?? ''}`} viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <SkyDefs />
      <ObjectDefs />
      {children}
    </svg>
  );
}

export interface LandscapeRefs {
  sun?: Ref<SVGGElement>;
  clouds?: Ref<SVGGElement>;
  hills?: Ref<SVGGElement>;
  ground?: Ref<SVGGElement>;
  flowers?: Ref<SVGGElement>;
}

/** Sakin doğa arka planı */
export function Landscape({ refs = {}, hidden = false }: { refs?: LandscapeRefs; hidden?: boolean }) {
  const h = hidden ? { opacity: 0 } : undefined;
  return (
    <g>
      <Sky />
      <g ref={refs.sun} style={h}>
        <Sun x={1640} y={210} />
      </g>
      <g ref={refs.clouds} style={h}>
        <Cloud x={380} y={190} s={1.1} />
        <Cloud x={1250} y={150} s={0.8} opacity={0.75} />
        <Cloud x={1760} y={360} s={0.6} opacity={0.6} />
      </g>
      <g ref={refs.hills} style={h}>
        <Hills groundY={GROUND_Y} />
      </g>
      <g ref={refs.ground} style={h}>
        <Ground y={GROUND_Y} height={1080 - GROUND_Y} />
      </g>
      <g ref={refs.flowers} style={h}>
        <Flower x={220} y={GROUND_Y + 40} />
        <Flower x={300} y={GROUND_Y + 70} color="#f39ab4" s={0.8} />
        <Flower x={1330} y={GROUND_Y + 50} color="#c9a7f5" s={0.9} />
        <Flower x={1440} y={GROUND_Y + 80} s={0.75} />
        <Flower x={1700} y={GROUND_Y + 45} color="#f39ab4" />
      </g>
    </g>
  );
}

/** Eğik ok (Dünya küresi çiziminde, merkeze yönelen kuvvetler için) */
export function PolarArrow({
  x,
  y,
  angle,
  length,
  progress = 1,
  color = 'var(--force)',
  width = 9,
}: {
  x: number;
  y: number;
  /** derece, 0 = sağ, 90 = aşağı (SVG) */
  angle: number;
  length: number;
  progress?: number;
  color?: string;
  width?: number;
}) {
  const L = length * progress;
  if (L < 1) return null;
  const a = (angle * Math.PI) / 180;
  const tx = x + Math.cos(a) * L;
  const ty = y + Math.sin(a) * L;
  const hl = Math.min(width * 2.4, L * 0.6);
  const bx = tx - Math.cos(a) * hl;
  const by = ty - Math.sin(a) * hl;
  const px = -Math.sin(a) * width * 1.3;
  const py = Math.cos(a) * width * 1.3;
  return (
    <g>
      <line x1={x} y1={y} x2={bx} y2={by} stroke="#fff" strokeWidth={width + 6} strokeLinecap="round" />
      <line x1={x} y1={y} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} />
    </g>
  );
}

/** "Zaman durduruldu" rozeti */
export function FreezeBadge({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="fade-in" data-testid="freeze-badge">
      <rect x={-185} y={-34} width={370} height={68} rx={34} fill="rgba(27,35,51,0.85)" />
      <rect x={-152} y={-14} width={9} height={28} rx={3} fill="#fff" />
      <rect x={-136} y={-14} width={9} height={28} rx={3} fill="#fff" />
      <text x={-108} y={10} textAnchor="start" fontSize={28} fontWeight={650} fill="#fff">
        Zaman durduruldu
      </text>
    </g>
  );
}
