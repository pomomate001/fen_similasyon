import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { IconBulb, IconCheck } from './icons';

export function ModelBadge({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="badge-model" style={style} data-testid="model-badge">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.2" strokeLinecap="round" />
      </svg>
      {children}
    </div>
  );
}

/** Bilgi kartı görünür kalma süresi (ms); ardından yumuşakça söner ve kaldırılır */
export const FEEDBACK_MS = 4000;
const FEEDBACK_FADE_MS = 450;

/**
 * Kısa geri bildirim kartı (onay ✓ veya ipucu ampulü). Ekranda kalıcı kalmaz:
 * FEEDBACK_MS sonra kaybolur. `token` her yeni geri bildirimde değişir (aynı metin
 * tekrar gösterildiğinde de kart yeniden belirir).
 */
export function Feedback({
  kind,
  children,
  style,
  token,
}: {
  kind: 'ok' | 'hint';
  children: ReactNode;
  style?: CSSProperties;
  token?: unknown;
}) {
  const [stage, setStage] = useState<'show' | 'fade' | 'gone'>('show');
  useEffect(() => {
    setStage('show');
    const t1 = window.setTimeout(() => setStage('fade'), FEEDBACK_MS);
    const t2 = window.setTimeout(() => setStage('gone'), FEEDBACK_MS + FEEDBACK_FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [token, kind, children]);
  if (stage === 'gone') return null;
  return (
    <div
      className={`feedback ${kind} ${stage === 'fade' ? 'leaving' : ''}`}
      style={style}
      role="status"
      data-testid={`feedback-${kind}`}
    >
      {kind === 'ok' ? <IconCheck /> : <IconBulb />}
      <span>{children}</span>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  format,
  disabled,
  testId,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  disabled?: boolean;
  testId?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v * 1000) / 1000));
  return (
    <div className="stepper" data-testid={testId}>
      <button className="btn" aria-label="Azalt" disabled={disabled || value <= min} onClick={() => onChange(clamp(value - step))}>
        −
      </button>
      <span className="value">{format ? format(value) : value}</span>
      <button className="btn" aria-label="Artır" disabled={disabled || value >= max} onClick={() => onChange(clamp(value + step))}>
        +
      </button>
    </div>
  );
}

/** Başarı anı: yumuşak ışık halkası + onay rozeti (SVG içinde) */
export function SuccessBurst({ x, y, r = 120 }: { x: number; y: number; r?: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <g className="success-burst" pointerEvents="none">
      <circle cx={x} cy={y} r={r} fill="none" stroke="var(--success)" strokeWidth={6} className="burst-ring" />
      {rays.map((a, i) => (
        <line
          key={i}
          x1={x + Math.cos(a) * r * 0.75}
          y1={y + Math.sin(a) * r * 0.75}
          x2={x + Math.cos(a) * r * 1.05}
          y2={y + Math.sin(a) * r * 1.05}
          stroke={i % 2 ? '#ffd166' : 'var(--success)'}
          strokeWidth={6}
          strokeLinecap="round"
          className="burst-ray"
        />
      ))}
    </g>
  );
}

/** Kazanılan kural kartı */
export function RuleCard({
  title,
  children,
  style,
  index,
}: {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  index?: number;
}) {
  return (
    <div className="rule-card" style={style} data-testid="rule-card">
      <div className="rule-card-tag">Kural Kartı{index ? ` ${index}` : ''}</div>
      <div className="rule-card-title">{title}</div>
      <div className="rule-card-body">{children}</div>
    </div>
  );
}
