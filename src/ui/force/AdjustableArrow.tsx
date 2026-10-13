import { useRef } from 'react';
import { pxPerNewton, type Axis, type Scale, type Sign } from '../../physics/forces';
import { useDrag } from '../interaction';
import { useStage } from '../Stage';
import { ForceArrow, type ArrowKind } from './ForceArrow';

export interface AdjustableArrowProps {
  /** Uygulama noktası */
  x: number;
  y: number;
  axis: Axis;
  /** İşaretli değer (N): + doğu/yukarı, − batı/aşağı */
  value: number;
  onChange: (v: number) => void;
  scale: Scale;
  /** En büyük büyüklük (N) */
  max: number;
  /** Izgaraya oturma adımı (N) */
  step: number;
  /** Ok sıfırın öbür tarafına sürüklenerek ters çevrilebilir mi */
  allowFlip?: boolean;
  /** allowFlip=false iken izin verilen tek yön */
  fixedSign?: Sign;
  kind?: ArrowKind;
  label?: (v: number) => string | undefined;
  sublabel?: string;
  labelPos?: 'auto' | 'left' | 'right' | 'above' | 'below' | 'tip';
  disabled?: boolean;
  testId?: string;
  onCommit?: (v: number) => void;
  /** Eksen boyunca dokunma şeridinin yarı kalınlığı (px) */
  trackHalf?: number;
}

/**
 * Ucundan sürüklenerek (veya eksen üzerinde bir yere dokunularak) büyüklüğü ve
 * yönü ayarlanan ok. Değer daima adım katlarına oturur; ok uzunluğu daima
 * |değer| × ölçek'tir.
 */
export function AdjustableArrow({
  x,
  y,
  axis,
  value,
  onChange,
  scale,
  max,
  step,
  allowFlip = false,
  fixedSign = 1,
  kind = 'force',
  label,
  sublabel,
  labelPos,
  disabled,
  testId,
  onCommit,
  trackHalf = 46,
}: AdjustableArrowProps) {
  const ppn = pxPerNewton(scale);
  const { toStage } = useStage();
  const last = useRef(value);
  last.current = value;

  const fromPoint = (p: { x: number; y: number }) => {
    const signedPx = axis === 'yatay' ? p.x - x : y - p.y;
    let v = Math.round(signedPx / ppn / step) * step;
    if (!allowFlip) v = fixedSign === 1 ? Math.max(0, v) : Math.min(0, v);
    v = Math.max(-max, Math.min(max, v));
    return Math.round(v * 1000) / 1000;
  };

  const set = (v: number) => {
    if (v !== last.current) onChange(v);
  };

  const drag = useDrag({
    disabled,
    onMove: (p) => set(fromPoint(p)),
    onEnd: (p, moved) => {
      if (moved) {
        const v = fromPoint(p);
        set(v);
        onCommit?.(v);
      }
    },
  });

  const sign: Sign = value > 0 ? 1 : value < 0 ? -1 : fixedSign;
  const len = Math.abs(value) * ppn;
  const tip = axis === 'yatay' ? { x: x + sign * len, y } : { x, y: y - sign * len };

  // Eksen boyunca dokunma şeridi: hassas sürükleme gerekmeden değer seçilebilir
  const span = max * ppn;
  const neg = allowFlip || fixedSign === -1 ? span : 0;
  const pos = allowFlip || fixedSign === 1 ? span : 0;
  const track =
    axis === 'yatay'
      ? { x: x - neg, y: y - trackHalf, w: neg + pos, h: trackHalf * 2 }
      : { x: x - trackHalf, y: y - pos, w: trackHalf * 2, h: neg + pos };

  const onTrackDown = (e: React.PointerEvent) => {
    if (disabled || !e.isPrimary) return;
    const v = fromPoint(toStage(e.clientX, e.clientY));
    set(v);
    onCommit?.(v);
  };

  return (
    <g data-testid={testId} data-value={value}>
      {!disabled && (
        <rect
          x={track.x}
          y={track.y}
          width={track.w}
          height={track.h}
          fill="transparent"
          onPointerDown={onTrackDown}
          style={{ cursor: 'pointer' }}
        />
      )}
      <ForceArrow
        x={x}
        y={y}
        axis={axis}
        sign={sign}
        length={len}
        kind={kind}
        label={label?.(value)}
        sublabel={sublabel}
        labelPos={labelPos}
        magnitude={Math.abs(value)}
      />
      {!disabled && (
        <g {...drag} className="draggable" data-testid={testId ? `${testId}-handle` : undefined}>
          <circle cx={tip.x} cy={tip.y} r={54} fill="transparent" />
          <circle
            cx={tip.x}
            cy={tip.y}
            r={26}
            fill="#fff"
            stroke={kind === 'resultant' || kind === 'ghost' ? 'var(--resultant)' : 'var(--interact)'}
            strokeWidth={6}
            className={value === 0 ? 'handle-idle' : undefined}
          />
          <circle cx={tip.x} cy={tip.y} r={8} fill={kind === 'resultant' || kind === 'ghost' ? 'var(--resultant)' : 'var(--interact)'} />
        </g>
      )}
    </g>
  );
}
