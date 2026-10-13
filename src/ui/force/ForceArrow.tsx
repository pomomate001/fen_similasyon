import type { Axis, Sign } from '../../physics/forces';
import { screenVector } from '../../physics/forces';

export type ArrowKind = 'force' | 'resultant' | 'ghost' | 'neutral' | 'faded';

const COLORS: Record<ArrowKind, { fill: string; dark: string }> = {
  force: { fill: 'var(--force)', dark: 'var(--force-dark)' },
  resultant: { fill: 'var(--resultant)', dark: 'var(--resultant-dark)' },
  ghost: { fill: 'rgba(31,111,229,0.28)', dark: 'var(--resultant)' },
  neutral: { fill: '#7b879b', dark: '#4f5a6d' },
  faded: { fill: 'rgba(229,56,59,0.25)', dark: 'rgba(168,29,36,0.5)' },
};

export interface ForceArrowProps {
  /** Uygulama noktası (okun başladığı yer) */
  x: number;
  y: number;
  axis: Axis;
  sign: Sign;
  /** Okun tam uzunluğu (piksel) — daima büyüklük × ölçek ile hesaplanmalıdır */
  length: number;
  /** 0–1 arası çizim ilerlemesi (ok uygulama noktasından büyüyerek oluşur) */
  progress?: number;
  kind?: ArrowKind;
  label?: string;
  sublabel?: string;
  labelPos?: 'auto' | 'left' | 'right' | 'above' | 'below' | 'tip';
  labelGap?: number;
  thickness?: number;
  /** Uygulama noktasını göster */
  showPoint?: boolean;
  highlightHead?: boolean;
  highlightPoint?: boolean;
  opacity?: number;
  /** Test ve erişilebilirlik için: kuvvetin büyüklüğü (N) */
  magnitude?: number;
  testId?: string;
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
  className?: string;
}

/**
 * Kuvvet oku. Yönü (sign), doğrultusu (axis) ve uzunluğu (length) dışarıdan,
 * fizik modülünün hesapladığı değerlerden gelir.
 */
export function ForceArrow({
  x,
  y,
  axis,
  sign,
  length,
  progress = 1,
  kind = 'force',
  label,
  sublabel,
  labelPos = 'auto',
  labelGap = 22,
  thickness,
  showPoint = false,
  highlightHead = false,
  highlightPoint = false,
  opacity = 1,
  magnitude,
  testId,
  onPointerDown,
  className,
}: ForceArrowProps) {
  const t = thickness ?? (kind === 'resultant' || kind === 'ghost' ? 18 : 14);
  const headLen = t * 2.3;
  const headW = t * 2.5;
  const L = Math.max(0, length * Math.max(0, Math.min(1, progress)));
  const { dx, dy } = screenVector(axis, sign);
  const tipX = x + dx * L;
  const tipY = y + dy * L;
  const h = Math.min(headLen, L * 0.6);
  const baseX = tipX - dx * h;
  const baseY = tipY - dy * h;
  // dik birim vektör
  const px = -dy;
  const py = dx;
  const hw = (headW / 2) * (h / headLen || 0);
  const c = COLORS[kind];
  const dashed = kind === 'ghost';

  const midX = x + (dx * L) / 2;
  const midY = y + (dy * L) / 2;
  let pos = labelPos;
  if (pos === 'auto') pos = axis === 'dusey' ? 'right' : 'above';
  let lx = midX;
  let ly = midY;
  let anchor: 'start' | 'middle' | 'end' = 'middle';
  const off = labelGap + t / 2;
  if (pos === 'right') {
    lx = midX + off;
    anchor = 'start';
  } else if (pos === 'left') {
    lx = midX - off;
    anchor = 'end';
  } else if (pos === 'above') {
    ly = midY - off - (sublabel ? 34 : 4);
  } else if (pos === 'below') {
    ly = midY + off + 30;
  } else if (pos === 'tip') {
    lx = tipX + dx * (off + 8);
    ly = tipY + dy * (off + 8) + (axis === 'yatay' ? 12 : sign === 1 ? -6 : 30);
    anchor = axis === 'yatay' ? (sign === 1 ? 'start' : 'end') : 'middle';
  }
  const verticalShift = pos === 'right' || pos === 'left' ? (sublabel ? -6 : 12) : 0;

  return (
    <g
      className={className}
      opacity={opacity}
      data-testid={testId}
      data-axis={axis}
      data-sign={sign}
      data-length={Math.round(length * 100) / 100}
      data-magnitude={magnitude}
      data-kind={kind}
      onPointerDown={onPointerDown}
      pointerEvents={onPointerDown ? undefined : 'none'}
      style={onPointerDown ? { cursor: 'pointer' } : undefined}
    >
      {L > 0.5 && (
        <>
          {/* beyaz kontur: her arka planda okunabilirlik */}
          <line
            x1={x}
            y1={y}
            x2={baseX}
            y2={baseY}
            stroke="#fff"
            strokeWidth={t + 8}
            strokeLinecap="round"
            opacity={dashed ? 0 : 0.95}
          />
          <polygon
            points={`${tipX + dx * 3},${tipY + dy * 3} ${baseX + px * (hw + 4)},${baseY + py * (hw + 4)} ${baseX - px * (hw + 4)},${baseY - py * (hw + 4)}`}
            fill="#fff"
            opacity={dashed ? 0 : 0.95}
            strokeLinejoin="round"
          />
          <line
            x1={x}
            y1={y}
            x2={baseX + dx * 2}
            y2={baseY + dy * 2}
            stroke={dashed ? c.dark : c.fill}
            strokeWidth={dashed ? 5 : t}
            strokeDasharray={dashed ? '14 10' : undefined}
            strokeLinecap={dashed ? 'butt' : 'round'}
          />
          {dashed && <line x1={x} y1={y} x2={baseX} y2={baseY} stroke={c.fill} strokeWidth={t} />}
          <polygon
            points={`${tipX},${tipY} ${baseX + px * hw},${baseY + py * hw} ${baseX - px * hw},${baseY - py * hw}`}
            fill={c.fill}
            stroke={c.dark}
            strokeWidth={dashed ? 4 : 2}
            strokeDasharray={dashed ? '8 6' : undefined}
            strokeLinejoin="round"
          />
          {highlightHead && (
            <circle cx={tipX - dx * h * 0.4} cy={tipY - dy * h * 0.4} r={headW * 0.95} className="glow-ring" />
          )}
        </>
      )}
      {(showPoint || highlightPoint) && (
        <g>
          {highlightPoint && <circle cx={x} cy={y} r={30} className="glow-ring" />}
          <circle cx={x} cy={y} r={11} fill="var(--point)" stroke="#fff" strokeWidth={4} />
        </g>
      )}
      {label && L > 1 && (
        <text
          x={lx}
          y={ly + verticalShift}
          textAnchor={anchor}
          className="svg-label"
          fontSize={kind === 'resultant' ? 38 : 34}
          fill={kind === 'resultant' || kind === 'ghost' ? 'var(--resultant-dark)' : kind === 'neutral' ? '#3d4757' : 'var(--force-dark)'}
        >
          {label}
          {sublabel && (
            <tspan x={lx} dy={34} fontSize={24} fontWeight={550} fill="var(--ink-soft)">
              {sublabel}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
}
